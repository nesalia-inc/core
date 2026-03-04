import { describe, it, expect } from "vitest";
import { unit, isUnit, Unit } from "../src/unit";

describe("Unit", () => {
  it("should have a singleton value", () => {
    const u1 = unit;
    const u2 = unit;
    expect(u1).toBe(u2);
  });

  it("should return true for isUnit with unit", () => {
    expect(isUnit(unit)).toBe(true);
  });

  it("should return false for isUnit with other values", () => {
    expect(isUnit(undefined)).toBe(false);
    expect(isUnit(null)).toBe(false);
    expect(isUnit(0)).toBe(false);
    expect(isUnit("")).toBe(false);
    expect(isUnit({})).toBe(false);
  });

  it("should have correct type", () => {
    const u: Unit = unit;
    expect(u).toBe(unit);
  });
});
