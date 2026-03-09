import { describe, it, expect } from "vitest";
import { sleep, withTimeout, TimeoutError } from "../src/sleep";

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
});
