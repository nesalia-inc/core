import { describe, it, expect } from "vitest";
import { sleep, withTimeout, TimeoutError, sleepWithSignal, addJitter } from "../src/sleep";

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
      expect(addJitter(1000, undefined)).toBe(1000);
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
      } catch (e) {
        expect((e as TimeoutError).name).toBe("TIMEOUT");
        expect((e as TimeoutError).timeout).toBe(50);
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
      } catch (e) {
        expect((e as Error).name).toBe("CUSTOM_TIMEOUT");
      }
    });

    it("should not include elapsed when disabled", async () => {
      try {
        await withTimeout(new Promise(() => {}), 50, { includeElapsed: false });
      } catch (e) {
        expect((e as TimeoutError).timeout).toBe(50);
        expect((e as TimeoutError).elapsed).toBeUndefined();
      }
    });

    it("should include elapsed when enabled", async () => {
      try {
        await withTimeout(new Promise(() => {}), 50, { includeElapsed: true });
      } catch (e) {
        expect((e as TimeoutError).elapsed).toBeDefined();
        expect((e as TimeoutError).elapsed).toBeGreaterThan(0);
      }
    });

    it("should reject with original error if promise rejects before timeout", async () => {
      await expect(
        withTimeout(Promise.reject(new Error("Original error")), 1000)
      ).rejects.toThrow("Original error");
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
});
