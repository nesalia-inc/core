import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sleep, withTimeout, TimeoutError, sleepWithSignal, addJitter, sleepUntil, sleepRandom } from "../../src/sleep.js";

describe("Sleep", () => {
  describe("sleep", () => {
    it("should resolve after specified delay", async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it("should resolve immediately for 0ms", async () => {
      const start = Date.now();
      await sleep(0);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(20);
    });
  });

  describe("addJitter", () => {
    it("should return delay unchanged when jitter is undefined", () => {
      expect(addJitter(1000)).toBe(1000);
    });

    it("should return delay unchanged when jitter is false", () => {
      expect(addJitter(1000, false)).toBe(1000);
    });

    it("should apply full jitter when jitter is true (0.5 to 1.5 range)", () => {
      // Run multiple times to verify range
      for (let i = 0; i < 100; i++) {
        const result = addJitter(1000, true);
        expect(result).toBeGreaterThanOrEqual(500);
        expect(result).toBeLessThanOrEqual(1500);
      }
    });

    it("should apply specific variance when jitter is a number", () => {
      // 20% variance = 0.8 to 1.2 range for 1000ms
      for (let i = 0; i < 100; i++) {
        const result = addJitter(1000, 0.2);
        expect(result).toBeGreaterThanOrEqual(800);
        expect(result).toBeLessThanOrEqual(1200);
      }
    });

    it("should apply 10% variance correctly", () => {
      // 10% variance = 0.9 to 1.1 range for 1000ms
      for (let i = 0; i < 100; i++) {
        const result = addJitter(1000, 0.1);
        expect(result).toBeGreaterThanOrEqual(900);
        expect(result).toBeLessThanOrEqual(1100);
      }
    });

    it("should return delay unchanged when jitter is negative (treated as no jitter)", () => {
      expect(addJitter(1000, -0.5)).toBe(1000);
      expect(addJitter(1000, -1)).toBe(1000);
    });
  });

  describe("sleep with jitter", () => {
    it("should resolve with full jitter when jitter: true", async () => {
      const start = Date.now();
      await sleep(100, { jitter: true });
      const elapsed = Date.now() - start;
      // With full jitter, should be between 50-150ms
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThanOrEqual(200);
    });

    it("should resolve with specific variance when jitter is a number", async () => {
      const start = Date.now();
      await sleep(100, { jitter: 0.2 });
      const elapsed = Date.now() - start;
      // With 20% variance, should be between 80-120ms (with some tolerance)
      expect(elapsed).toBeGreaterThanOrEqual(75);
      expect(elapsed).toBeLessThanOrEqual(150);
    });

    it("should resolve without jitter when jitter is not specified", async () => {
      const start = Date.now();
      await sleep(50, {});
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it("should resolve without jitter when jitter is false", async () => {
      const start = Date.now();
      await sleep(50, { jitter: false });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe("withTimeout", () => {
    it("should return value if resolves before timeout", async () => {
      const result = await withTimeout(Promise.resolve(42), 1000);
      expect(result).toBe(42);
    });

    it("should work with function instead of promise", async () => {
      const result = await withTimeout(() => Promise.resolve(42), 1000);
      expect(result).toBe(42);
    });

    it("should throw on timeout", async () => {
      await expect(
        withTimeout(new Promise(() => {}), 50)
      ).rejects.toThrow();
    });

    it("should include timeout in error", async () => {
      try {
        await withTimeout(new Promise(() => {}), 50);
      } catch (error) {
        expect((error as TimeoutError).name).toBe("TIMEOUT");
        expect((error as TimeoutError).timeout).toBe(50);
      }
    });

    it("should use custom error message", async () => {
      await expect(
        withTimeout(new Promise(() => {}), 50, { message: "Custom timeout" })
      ).rejects.toThrow("Custom timeout");
    });

    it("should use custom error name", async () => {
      try {
        await withTimeout(new Promise(() => {}), 50, { name: "CUSTOM_TIMEOUT" });
      } catch (error) {
        expect((error as Error).name).toBe("CUSTOM_TIMEOUT");
      }
    });

    it("should not include elapsed when disabled", async () => {
      try {
        await withTimeout(new Promise(() => {}), 50, { includeElapsed: false });
      } catch (error) {
        expect((error as TimeoutError).timeout).toBe(50);
        expect((error as TimeoutError).elapsed).toBeUndefined();
      }
    });

    it("should include elapsed when enabled", async () => {
      try {
        await withTimeout(new Promise(() => {}), 50, { includeElapsed: true });
      } catch (error) {
        expect((error as TimeoutError).elapsed).toBeDefined();
        expect((error as TimeoutError).elapsed).toBeGreaterThan(0);
      }
    });

    it("should reject with original error if promise rejects before timeout", async () => {
      await expect(
        withTimeout(Promise.reject(new Error("Original error")), 1000)
      ).rejects.toThrow("Original error");
    });

    describe("signal injection mode", () => {
      it("should return TimeoutResult when function receives signal", async () => {
        const result = withTimeout(
          (_signal) => new Promise<number>((resolve) => setTimeout(() => resolve(42), 100)),
          1000
        );

        // Should return TimeoutResult object
        expect(result).toHaveProperty("promise");
        expect(result).toHaveProperty("cleanup");
        expect(typeof result.cleanup).toBe("function");

        // Promise should resolve with value
        const value = await result.promise;
        expect(value).toBe(42);
      });

      it("should abort operation on timeout", async () => {
        const abortFn = vi.fn();

        const result = withTimeout(
          (signal) =>
            new Promise<number>((resolve, reject) => {
              signal.addEventListener("abort", () => {
                abortFn();
                reject(new Error("Aborted"));
              });
              setTimeout(() => resolve(42), 1000);
            }),
          50
        );

        // Should reject on timeout
        await expect(result.promise).rejects.toThrow();

        // Should have called abort
        expect(abortFn).toHaveBeenCalled();
      });

      it("should allow manual abort via cleanup", async () => {
        let resolved = false;

        const result = withTimeout(
          (signal) =>
            new Promise<number>((resolve, reject) => {
              const id = setTimeout(() => {
                resolved = true;
                resolve(42);
              }, 1000);

              // Listen to abort and clear timeout
              signal.addEventListener("abort", () => {
                clearTimeout(id);
                reject(new Error("Aborted"));
              });
            }),
          5000
        );

        // Call cleanup to abort manually
        result.cleanup();

        // Promise should reject due to abort
        await expect(result.promise).rejects.toThrow();

        // Operation should not have resolved
        expect(resolved).toBe(false);
      });

      it("should work with external AbortController", async () => {
        const controller = new AbortController();

        const result = withTimeout(
          (signal) =>
            new Promise<number>((resolve, reject) => {
              const id = setTimeout(() => resolve(42), 1000);

              // Use external signal
              signal.addEventListener("abort", () => {
                clearTimeout(id);
                reject(new Error("Aborted"));
              });
            }),
          5000,
          { abortController: controller }
        );

        // Manual abort via external controller
        controller.abort();

        await expect(result.promise).rejects.toThrow();
      });

      it("should abort when signal is already aborted", async () => {
        const controller = new AbortController();
        controller.abort();

        const result = withTimeout(
          (signal) =>
            new Promise<number>((resolve, reject) => {
              // Check if already aborted
              if (signal.aborted) {
                reject(new Error("Aborted"));
                return;
              }
              setTimeout(() => resolve(42), 100);
            }),
          5000,
          { abortController: controller }
        );

        // Should reject immediately since signal is already aborted
        await expect(result.promise).rejects.toThrow();
      });
    });
  });

  describe("sleepWithSignal", () => {
    it("should resolve after specified delay without signal", async () => {
      const start = Date.now();
      await sleepWithSignal(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });

    it("should resolve before abort when signal is provided", async () => {
      const controller = new AbortController();
      const sleepPromise = sleepWithSignal(50, controller.signal);

      // Abort after a short delay
      setTimeout(() => controller.abort(), 20);

      await expect(sleepPromise).rejects.toThrow("Sleep aborted");
    });

    it("should reject immediately if signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(sleepWithSignal(1000, controller.signal)).rejects.toThrow("Sleep aborted");
    });

    it("should apply jitter when options object is provided", async () => {
      const start = Date.now();
      await sleepWithSignal(50, { jitter: true });
      const elapsed = Date.now() - start;
      // With full jitter (0.5-1.5), delay should be roughly 25-75ms
      expect(elapsed).toBeGreaterThanOrEqual(20);
      expect(elapsed).toBeLessThan(100);
    });

    it("should work with signal and jitter together", async () => {
      const controller = new AbortController();
      const sleepPromise = sleepWithSignal(50, { jitter: true, signal: controller.signal });

      // Abort after a short delay
      setTimeout(() => controller.abort(), 20);

      await expect(sleepPromise).rejects.toThrow("Sleep aborted");
    });
  });

  describe("sleepUntil", () => {
    it("should return true when predicate becomes true", async () => {
      let counter = 0;
      const result = await sleepUntil(() => {
        counter++;
        return counter >= 3;
      }, { interval: 10 });

      expect(result).toBe(true);
      expect(counter).toBe(3);
    });

    it("should return true immediately if predicate is already true", async () => {
      const result = await sleepUntil(() => true, { interval: 10 });
      expect(result).toBe(true);
    });

    it("should return false when timeout expires", async () => {
      const start = Date.now();
      const result = await sleepUntil(
        () => false,
        { timeout: 50, interval: 10 }
      );
      const elapsed = Date.now() - start;

      expect(result).toBe(false);
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(200);
    });

    it("should return false immediately if already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      const result = await sleepUntil(() => true, { signal: controller.signal });
      expect(result).toBe(false);
    });

    it("should return false when aborted mid-wait", async () => {
      const controller = new AbortController();
      let counter = 0;

      const promise = sleepUntil(
        () => {
          counter++;
          return counter >= 10;
        },
        { interval: 50, signal: controller.signal }
      );

      // Abort after a short delay
      setTimeout(() => controller.abort(), 30);

      const result = await promise;
      expect(result).toBe(false);
      expect(counter).toBeGreaterThan(0);
    });

    it("should support async predicate", async () => {
      let counter = 0;
      const result = await sleepUntil(async () => {
        counter++;
        return counter >= 2;
      }, { interval: 10 });

      expect(result).toBe(true);
    });

    it("should use default interval of 100ms", async () => {
      const start = Date.now();
      let callCount = 0;

      await sleepUntil(
        () => {
          callCount++;
          return false;
        },
        { timeout: 150 }
      );

      const elapsed = Date.now() - start;
      // With 100ms interval and 150ms timeout, should have at least 1 call
      expect(callCount).toBeGreaterThanOrEqual(1);
    });

    it("should stop checking once predicate is satisfied", async () => {
      let counter = 0;
      await sleepUntil(
        () => {
          counter++;
          return counter >= 2;
        },
        { interval: 10 }
      );
      expect(counter).toBe(2);
    });
  });

  describe("sleepRandom", () => {
    it("should sleep for a duration between min and max", async () => {
      const start = Date.now();
      await sleepRandom(50, 100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(150);
    });

    it("should throw error when min > max", async () => {
      expect(() => sleepRandom(100, 50)).toThrow("min must be less than or equal to max");
    });

    it("should work with equal min and max", async () => {
      const start = Date.now();
      await sleepRandom(50, 50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });

    it("should respect jitter option", async () => {
      const start = Date.now();
      await sleepRandom(100, 100, { jitter: true });
      const elapsed = Date.now() - start;

      // With jitter 0.5 variance, 100ms becomes 50-150ms
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(200);
    });

    it("should produce varied results across multiple calls", async () => {
      const results: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await sleepRandom(0, 10);
        results.push(Date.now() - start);
      }

      // Not all results should be the same
      const uniqueValues = new Set(results.map(Math.floor));
      expect(uniqueValues.size).toBeGreaterThan(1);
    });
  });
});
