import { describe, it, expect } from "vitest";
import {
  toResult,
  toMaybeFromResult,
} from "../src/conversions";
import { some, none } from "../src/maybe";
import { ok, err } from "../src/result";

describe("Conversions", () => {
  describe("toResult", () => {
    it("should convert Some to Ok", () => {
      const result = toResult(some(42), () => "error");
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should convert None to Err", () => {
      const result = toResult(none(), () => "error");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("error");
    });
  });

  describe("toMaybeFromResult", () => {
    it("should convert Ok to Some", () => {
      const maybe = toMaybeFromResult(ok(42));
      expect(maybe.ok).toBe(true);
    });

    it("should convert Err to None", () => {
      const maybe = toMaybeFromResult(err("error"));
      expect(maybe.ok).toBe(false);
    });
  });
});
