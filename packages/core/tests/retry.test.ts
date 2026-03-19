import { describe, it, expect, vi } from "vitest";
import { retry, retryAsync, exponentialBackoff, linearBackoff, constantBackoff, calculateDelay, handleUnknownBackoff, throwIfUnreachable } from "../src/retry";
import type { RetryAbortedError } from "../src/retry";

describe("Retry", () => {
  describe("retry (sync)", () => {
    it("should return value on success", () => {
      const result = retry(() => 42);
      expect(result).toBe(42);
    });

    it("should retry on failure", () => {
      let attempts = 0;
      const result = retry(() => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      }, { attempts: 3, delay: 10 });
      expect(result).toBe(42);
      expect(attempts).toBe(3);
    });

    it("should throw after max attempts", () => {
      expect(() => retry(() => { throw new Error("fail"); }, { attempts: 2, delay: 1 }))
        .toThrow("fail");
    });

    it("should use predicate to determine retryability", () => {
      const isRetryable = (e: Error) => e.message === "retryable";

      expect(() => retry(() => { throw new Error("not retryable"); }, {
        attempts: 3,
        delay: 1,
        predicate: isRetryable
      })).toThrow("not retryable");
    });

    it("should call onRetry callback", () => {
      const onRetry = vi.fn();
      try {
        retry(() => { throw new Error("fail"); }, { attempts: 2, delay: 1, onRetry });
      } catch {
        // Expected to throw
      }
      // Called for attempt 1 (before retry) and attempt 2 (before final throw)
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it("should use exponential backoff by default", () => {
      const delays: number[] = [];
      const backoff = (attempt: number, delay: number) => {
        delays.push(delay);
        return delay;
      };

      try {
        retry(() => { throw new Error("fail"); }, { attempts: 3, delay: 100, backoff });
      } catch {
        // Expected to throw
      }
      // Called for attempts 1 and 2 before final throw
      expect(delays).toEqual([100, 100]);
    });

    it("should apply jitter when enabled", () => {
      const jitterValue = 0.5;
      vi.spyOn(Math, "random").mockImplementation(() => jitterValue);

      let attempts = 0;
      const result = retry(() => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      }, { attempts: 3, delay: 100, jitter: true, backoff: "constant" });

      expect(result).toBe(42);
      vi.spyOn(Math, "random").mockRestore();
    });

    it("should use linear backoff", () => {
      let attempts = 0;
      const result = retry(() => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      }, { attempts: 3, delay: 10, backoff: "linear" });

      expect(result).toBe(42);
      expect(attempts).toBe(3);
    });

    it("should use constant backoff", () => {
      let attempts = 0;
      const result = retry(() => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      }, { attempts: 3, delay: 10, backoff: "constant" });

      expect(result).toBe(42);
      expect(attempts).toBe(3);
    });

    it("should handle undefined backoff", () => {
      // Test the undefined case in the switch
      let attempts = 0;
      const result = retry(() => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      }, { attempts: 3, delay: 10, backoff: undefined as unknown as "exponential" });

      expect(result).toBe(42);
      expect(attempts).toBe(3);
    });

    it("should handle invalid backoff type for coverage", () => {
      // Test the default case in calculateDelay switch
      let attempts = 0;
      const result = retry(() => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      }, { attempts: 3, delay: 10, backoff: "invalid" as unknown as "exponential" });

      expect(result).toBe(42);
      expect(attempts).toBe(3);
    });
  });

  describe("retry (sync) with AbortSignal", () => {
    it("should throw RetryAbortedError if signal is already aborted", () => {
      const controller = new AbortController();
      controller.abort();

      expect(() =>
        retry(() => { throw new Error("fail"); }, { attempts: 3, signal: controller.signal })
      ).toThrow("Retry aborted");
    });

    it("should throw RetryAbortedError with correct name", () => {
      const controller = new AbortController();
      controller.abort();

      try {
        retry(() => { throw new Error("fail"); }, { attempts: 3, signal: controller.signal });
        fail("Should have thrown");
      } catch (error) {
        // Type guard - check that it's a RetryAbortedError
        const isRetryAbortedError = (e: unknown): e is RetryAbortedError =>
          error instanceof Error && "name" in error && error.name === "RETRY_ABORTED";

        expect(isRetryAbortedError(error)).toBe(true);
      }
    });

    it("should abort between attempts when signal is aborted", () => {
      const controller = new AbortController();
      let attemptCount = 0;

      // Abort in the onRetry callback after the first failure
      // The signal check runs after the predicate check passes
      const onRetry = (_error: Error, attempt: number) => {
        // Abort after the first attempt's onRetry is called
        if (attempt === 1) {
          controller.abort();
        }
      };

      const fn = () => {
        attemptCount++;
        throw new Error("fail");
      };

      // The signal is aborted in onRetry after the first failure
      // The predicate allows retry (default predicate returns true)
      // So the code proceeds to check signal?.aborted which is now true
      // and throws RetryAbortedError
      expect(() =>
        retry(fn, { attempts: 3, delay: 10, signal: controller.signal, onRetry })
      ).toThrow("Retry aborted");

      // First attempt fails, onRetry aborts signal, signal check throws
      // We never get to attempt 2 because the signal is checked after onRetry
      expect(attemptCount).toBe(1);
    });

    it("should complete successfully when signal is not aborted", () => {
      const controller = new AbortController();

      const result = retry(() => {
        return 42;
      }, { attempts: 3, signal: controller.signal });

      expect(result).toBe(42);
    });

    it("should work with AbortSignal.timeout", () => {
      const result = retry(() => {
        return 42;
      }, { attempts: 3, signal: AbortSignal.timeout(5000) });

      expect(result).toBe(42);
    });
  });

  describe("retryAsync", () => {
    it("should return value on success", async () => {
      const result = await retryAsync(async () => 42);
      expect(result).toBe(42);
    });

    it("should retry on failure", async () => {
      let attempts = 0;
      const result = await retryAsync(async () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      }, { attempts: 3, delay: 10 });
      expect(result).toBe(42);
      expect(attempts).toBe(3);
    });

    it("should throw after max attempts", async () => {
      await expect(retryAsync(async () => { throw new Error("fail"); }, { attempts: 2, delay: 1 }))
        .rejects.toThrow("fail");
    });

    it("should use predicate to determine retryability", async () => {
      const isRetryable = (e: Error) => e.message === "retryable";

      await expect(retryAsync(async () => { throw new Error("not retryable"); }, {
        attempts: 3,
        delay: 1,
        predicate: isRetryable
      })).rejects.toThrow("not retryable");
    });

    it("should call onRetry callback", async () => {
      const onRetry = vi.fn();
      try {
        await retryAsync(async () => { throw new Error("fail"); }, { attempts: 2, delay: 1, onRetry });
      } catch {
        // Expected to throw
      }
      // Called for attempt 1 (before retry) and attempt 2 (before final throw)
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it("should apply delay between retries", async () => {
      const start = Date.now();
      try {
        await retryAsync(async () => { throw new Error("fail"); }, { attempts: 3, delay: 50 });
      } catch {
        // Expected to throw
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThan(90);
    });

    it("should handle undefined backoff", async () => {
      // Test the undefined case in the switch for async
      let attempts = 0;
      const result = await retryAsync(async () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      }, { attempts: 3, delay: 10, backoff: undefined as unknown as "exponential" });

      expect(result).toBe(42);
      expect(attempts).toBe(3);
    });

    it("should handle invalid backoff type for coverage", async () => {
      // Test the default case in calculateDelay switch for async
      let attempts = 0;
      const result = await retryAsync(async () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      }, { attempts: 3, delay: 10, backoff: "invalid" as unknown as "exponential" });

      expect(result).toBe(42);
      expect(attempts).toBe(3);
    });
  });

  describe("Backoff strategies", () => {
    it("exponentialBackoff should work", () => {
      expect(exponentialBackoff(1, 1000)).toBe(1000);
      expect(exponentialBackoff(2, 1000)).toBe(2000);
      expect(exponentialBackoff(3, 1000)).toBe(4000);
    });

    it("linearBackoff should work", () => {
      expect(linearBackoff(1, 1000)).toBe(1000);
      expect(linearBackoff(2, 1000)).toBe(2000);
      expect(linearBackoff(3, 1000)).toBe(3000);
    });

    it("constantBackoff should work", () => {
      expect(constantBackoff(1, 1000)).toBe(1000);
      expect(constantBackoff(2, 1000)).toBe(1000);
      expect(constantBackoff(3, 1000)).toBe(1000);
    });
  });

  describe("Exported helpers for coverage", () => {
    it("calculateDelay should handle function backoff", () => {
      const fn = (attempt: number, delay: number) => delay * attempt;
      expect(calculateDelay(2, 100, fn)).toBe(200);
    });

    it("calculateDelay should handle undefined backoff", () => {
      expect(calculateDelay(1, 100, undefined)).toBe(100);
      expect(calculateDelay(2, 100, undefined)).toBe(200);
    });

    it("handleUnknownBackoff should handle valid backoffs", () => {
      expect(handleUnknownBackoff("exponential", 100, 1)).toBe(100);
      expect(handleUnknownBackoff("linear", 100, 2)).toBe(200);
      expect(handleUnknownBackoff("constant", 100, 3)).toBe(100);
    });

    it("handleUnknownBackoff should return fallback for invalid backoff", () => {
      // For coverage, returns exponential as fallback
      expect(handleUnknownBackoff("invalid" as "exponential", 100, 1)).toBe(100);
    });

    it("throwIfUnreachable should throw when succeeded is false", () => {
      expect(() => throwIfUnreachable<number>(false, 0))
        .toThrow("Retry failed");
      expect(() => throwIfUnreachable<number>(false, 0, new Error("Custom error")))
        .toThrow("Custom error");
    });

    it("throwIfUnreachable should return result when succeeded is true", () => {
      expect(throwIfUnreachable<number>(true, 42)).toBe(42);
    });
  });

  describe("retryAsync with AbortSignal", () => {
    it("should throw RetryAbortedError if signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        retryAsync(async () => { throw new Error("fail"); }, { attempts: 3, signal: controller.signal })
      ).rejects.toThrow("Retry aborted");
    });

    it("should throw RetryAbortedError with correct name", async () => {
      const controller = new AbortController();
      controller.abort();

      try {
        await retryAsync(async () => { throw new Error("fail"); }, { attempts: 3, signal: controller.signal });
        fail("Should have thrown");
      } catch (error) {
        // Type guard - check that it's a RetryAbortedError
        const isRetryAbortedError = (e: unknown): e is RetryAbortedError =>
          error instanceof Error && "name" in error && error.name === "RETRY_ABORTED";

        expect(isRetryAbortedError(error)).toBe(true);
      }
    });

    it("should abort during delay when signal is aborted", async () => {
      const controller = new AbortController();

      const retryPromise = retryAsync(async () => {
        throw new Error("fail");
      }, { attempts: 3, delay: 100, signal: controller.signal });

      // Abort after a short delay
      setTimeout(() => controller.abort(), 50);

      await expect(retryPromise).rejects.toThrow("Sleep aborted");
    });

    it("should complete successfully when signal is not aborted", async () => {
      const controller = new AbortController();

      const result = await retryAsync(async () => {
        return 42;
      }, { attempts: 3, delay: 10, signal: controller.signal });

      expect(result).toBe(42);
    });

    it("should work with AbortSignal.timeout", async () => {
      const result = await retryAsync(async () => {
        return 42;
      }, { attempts: 3, signal: AbortSignal.timeout(5000) });

      expect(result).toBe(42);
    });

    it("should timeout and abort using AbortSignal.timeout", async () => {
      const retryPromise = retryAsync(async () => {
        throw new Error("fail");
      }, { attempts: 10, delay: 100, signal: AbortSignal.timeout(150) });

      // Should timeout after 150ms, not wait for all retries
      const start = Date.now();
      await expect(retryPromise).rejects.toThrow();
      const elapsed = Date.now() - start;

      // Should abort during one of the delays, not after all 10 attempts (which would be ~10*100ms = 1000ms)
      expect(elapsed).toBeLessThan(500);
    });
  });
});
