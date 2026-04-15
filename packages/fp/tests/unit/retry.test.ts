import { describe, it, expect, vi } from "vitest";
import { retryAsync, exponentialBackoff, linearBackoff, constantBackoff, calculateDelay, RetryAbortedError } from "../../src/retry/index.js";

describe("Retry", () => {
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

    it("should cap delay with maxDelay option", async () => {
      // Use built-in exponential backoff and verify the delay is capped with timing
      const start = Date.now();
      try {
        await retryAsync(
          async () => {
            throw new Error("fail");
          },
          {
            attempts: 4,
            delay: 1000,
            backoff: "exponential",
            maxDelay: 500,
          }
        );
      } catch {
        // Expected to throw
      }
      const elapsed = Date.now() - start;

      // Without maxDelay: 1000 + 2000 + 4000 = 7000ms
      // With maxDelay: 500 + 500 + 500 = 1500ms
      // Allow some margin for test flakiness
      expect(elapsed).toBeLessThan(3000);
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

    it("calculateDelay should handle function backoff with maxDelay", () => {
      const fn = (attempt: number, delay: number) => delay * attempt;
      // 2*100 = 200, but maxDelay is 150, so result should be 150
      expect(calculateDelay(2, 100, fn, 150)).toBe(150);
    });

    it("calculateDelay should handle undefined backoff", () => {
      expect(calculateDelay(1, 100)).toBe(100);
      expect(calculateDelay(2, 100)).toBe(200);
    });

    it("calculateDelay should cap delay with maxDelay", () => {
      // Exponential: attempt 3 with delay 1000 = 4000ms, capped at 500ms
      expect(calculateDelay(3, 1000, "exponential", 500)).toBe(500);
      // Linear: attempt 5 with delay 1000 = 5000ms, capped at 500ms
      expect(calculateDelay(5, 1000, "linear", 500)).toBe(500);
      // Constant: always 1000ms, capped at 500ms
      expect(calculateDelay(10, 1000, "constant", 500)).toBe(500);
    });

    it("calculateDelay should not cap when under maxDelay", () => {
      // Exponential: attempt 1 with delay 1000 = 1000ms, maxDelay is 2000, no cap
      expect(calculateDelay(1, 1000, "exponential", 2000)).toBe(1000);
      // Linear: attempt 1 with delay 100 = 100ms, maxDelay is 500, no cap
      expect(calculateDelay(1, 100, "linear", 500)).toBe(100);
    });

    it("calculateDelay should handle undefined maxDelay (no cap)", () => {
      expect(calculateDelay(5, 1000, "exponential")).toBe(16000);
      expect(calculateDelay(5, 1000, "linear")).toBe(5000);
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
        expect(error instanceof RetryAbortedError).toBe(true);
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
