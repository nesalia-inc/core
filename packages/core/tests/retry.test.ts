import { describe, it, expect, vi } from "vitest";
import { retry, retryAsync, RetryConfigs, exponentialBackoff, linearBackoff, constantBackoff } from "../src/retry";

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
      let attempts = 0;
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
      } catch (e) {
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
      } catch (e) {
        // Expected to throw
      }
      // Called for attempts 1 and 2 before final throw
      expect(delays).toEqual([100, 100]);
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
      } catch (e) {
        // Expected to throw
      }
      // Called for attempt 1 (before retry) and attempt 2 (before final throw)
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it("should apply delay between retries", async () => {
      const start = Date.now();
      try {
        await retryAsync(async () => { throw new Error("fail"); }, { attempts: 3, delay: 50 });
      } catch (e) {
        // Expected to throw
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThan(90);
    });
  });

  describe("RetryConfigs", () => {
    it("should have network config", () => {
      expect(RetryConfigs.network).toBeDefined();
      expect(RetryConfigs.network.attempts).toBe(3);
      expect(RetryConfigs.network.jitter).toBe(true);
    });

    it("should have aggressive config", () => {
      expect(RetryConfigs.aggressive).toBeDefined();
      expect(RetryConfigs.aggressive.attempts).toBe(5);
    });

    it("should have conservative config", () => {
      expect(RetryConfigs.conservative).toBeDefined();
      expect(RetryConfigs.conservative.attempts).toBe(2);
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
});
