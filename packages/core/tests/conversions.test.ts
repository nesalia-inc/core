import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  fromMaybe,
  fromResult,
  toResult,
  toMaybeFromResult,
} from "../src/conversions";
import { some, none } from "../src/maybe";
import { ok, err } from "../src/result";
import { error } from "../src";

describe("Conversions", () => {
  describe("fromMaybe (new naming)", () => {
    it("should convert Some to Ok", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const result = fromMaybe(some(42), () => TestError({ value: 0 }).error);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should convert None to Err", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const result = fromMaybe(none(), () => TestError({ value: 0 }).error);
      expect(result.ok).toBe(false);
      expect(result.error.name).toBe("TestError");
    });
  });

  describe("fromResult (new naming)", () => {
    it("should convert Ok to Some", () => {
      const maybe = fromResult(ok(42));
      expect(maybe.ok).toBe(true);
    });

    it("should convert Err to None", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const maybe = fromResult(err(TestError({ value: 0 }).error));
      expect(maybe.ok).toBe(false);
    });
  });

  describe("toResult (legacy naming)", () => {
    it("should convert Some to Ok", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const result = toResult(some(42), () => TestError({ value: 0 }).error);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should convert None to Err", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const result = toResult(none(), () => TestError({ value: 0 }).error);
      expect(result.ok).toBe(false);
      expect(result.error.name).toBe("TestError");
    });
  });

  describe("toMaybeFromResult (legacy naming)", () => {
    it("should convert Ok to Some", () => {
      const maybe = toMaybeFromResult(ok(42));
      expect(maybe.ok).toBe(true);
    });

    it("should convert Err to None", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const maybe = toMaybeFromResult(err(TestError({ value: 0 }).error));
      expect(maybe.ok).toBe(false);
    });
  });
});
