import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retryPolicy, retry, retryAsyncPolicy, retryAsync, exponentialBackoff, linearBackoff, constantBackoff, calculateDelay } from "../../src/retry.js";
import { isOk, isErr } from "../../src/result/index.js";

describe("Retry", () => {
  let originalRandom: () => number;

  beforeEach(() => {
    originalRandom = Math.random;
    // Mock Math.random to return predictable values for jitter testing
    Math.random = () => 0.5; // Return middle value (0.5) for predictable jitter
  });

  afterEach(() => {
    Math.random = originalRandom;
  });

  describe("retryPolicy", () => {
    it("should create policy with defaults", () => {
      const policy = retryPolicy();

      expect(policy.maxAttempts).toBe(3);
      expect(policy.initialDelay).toBe(100);
      expect(policy.maxDelay).toBe(5000);
      expect(policy.maxTotalTime).toBeUndefined();
      expect(policy.backoffMultiplier).toBe(2);
      expect(policy.jitter.enabled).toBe(true);
      expect(policy.jitter.factor).toBe(0.3);
      expect(policy.shouldRetry({} as Error)).toBe(true);
      expect(policy.hooks).toEqual({});
    });

    it("should create policy with custom options", () => {
      const onRetry = vi.fn();
      const onSuccess = vi.fn();
      const onFailure = vi.fn();

      const policy = retryPolicy({
        maxAttempts: 5,
        initialDelay: 50,
        maxDelay: 2000,
        maxTotalTime: 30000,
        backoffMultiplier: 1.5,
        jitter: { enabled: true, factor: 0.2 },
        shouldRetry: (error: Error) => error.message === "retryable",
        hooks: { onRetry, onSuccess, onFailure }
      });

      expect(policy.maxAttempts).toBe(5);
      expect(policy.initialDelay).toBe(50);
      expect(policy.maxDelay).toBe(2000);
      expect(policy.maxTotalTime).toBe(30000);
      expect(policy.backoffMultiplier).toBe(1.5);
      expect(policy.jitter.enabled).toBe(true);
      expect(policy.jitter.factor).toBe(0.2);
      expect(policy.shouldRetry(new Error("retryable"))).toBe(true);
      expect(policy.shouldRetry(new Error("not retryable"))).toBe(false);
      expect(policy.hooks.onRetry).toBe(onRetry);
      expect(policy.hooks.onSuccess).toBe(onSuccess);
      expect(policy.hooks.onFailure).toBe(onFailure);
    });

    it("should create policy with jitter disabled", () => {
      const policy = retryPolicy({
        jitter: { enabled: false, factor: 0 }
      });

      expect(policy.jitter.enabled).toBe(false);
    });
  });

  describe("retry (sync)", () => {
    it("should return ok value on success", () => {
      const policy = retryPolicy();
      const result = retry(policy, () => 42);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it("should return ok after retries when operation eventually succeeds", () => {
      let attempts = 0;
      const policy = retryPolicy({ maxAttempts: 3 });
      const result = retry(policy, () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
      expect(attempts).toBe(3);
    });

    it("should return err after max attempts exhausted", () => {
      const policy = retryPolicy({ maxAttempts: 2 });
      const result = retry(policy, () => {
        throw new Error("fail");
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe("fail");
      }
    });

    it("should respect shouldRetry filter", () => {
      const policy = retryPolicy<Error>({
        maxAttempts: 3,
        shouldRetry: (error) => error.message === "retryable"
      });

      const result = retry(policy, () => {
        throw new Error("not retryable");
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe("not retryable");
      }
    });

    it("should call onSuccess hook on success", () => {
      const onSuccess = vi.fn();
      const policy = retryPolicy({
        hooks: { onSuccess }
      });

      retry(policy, () => 42);

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(expect.any(Object), 1);
    });

    it("should call onFailure hook when all attempts fail", () => {
      const onFailure = vi.fn();
      const policy = retryPolicy({
        maxAttempts: 3,
        hooks: { onFailure }
      });

      retry(policy, () => {
        throw new Error("fail");
      });

      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledWith(
        expect.objectContaining({ message: "fail" }),
        3,
        expect.any(Array)
      );
    });

    it("should call onRetry hook before each retry", () => {
      const onRetry = vi.fn();
      const policy = retryPolicy({
        maxAttempts: 3,
        hooks: { onRetry }
      });

      retry(policy, () => {
        throw new Error("fail");
      });

      // Called for attempt 1 (before retry 2) and attempt 2 (before retry 3)
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.objectContaining({ message: "fail" }), expect.any(Number));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.objectContaining({ message: "fail" }), expect.any(Number));
    });

    it("should return err with RetryAbortedError when signal is aborted", () => {
      const controller = new AbortController();
      controller.abort();

      const policy = retryPolicy();
      const result = retry(policy, () => 42, controller.signal);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.name).toBe("RetryAbortedError");
      }
    });

    it("should return err with RetryTimeoutError when maxTotalTime exceeded", () => {
      const policy = retryPolicy({
        maxAttempts: 10,
        initialDelay: 1000, // Long delay to ensure timeout kicks in
        maxTotalTime: 50 // Very short timeout
      });

      const result = retry(policy, () => {
        throw new Error("fail");
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.name).toBe("RetryTimeoutError");
      }
    });
  });

  describe("retryAsyncPolicy", () => {
    it("should return ok value on success", async () => {
      const policy = retryPolicy();
      const result = await retryAsyncPolicy(policy, async () => 42);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it("should return ok after retries when operation eventually succeeds", async () => {
      let attempts = 0;
      const policy = retryPolicy({ maxAttempts: 3, initialDelay: 10 });
      const result = await retryAsyncPolicy(policy, async () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return 42;
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
      expect(attempts).toBe(3);
    });

    it("should return err after max attempts exhausted", async () => {
      const policy = retryPolicy({ maxAttempts: 2, initialDelay: 10 });
      const result = await retryAsyncPolicy(policy, async () => {
        throw new Error("fail");
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe("fail");
      }
    });

    it("should respect shouldRetry filter", async () => {
      const policy = retryPolicy<Error>({
        maxAttempts: 3,
        shouldRetry: (error) => error.message === "retryable",
        initialDelay: 10
      });

      const result = await retryAsyncPolicy(policy, async () => {
        throw new Error("not retryable");
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe("not retryable");
      }
    });

    it("should call onSuccess hook on success", async () => {
      const onSuccess = vi.fn();
      const policy = retryPolicy({
        hooks: { onSuccess }
      });

      await retryAsyncPolicy(policy, async () => 42);

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(expect.any(Object), 1);
    });

    it("should call onFailure hook when all attempts fail", async () => {
      const onFailure = vi.fn();
      const policy = retryPolicy({
        maxAttempts: 3,
        hooks: { onFailure }
      });

      await retryAsyncPolicy(policy, async () => {
        throw new Error("fail");
      });

      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledWith(
        expect.objectContaining({ message: "fail" }),
        3,
        expect.any(Array)
      );
    });

    it("should call onRetry hook before each retry", async () => {
      const onRetry = vi.fn();
      const policy = retryPolicy({
        maxAttempts: 3,
        hooks: { onRetry }
      });

      await retryAsyncPolicy(policy, async () => {
        throw new Error("fail");
      });

      // Called for attempt 1 (before retry 2) and attempt 2 (before retry 3)
      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it("should return err with RetryAbortedError when signal is aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      const policy = retryPolicy();
      const result = await retryAsyncPolicy(policy, async () => 42, controller.signal);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.name).toBe("RetryAbortedError");
      }
    });

    it("should return err with RetryTimeoutError when maxTotalTime exceeded", async () => {
      const policy = retryPolicy({
        maxAttempts: 10,
        initialDelay: 100, // Will ensure timeout kicks in
        maxTotalTime: 50 // Very short timeout
      });

      const result = await retryAsyncPolicy(policy, async () => {
        throw new Error("fail");
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.name).toBe("RetryTimeoutError");
      }
    });
  });

  describe("retryAsync (legacy)", () => {
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
      ).rejects.toThrow("RetryAbortedError");
    });

    it("should throw RetryAbortedError with correct name", async () => {
      const controller = new AbortController();
      controller.abort();

      try {
        await retryAsync(async () => { throw new Error("fail"); }, { attempts: 3, signal: controller.signal });
        fail("Should have thrown");
      } catch (error: unknown) {
        expect((error as { name?: string }).name).toBe("RetryAbortedError");
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
