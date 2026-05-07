import { describe, it, expect, vi } from "vitest";
import { repeat, repeatUntil, repeatedIsSome } from "../../src/repeat.js";
import { ok, err } from "../../src/result/index.js";
import { some, none } from "../../src/maybe/index.js";

describe("Repeat", () => {
  describe("repeat", () => {
    it("should return empty array when count is 0", async () => {
      const operation = vi.fn().mockResolvedValue(ok(42));
      const result = await repeat(operation, { count: 0 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
      expect(operation).not.toHaveBeenCalled();
    });

    it("should return err with InvalidRepeatOptionsError when count is negative", async () => {
      const operation = vi.fn().mockResolvedValue(ok(42));
      const result = await repeat(operation, { count: -1 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("InvalidRepeatOptionsError");
      }
    });

    it("should return ok with array of values when all operations succeed", async () => {
      const operation = vi.fn().mockResolvedValue(ok(42));
      const result = await repeat(operation, { count: 3 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([42, 42, 42]);
      }
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should return err with first error when stopOnError is true", async () => {
      const operation = vi.fn()
        .mockResolvedValueOnce(ok(1))
        .mockResolvedValueOnce(err(new Error("fail") as Error))
        .mockResolvedValueOnce(ok(3));
      const result = await repeat(operation, { count: 3, stopOnError: true });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("fail");
      }
      expect(operation).toHaveBeenCalledTimes(2); // Stops after error
    });

    it("should return err with RepeatExhaustedError when stopOnError is false and operation fails", async () => {
      const error = new Error("fail");
      const operation = vi.fn().mockResolvedValue(err(error as Error));
      const result = await repeat(operation, { count: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("RepeatExhaustedError");
        const errArgs = result.error.args as { attempts: number; errors: unknown[] };
        expect(errArgs.attempts).toBe(3);
        expect(errArgs.errors).toHaveLength(3);
      }
    });

    it("should collect both values and errors when continueOnError is true", async () => {
      const error = new Error("fail");
      const operation = vi.fn()
        .mockResolvedValueOnce(ok(1))
        .mockResolvedValueOnce(err(error as Error))
        .mockResolvedValueOnce(ok(3));
      const result = await repeat(operation, { count: 3, continueOnError: true });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Values collected as-is, errors mixed in
        expect(result.value).toHaveLength(3);
      }
    });

    it("should apply delay between attempts", async () => {
      const start = Date.now();
      const operation = vi.fn().mockResolvedValue(ok(42));
      await repeat(operation, { count: 3, delay: 50 });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100); // 2 delays of 50ms
    });

    it("should support function-based delay", async () => {
      const start = Date.now();
      const operation = vi.fn().mockResolvedValue(ok(42));
      await repeat(operation, { count: 3, delay: (attempt) => attempt * 20 });

      const elapsed = Date.now() - start;
      // 1*20 + 2*20 = 40ms (delays after attempt 1 and 2)
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it("should return err with AbortError when signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();
      const operation = vi.fn().mockResolvedValue(ok(42));
      const result = await repeat(operation, { count: 3, abortSignal: controller.signal });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("AbortError");
      }
    });

    it("should return err with AbortError when signal aborts during execution", async () => {
      const controller = new AbortController();
      const operation = vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 20));
        return ok(42);
      });

      const promise = repeat(operation, { count: 5, delay: 10, abortSignal: controller.signal });

      setTimeout(() => controller.abort(), 30);

      const result = await promise;
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("AbortError");
      }
    });

    it("should call onAttempt before each attempt", async () => {
      const onAttempt = vi.fn();
      const operation = vi.fn().mockResolvedValue(ok(42));
      await repeat(operation, { count: 3, onAttempt });

      expect(onAttempt).toHaveBeenCalledTimes(3);
      expect(onAttempt).toHaveBeenNthCalledWith(1, 1);
      expect(onAttempt).toHaveBeenNthCalledWith(2, 2);
      expect(onAttempt).toHaveBeenNthCalledWith(3, 3);
    });

    it("should handle operation throwing errors", async () => {
      const operation = vi.fn()
        .mockResolvedValueOnce(ok(1))
        .mockRejectedValueOnce(new Error("throw"))
        .mockResolvedValueOnce(ok(3));
      const result = await repeat(operation, { count: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("RepeatExhaustedError");
      }
    });

    it("should treat negative delay as 0", async () => {
      const start = Date.now();
      const operation = vi.fn().mockResolvedValue(ok(42));
      await repeat(operation, { count: 3, delay: -100 });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50); // No significant delay
    });

    it("should skip delay after last attempt", async () => {
      const start = Date.now();
      const operation = vi.fn().mockResolvedValue(ok(42));
      await repeat(operation, { count: 1, delay: 1000 });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(500); // No delay for single attempt
    });
  });

  describe("repeatUntil", () => {
    it("should return err with RepeatedUntilError when maxAttempts is 0", async () => {
      const operation = vi.fn().mockResolvedValue(ok(42));
      const predicate = (v: number) => v === 100;
      const result = await repeatUntil(operation, predicate, { maxAttempts: 0 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("RepeatedUntilError");
      }
    });

    it("should return err with AbortError when signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();
      const operation = vi.fn().mockResolvedValue(ok(42));
      const result = await repeatUntil(operation, () => true, { abortSignal: controller.signal });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("AbortError");
      }
    });

    it("should return ok with value when predicate is satisfied", async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        return ok(attempts);
      });
      const predicate = (v: number) => v >= 3;
      const result = await repeatUntil(operation, predicate, { maxAttempts: 5, delay: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(3);
      }
      expect(attempts).toBe(3);
    });

    it("should return err with RepeatedUntilError when predicate not satisfied within maxAttempts", async () => {
      const operation = vi.fn().mockResolvedValue(ok(1));
      const predicate = (v: number) => v === 100;
      const result = await repeatUntil(operation, predicate, { maxAttempts: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("RepeatedUntilError");
        const errArgs = result.error.args as { attempts: number; lastValue: unknown; predicate: string };
        expect(errArgs.attempts).toBe(3);
        expect(errArgs.lastValue).toBe(1);
      }
    });

    it("should run indefinitely when maxAttempts is Infinity", async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        return ok(attempts);
      });
      const predicate = (v: number) => v >= 5;
      const result = await repeatUntil(operation, predicate, { maxAttempts: Infinity, delay: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(5);
      }
    });

    it("should propagate error from operation immediately", async () => {
      const operation = vi.fn().mockResolvedValue(err(new Error("fail") as Error));
      const predicate = (v: number) => v === 100;
      const result = await repeatUntil(operation, predicate, { maxAttempts: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("fail");
      }
    });

    it("should propagate thrown error from operation", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("throw"));
      const predicate = (v: number) => v === 100;
      const result = await repeatUntil(operation, predicate, { maxAttempts: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("throw");
      }
    });

    it("should apply delay between attempts", async () => {
      const start = Date.now();
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        return ok(attempts);
      });
      await repeatUntil(operation, (v) => v >= 3, { maxAttempts: 5, delay: 50 });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100); // 2 delays of 50ms
    });

    it("should return err with AbortError when signal aborts during execution", async () => {
      const controller = new AbortController();
      const operation = vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 20));
        return ok(1);
      });

      const promise = repeatUntil(
        operation,
        (v) => v === 100,
        { maxAttempts: 10, delay: 10, abortSignal: controller.signal }
      );

      setTimeout(() => controller.abort(), 30);

      const result = await promise;
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("AbortError");
      }
    });

    it("should call onAttempt with attempt number and value", async () => {
      const onAttempt = vi.fn();
      let callCount = 0;
      const operation = vi.fn().mockImplementation(async () => {
        callCount++;
        return ok(callCount);
      });
      await repeatUntil(operation, (v) => v >= 3, { maxAttempts: 5, onAttempt });

      expect(onAttempt).toHaveBeenCalledTimes(3);
      expect(onAttempt).toHaveBeenCalledWith(1, 1);
      expect(onAttempt).toHaveBeenCalledWith(2, 2);
      expect(onAttempt).toHaveBeenCalledWith(3, 3);
    });

    it("should not delay after last attempt", async () => {
      const start = Date.now();
      const operation = vi.fn().mockResolvedValue(ok(42));
      await repeatUntil(operation, (v) => v === 42, { maxAttempts: 1, delay: 1000 });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(500); // No delay for immediate success
    });
  });

  describe("repeatedIsSome", () => {
    it("should return err with RepeatedUntilError when maxAttempts is 0", async () => {
      const operation = vi.fn().mockResolvedValue(some(42));
      const result = await repeatedIsSome(operation, { maxAttempts: 0 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("RepeatedUntilError");
      }
    });

    it("should return err with AbortError when signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();
      const operation = vi.fn().mockResolvedValue(some(42));
      const result = await repeatedIsSome(operation, { abortSignal: controller.signal });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("AbortError");
      }
    });

    it("should return ok with first Some value", async () => {
      const operation = vi.fn()
        .mockResolvedValueOnce(none())
        .mockResolvedValueOnce(some(42))
        .mockResolvedValueOnce(some(100));
      const result = await repeatedIsSome(operation, { maxAttempts: 3 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
      expect(operation).toHaveBeenCalledTimes(2); // Stopped after finding Some
    });

    it("should return err with RepeatedUntilError when all attempts return None", async () => {
      const operation = vi.fn().mockResolvedValue(none());
      const result = await repeatedIsSome(operation, { maxAttempts: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("RepeatedUntilError");
        const errArgs = result.error.args as { attempts: number; lastValue: unknown; predicate: string };
        expect(errArgs.attempts).toBe(3);
        expect(errArgs.lastValue).toBeNull();
        expect(errArgs.predicate).toBe("isSome");
      }
    });

    it("should run indefinitely when maxAttempts is Infinity", async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        return attempts < 5 ? none() : some(42);
      });
      const result = await repeatedIsSome(operation, { maxAttempts: Infinity, delay: 10 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
      expect(attempts).toBe(5);
    });

    it("should propagate thrown error from operation", async () => {
      const operation = vi.fn()
        .mockResolvedValueOnce(none())
        .mockRejectedValueOnce(new Error("throw"));
      const result = await repeatedIsSome(operation, { maxAttempts: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("throw");
      }
    });

    it("should apply delay between attempts", async () => {
      const start = Date.now();
      const operation = vi.fn().mockResolvedValue(none());
      await repeatedIsSome(operation, { maxAttempts: 3, delay: 50 });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(100); // 2 delays of 50ms
    });

    it("should return err with AbortError when signal aborts during execution", async () => {
      const controller = new AbortController();
      const operation = vi.fn().mockImplementation(async () => {
        await new Promise((r) => setTimeout(r, 20));
        return none();
      });

      const promise = repeatedIsSome(operation, { maxAttempts: 10, delay: 10, abortSignal: controller.signal });

      setTimeout(() => controller.abort(), 30);

      const result = await promise;
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("AbortError");
      }
    });

    it("should call onAttempt with attempt number and Maybe result", async () => {
      const onAttempt = vi.fn();
      const callResults: unknown[] = [];
      const operation = vi.fn()
        .mockImplementation(async () => {
          const result = callResults.length < 1 ? none() : some(42);
          callResults.push(result);
          return result;
        });
      await repeatedIsSome(operation, { maxAttempts: 3, onAttempt });

      expect(onAttempt).toHaveBeenCalledTimes(2);
      expect(onAttempt).toHaveBeenCalledWith(1, expect.objectContaining({ ok: false }));
      expect(onAttempt).toHaveBeenCalledWith(2, expect.objectContaining({ ok: true, value: 42 }));
    });

    it("should stop immediately on first Some without delay", async () => {
      const start = Date.now();
      const operation = vi.fn().mockResolvedValue(some(42));
      const result = await repeatedIsSome(operation, { maxAttempts: 5, delay: 1000 });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(500); // No delay since found immediately
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });
  });
});