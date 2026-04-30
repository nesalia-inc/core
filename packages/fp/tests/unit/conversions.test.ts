import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  fromMaybe,
  fromResult,
  toResult,
  toMaybeFromResult,
  resultFromNullable,
  resultFromThrowable,
} from "../../src/conversions.js";
import { some, none } from "../../src/maybe/index.js";
import { ok, err } from "../../src/result/index.js";
import { error, exceptionGroup } from "../../src/index.js";
import { assertIsError, assertIsErrorGroup } from "../../src/error/guards.js";

describe("Conversions", () => {
  describe("fromMaybe (new naming)", () => {
    it("should convert Some to Ok", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const result = fromMaybe(some(42), () => TestError({ value: 0 }));
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should convert None to Err", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const result = fromMaybe(none(), () => TestError({ value: 0 }));
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
      const maybe = fromResult(err(TestError({ value: 0 })));
      expect(maybe.ok).toBe(false);
    });
  });

  describe("toResult (legacy naming)", () => {
    it("should convert Some to Ok", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const result = toResult(some(42), () => TestError({ value: 0 }));
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should convert None to Err", () => {
      const TestError = error({ name: "TestError", schema: z.object({ value: z.number() }) });
      const result = toResult(none(), () => TestError({ value: 0 }));
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
      const maybe = toMaybeFromResult(err(TestError({ value: 0 })));
      expect(maybe.ok).toBe(false);
    });
  });

  describe("resultFromNullable", () => {
    it("should convert non-null value to Ok", () => {
      const TestError = error({ name: "TestError" });
      const result = resultFromNullable(42, () => TestError({}));
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should convert null to Err", () => {
      const TestError = error({ name: "TestError" });
      const result = resultFromNullable(null, () => TestError({}));
      expect(result.ok).toBe(false);
    });

    it("should convert undefined to Err", () => {
      const TestError = error({ name: "TestError" });
      const result = resultFromNullable(undefined, () => TestError({}));
      expect(result.ok).toBe(false);
    });
  });

  describe("resultFromThrowable", () => {
    it("should return Ok when function succeeds", () => {
      const result = resultFromThrowable(() => 42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should return Err when function throws Error", () => {
      const result = resultFromThrowable(() => {
        throw new Error("test error");
      });
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe("test error");
    });

    it("should wrap non-Error throws", () => {
      const result = resultFromThrowable(() => {
        // eslint-disable-next-line no-throw-literal -- Testing library's ability to wrap non-Error throws
        throw "string error";
      });
      expect(result.ok).toBe(false);
      expect(result.error.message).toBe("string error");
    });
  });

  describe("assertIsError", () => {
    it("should pass for valid Error", () => {
      const TestError = error({ name: "TestError" });
      const e = TestError({});
      expect(() => assertIsError(e)).not.toThrow();
    });

    it("should throw for invalid value", () => {
      expect(() => assertIsError({})).toThrow(TypeError);
      expect(() => assertIsError(null)).toThrow(TypeError);
      expect(() => assertIsError("string")).toThrow(TypeError);
    });
  });

  describe("assertIsErrorGroup", () => {
    it("should pass for valid ErrorGroup", () => {
      const TestError = error({ name: "TestError" });
      const group = exceptionGroup([TestError({})]);
      expect(() => assertIsErrorGroup(group)).not.toThrow();
    });

    it("should throw for invalid value", () => {
      expect(() => assertIsErrorGroup({})).toThrow(TypeError);
      expect(() => assertIsErrorGroup(null)).toThrow(TypeError);
    });
  });
});
