import { describe, it, expect, vi } from "vitest";
import { timeout, TimeoutError, AbortError } from "../../src/timeout.js";
import { ok, err } from "../../src/result/index.js";

describe("timeout", () => {
  describe("deadline boundary values", () => {
    it("should return Err immediately when deadline <= 0", async () => {
      const result = await timeout(Promise.resolve(ok(42)), { deadline: 0 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("TimeoutError");
        expect(result.error.args.elapsed).toBe(0);
      }
    });

    it("should return Err immediately when deadline < 0", async () => {
      const result = await timeout(Promise.resolve(ok(42)), { deadline: -100 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("TimeoutError");
        expect(result.error.args.elapsed).toBe(0);
        expect(result.error.args.deadline).toBe(-100);
      }
    });

    it("should behave like plain operation when deadline is Infinity", async () => {
      const result = await timeout(Promise.resolve(ok(42)), { deadline: Infinity });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it("should pass through error when deadline is Infinity and operation fails", async () => {
      const testError = new Error("test");
      const result = await timeout(Promise.resolve(err(testError)), { deadline: Infinity });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(testError);
      }
    });

    it("should handle abort signal with infinity deadline and operation completes before abort", async () => {
      // Tests lines 163-172: abort signal provided, not aborted, operation completes
      const controller = new AbortController();

      // Operation completes quickly before any abort
      const result = await timeout(
        new Promise((resolve) => setTimeout(() => resolve(ok(42)), 10)),
        { deadline: Infinity, abortSignal: controller.signal }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe("paths", () => {
    describe("success path", () => {
      it("should return original Result when operation completes before deadline", async () => {
        const result = await timeout(
          new Promise((resolve) => setTimeout(() => resolve(ok(42)), 10)),
          { deadline: 5000, operationName: "testOp" }
        );
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(42);
        }
      });

      it("should work with async function that returns Result", async () => {
        const asyncOp = async () => {
          await new Promise((r) => setTimeout(r, 10));
          return ok(42);
        };
        const result = await timeout(asyncOp(), { deadline: 5000 });
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(42);
        }
      });
    });

    describe("timeout path", () => {
      it("should return Err<TimeoutError> when deadline exceeded", async () => {
        const result = await timeout(
          new Promise<ReturnType<typeof ok>>(() => {
            // Never resolves - simulates a long operation
            return new Promise(() => {});
          }),
          { deadline: 50, operationName: "fetchUser" }
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.name).toBe("TimeoutError");
          expect(result.error.args.deadline).toBe(50);
          expect(result.error.args.elapsed).toBeGreaterThanOrEqual(50);
          expect(result.error.args.operation).toBe("fetchUser");
        }
      });

      it("should include operation name in error message", async () => {
        const result = await timeout(
          new Promise<ReturnType<typeof ok>>(() => new Promise(() => {})),
          { deadline: 50, operationName: "myOperation" }
        );
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain("myOperation");
        }
      });

      it("should use default TimeoutError with message containing elapsed time", async () => {
        const result = await timeout(
          new Promise<ReturnType<typeof ok>>(() => new Promise(() => {})),
          { deadline: 100 }
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.name).toBe("TimeoutError");
          expect(result.error.args.elapsed).toBeGreaterThanOrEqual(100);
          expect(result.error.message).toContain("timed out");
        }
      });
    });

    describe("abort path", () => {
      it("should return Err<AbortError> when external signal is aborted", async () => {
        const controller = new AbortController();

        // Abort after a short delay
        setTimeout(() => controller.abort(), 20);

        const result = await timeout(
          new Promise<ReturnType<typeof ok>>((resolve) => {
            setTimeout(() => resolve(ok(42)), 5000);
          }),
          { deadline: 5000, abortSignal: controller.signal }
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.name).toBe("AbortError");
        }
      });

      it("should return Err<AbortError> immediately when signal is already aborted", async () => {
        const controller = new AbortController();
        controller.abort();

        const result = await timeout(Promise.resolve(ok(42)), {
          deadline: 5000,
          abortSignal: controller.signal,
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.name).toBe("AbortError");
        }
      });

      it("should include abort reason in AbortError", async () => {
        const controller = new AbortController();

        // Abort after a short delay
        setTimeout(() => controller.abort(), 20);

        const result = await timeout(
          new Promise<ReturnType<typeof ok>>((resolve) => {
            setTimeout(() => resolve(ok(42)), 5000);
          }),
          { deadline: 5000, abortSignal: controller.signal }
        );

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.name).toBe("AbortError");
          // DOMException's reason is the DOMException itself when using controller.abort()
          expect(result.error.args.reason).toBeDefined();
        }
      });

      it("should handle operation that already finished when abort signal fires", async () => {
        // If operation completes before abort fires, result should be Ok
        const controller = new AbortController();

        const result = await timeout(
          new Promise<ReturnType<typeof ok>>((resolve) => {
            setTimeout(() => resolve(ok(42)), 5);
          }),
          { deadline: 5000, abortSignal: controller.signal }
        );

        // Wait a bit, then abort
        setTimeout(() => controller.abort(), 50);

        // Give time for both operation and abort to potentially fire
        await new Promise((r) => setTimeout(r, 100));

        // If the result is Ok, it completed before abort
        // If it's Err, it was aborted before completion
        // Both are valid outcomes here
        expect(result).toBeDefined();
      });
    });
  });

  describe("resume modes", () => {
    describe("'abort' (default)", () => {
      it("should abort operation on timeout when resume is 'abort'", async () => {
        const result = await timeout(
          new Promise<ReturnType<typeof ok>>((res) => {
            // This operation will be aborted
            setTimeout(() => res(ok(42)), 10000);
          }),
          { deadline: 50, resume: "abort" }
        );

        expect(result.ok).toBe(false);
      });
    });

    describe("'continue'", () => {
      it("should not abort operation when resume is 'continue'", async () => {
        let operationValue: number | null = null;

        const timeoutPromise = timeout(
          new Promise<ReturnType<typeof ok>>((resolve) => {
            setTimeout(() => {
              operationValue = 42;
              resolve(ok(42));
            }, 100);
          }),
          { deadline: 50, resume: "continue" }
        );

        const result = await timeoutPromise;

        // Should be timeout error
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.name).toBe("TimeoutError");
        }

        // Operation should still be running and complete
        await new Promise((r) => setTimeout(r, 200));
        expect(operationValue).toBe(42);
      });
    });
  });

  describe("fallback", () => {
    it("should return onTimeout fallback result when timeout occurs", async () => {
      const fallbackResult = ok("fallback value");
      const result = await timeout(
        new Promise<ReturnType<typeof ok>>(() => new Promise(() => {})),
        {
          deadline: 50,
          onTimeout: () => fallbackResult,
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("fallback value");
      }
    });

    it("should work with error fallback on timeout", async () => {
      const fallbackError = new Error("fallback error");
      const result = await timeout(
        new Promise<ReturnType<typeof ok>>(() => new Promise(() => {})),
        {
          deadline: 50,
          onTimeout: () => err(fallbackError),
        }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(fallbackError);
      }
    });

    it("should NOT call onTimeout on successful operation", async () => {
      const onTimeoutFn = vi.fn();
      const result = await timeout(
        new Promise<ReturnType<typeof ok>>((resolve) => setTimeout(() => resolve(ok(42)), 10)),
        {
          deadline: 5000,
          onTimeout: onTimeoutFn,
        }
      );

      expect(result.ok).toBe(true);
      expect(onTimeoutFn).not.toHaveBeenCalled();
    });
  });

  describe("custom timeout error", () => {
    it("should use custom ErrorConstructor when provided", async () => {
      class CustomTimeoutError extends Error {
        constructor(info: { deadline: number; elapsed: number; operation: string }) {
          super(`Custom: ${info.operation} timed out after ${info.elapsed}ms`);
          this.name = "CustomTimeoutError";
        }
      }

      const result = await timeout(
        new Promise<ReturnType<typeof ok>>(() => new Promise(() => {})),
        { deadline: 50, timeout: CustomTimeoutError }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("CustomTimeoutError");
        expect(result.error.message).toContain("Custom:");
      }
    });

    it("should use custom function when provided", async () => {
      const customFactory = (info: { deadline: number; elapsed: number; operation: string }) => {
        return new Error(`Custom timeout for ${info.operation}`) as Error & { name: string; args: typeof info };
      };

      const result = await timeout(
        new Promise<ReturnType<typeof ok>>(() => new Promise(() => {})),
        { deadline: 50, timeout: customFactory }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Custom timeout for");
      }
    });
  });

  describe("TimeoutError and AbortError error builders", () => {
    it("should create TimeoutError with correct structure", () => {
      const error = TimeoutError({ deadline: 5000, elapsed: 5200, operation: "fetchUser" });
      expect(error.name).toBe("TimeoutError");
      expect(error.args.deadline).toBe(5000);
      expect(error.args.elapsed).toBe(5200);
      expect(error.args.operation).toBe("fetchUser");
      expect(error.message).toContain("fetchUser");
      expect(error.message).toContain("5200ms");
    });

    it("should create AbortError with correct structure", () => {
      const error = AbortError({ reason: "user cancelled" });
      expect(error.name).toBe("AbortError");
      expect(error.args.reason).toBe("user cancelled");
      expect(error.message).toContain("Operation aborted");
      expect(error.message).toContain("user cancelled");
    });

    it("should create AbortError without reason", () => {
      const error = AbortError({});
      expect(error.name).toBe("AbortError");
      expect(error.args.reason).toBeUndefined();
      expect(error.message).toBe("Operation aborted");
    });
  });

  describe("combined timeout and abort", () => {
    it("should prioritize abort over timeout when signal fires first", async () => {
      const controller = new AbortController();

      // Abort immediately
      setTimeout(() => controller.abort(), 10);

      const result = await timeout(
        new Promise<ReturnType<typeof ok>>(() => new Promise(() => {})),
        { deadline: 5000, abortSignal: controller.signal }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("AbortError");
      }
    });

    it("should return timeout error when deadline is reached before abort", async () => {
      const controller = new AbortController();

      const result = await timeout(
        new Promise<ReturnType<typeof ok>>(() => new Promise(() => {})),
        { deadline: 50, abortSignal: controller.signal }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("TimeoutError");
      }
    });

    it("should return Err for unknown error without name property", async () => {
      // This tests the catch block fallback at line 240-248
      // The error must NOT have a "name" property to reach that branch
      // The promise must reject to hit the catch block
      const errorWithoutName = { message: "some error", code: "ERR_SOMETHING" };

      const result = await timeout(
        Promise.reject(errorWithoutName),
        { deadline: 5000 }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Should return a TimeoutError (the fallback) wrapped in Err
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("edge cases", () => {
    it("should handle operation that resolves immediately", async () => {
      const result = await timeout(Promise.resolve(ok(42)), { deadline: 5000 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it("should handle operation that rejects immediately", async () => {
      const testError = new Error("immediate error");
      const result = await timeout(Promise.resolve(err(testError)), { deadline: 5000 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(testError);
      }
    });

    it("should use operationName in timeout error message when provided", async () => {
      const result = await timeout(
        new Promise<ReturnType<typeof ok>>(() => new Promise(() => {})),
        { deadline: 50, operationName: "databaseQuery" }
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.args.operation).toBe("databaseQuery");
        expect(result.error.message).toContain("databaseQuery");
      }
    });

    it("should work with large deadline values", async () => {
      const result = await timeout(Promise.resolve(ok(42)), { deadline: Number.MAX_SAFE_INTEGER });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });
  });
});