import { describe, it, expect } from "vitest";
import { unit, isUnit, type Unit } from "../../src/unit.js";

describe("Unit", () => {
  describe("unit singleton", () => {
    it("should be a singleton", () => {
      expect(unit).toBe(unit);
    });
  });

  describe("isUnit", () => {
    it("should return true for the singleton unit", () => {
      expect(isUnit(unit)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isUnit(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isUnit(undefined)).toBe(false);
    });

    it("should return false for numbers", () => {
      expect(isUnit(0)).toBe(false);
      expect(isUnit(42)).toBe(false);
    });

    it("should return false for strings", () => {
      expect(isUnit("")).toBe(false);
      expect(isUnit("unit")).toBe(false);
    });

    it("should return false for booleans", () => {
      expect(isUnit(true)).toBe(false);
      expect(isUnit(false)).toBe(false);
    });

    it("should return false for plain objects without the brand", () => {
      expect(isUnit({})).toBe(false);
      expect(isUnit({ foo: "bar" })).toBe(false);
    });

    it("should return false for arrays", () => {
      expect(isUnit([])).toBe(false);
    });

    it("should return false for functions", () => {
      expect(isUnit(() => {})).toBe(false);
    });

    it("should detect cross-realm Unit - same Symbol", () => {
      // Create a cross-realm unit using the same Symbol.for key
      const crossRealmUnit = Object.create(null, {
        [Symbol.for("deesse.unit")]: { value: true, enumerable: false, writable: false, configurable: false },
      }) as Unit;
      expect(isUnit(crossRealmUnit)).toBe(true);
    });

    it("should return false for cross-realm object with different Symbol", () => {
      // Create a cross-realm-like object with a different symbol (not the actual UNIT_BRAND)
      const otherSymbol = Symbol("other");
      const fakeUnit = Object.create(null, {
        [otherSymbol]: { value: true, enumerable: false, writable: false, configurable: false },
      });
      expect(isUnit(fakeUnit)).toBe(false);
    });
  });
});
