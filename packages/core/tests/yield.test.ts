import { describe, it, expect } from "vitest";
import { yield as yieldControl, immediate } from "../src/index";

describe("Yield", () => {
  describe("yield", () => {
    it("should resolve immediately", async () => {
      const start = Date.now();
      await yieldControl();
      const elapsed = Date.now() - start;
      // Should be very quick (less than 50ms)
      expect(elapsed).toBeLessThan(50);
    });

    it("should return a Promise<void>", async () => {
      const result = yieldControl();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });
  });

  describe("immediate", () => {
    it("should resolve immediately", async () => {
      const start = Date.now();
      await immediate();
      const elapsed = Date.now() - start;
      // Should be very quick (less than 50ms)
      expect(elapsed).toBeLessThan(50);
    });

    it("should return a Promise<void>", async () => {
      const result = immediate();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    it("should behave the same as yield", async () => {
      const start = Date.now();
      await yieldControl();
      const yieldElapsed = Date.now() - start;

      const start2 = Date.now();
      await immediate();
      const immediateElapsed = Date.now() - start2;

      // Both should be quick and similar
      expect(yieldElapsed).toBeLessThan(50);
      expect(immediateElapsed).toBeLessThan(50);
    });
  });
});
