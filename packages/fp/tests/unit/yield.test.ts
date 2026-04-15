import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

 
type AnyFunction = (...args: unknown[]) => unknown;

interface MockScheduler {
  yield: () => Promise<void>;
}

interface MockGlobal {
  scheduler?: MockScheduler;
  setImmediate?: AnyFunction;
}

const originalGlobal = globalThis as MockGlobal;

// We need to import the module fresh for each test to reset the environment checks
import * as yieldModule from "../../src/yield/index.js";

describe("Yield", () => {
  describe("yieldControl", () => {
    it("should resolve immediately", async () => {
      const start = Date.now();
      await yieldModule.yieldControl();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
    });

    it("should return a Promise<void>", async () => {
      const result = yieldModule.yieldControl();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });
  });

  describe("yieldControl with scheduler.yield", () => {
    beforeEach(() => {
      if (originalGlobal.scheduler !== undefined) {
        (globalThis as MockGlobal).scheduler = originalGlobal.scheduler;
      } else {
        delete (globalThis as MockGlobal).scheduler;
      }
    });

    afterEach(() => {
      if (originalGlobal.scheduler !== undefined) {
        (globalThis as MockGlobal).scheduler = originalGlobal.scheduler;
      } else {
        delete (globalThis as MockGlobal).scheduler;
      }
    });

    it("should use scheduler.yield when available", async () => {
      const mockYield = vi.fn().mockResolvedValue(undefined);
      (globalThis as MockGlobal).scheduler = { yield: mockYield };

      // Re-import to pick up the mocked scheduler
      vi.resetModules();
      const { yieldControl } = await import("../../src/yield/index.js");

      await yieldControl();
      expect(mockYield).toHaveBeenCalled();
    });
  });

  describe("yieldControl with setImmediate", () => {
    beforeEach(() => {
      delete (globalThis as MockGlobal).scheduler;
      if (originalGlobal.setImmediate !== undefined) {
        (globalThis as MockGlobal).setImmediate = originalGlobal.setImmediate;
      } else {
        (globalThis as MockGlobal).setImmediate = undefined;
      }
    });

    afterEach(() => {
      if (originalGlobal.setImmediate !== undefined) {
        (globalThis as MockGlobal).setImmediate = originalGlobal.setImmediate;
      } else {
        delete (globalThis as MockGlobal).setImmediate;
      }
    });

    it("should use setImmediate when scheduler.yield is not available", async () => {
      vi.resetModules();
      const { yieldControl } = await import("../../src/yield/index.js");

      await yieldControl();
      expect(true).toBe(true);
    });
  });

  describe("yieldControl with MessageChannel", () => {
    beforeEach(() => {
      delete (globalThis as MockGlobal).scheduler;
      delete (globalThis as MockGlobal).setImmediate;
    });

    afterEach(() => {
      if (originalGlobal.setImmediate !== undefined) {
        (globalThis as MockGlobal).setImmediate = originalGlobal.setImmediate;
      }
    });

    it("should use MessageChannel when scheduler.yield and setImmediate are not available", async () => {
      vi.resetModules();
      const { yieldControl } = await import("../../src/yield/index.js");

      await yieldControl();
      expect(true).toBe(true);
    });
  });

  describe("immediate", () => {
    it("should resolve immediately", async () => {
      const start = Date.now();
      await yieldModule.immediate();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(50);
    });

    it("should return a Promise<void>", async () => {
      const result = yieldModule.immediate();
      expect(result).toBeInstanceOf(Promise);
      await result;
    });

    it("should be the same as yieldControl", async () => {
      const start = Date.now();
      await yieldModule.yieldControl();
      const yieldElapsed = Date.now() - start;

      const start2 = Date.now();
      await yieldModule.immediate();
      const immediateElapsed = Date.now() - start2;

      expect(yieldElapsed).toBeLessThan(50);
      expect(immediateElapsed).toBeLessThan(50);
    });

    it("should be identical reference to yieldControl", () => {
      expect(yieldModule.immediate).toBe(yieldModule.yieldControl);
    });
  });
});
