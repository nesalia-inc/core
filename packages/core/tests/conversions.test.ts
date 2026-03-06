import { describe, it, expect } from "vitest";
import {
  toResult,
  toOutcome,
  toOutcomeFromResult,
  toResultFromOutcome,
  toMaybeFromResult,
  toMaybeFromOutcome,
  fromUndefinedable,
} from "../src/conversions";
import { some, none } from "../src/maybe";
import { ok, err } from "../src/result";
import { success, cause, exception } from "../src/outcome";

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

  describe("toOutcome", () => {
    it("should convert Some to Success", () => {
      const outcome = toOutcome(some(42));
      expect(outcome.ok).toBe(true);
    });

    it("should convert None to Cause", () => {
      const outcome = toOutcome(none());
      // Cause doesn't have ok property, check name instead
      expect((outcome as { name?: string }).name).toBe("NONE");
    });
  });

  describe("toOutcomeFromResult", () => {
    it("should convert Ok to Success", () => {
      const outcome = toOutcomeFromResult(ok(42));
      expect(outcome.ok).toBe(true);
    });

    it("should convert Err to Cause", () => {
      const outcome = toOutcomeFromResult(err("error"));
      // Cause doesn't have ok property, check name instead
      expect((outcome as { name?: string }).name).toBe("ERROR");
    });
  });

  describe("toResultFromOutcome", () => {
    it("should convert Success to Ok", () => {
      const result = toResultFromOutcome(success(42));
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should convert Cause to Err", () => {
      const result = toResultFromOutcome(cause({ name: "ERROR", message: "error" }));
      expect(result.ok).toBe(false);
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

  describe("toMaybeFromOutcome", () => {
    it("should convert Success to Some", () => {
      const maybe = toMaybeFromOutcome(success(42));
      expect(maybe.ok).toBe(true);
    });

    it("should convert Cause to None", () => {
      const maybe = toMaybeFromOutcome(cause({ name: "ERROR", message: "error" }));
      expect(maybe.ok).toBe(false);
    });
  });

  describe("fromUndefinedable", () => {
    it("should convert value to Some", () => {
      const maybe = fromUndefinedable(42);
      expect(maybe.ok).toBe(true);
    });

    it("should convert undefined to None", () => {
      const maybe = fromUndefinedable(undefined);
      expect(maybe.ok).toBe(false);
    });

    it("should convert null to Some(null)", () => {
      // null is not undefined, so it should be Some(null)
      const maybe = fromUndefinedable(null as unknown as number | undefined);
      expect(maybe.ok).toBe(true);
    });
  });
});
