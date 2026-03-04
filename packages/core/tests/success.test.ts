import { describe, it, expect } from "vitest";
import { success, successUnit, isSuccess, Success } from "../src/success";
import { unit } from "../src/unit";

describe("Success", () => {
  it("should create a Success with a value", () => {
    const result = success({ id: 1, name: "John" });
    expect(result.ok).toBe(true);
    expect(result.value).toEqual({ id: 1, name: "John" });
  });

  it("should create a frozen object", () => {
    const result = success(42);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("should create Success with Unit value", () => {
    const result = successUnit();
    expect(result.ok).toBe(true);
    expect(result.value).toBe(unit);
  });

  describe("isSuccess", () => {
    it("should return true for Success", () => {
      const result = success(42);
      expect(isSuccess(result)).toBe(true);
    });

    it("should return false for object with ok: false", () => {
      const result = { ok: false, error: "error" };
      expect(isSuccess(result)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const result: Success<number> | { ok: false; error: string } = success(42);
      if (isSuccess(result)) {
        expect(result.value).toBe(42);
      }
    });
  });

  it("should preserve type of value", () => {
    const strResult = success("hello");
    expect(strResult.value).toBe("hello");

    const numResult = success(123);
    expect(numResult.value).toBe(123);

    const objResult = success({ key: "value" });
    expect(objResult.value).toEqual({ key: "value" });
  });
});
