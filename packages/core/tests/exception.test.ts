import { describe, it, expect } from "vitest";
import { exception, exceptionWithStack, isException, Exception } from "../src/exception";
import { unit } from "../src/unit";

describe("Exception", () => {
  describe("exception", () => {
    it("should create an Exception with data", () => {
      const error = exception({
        name: "DATABASE_ERROR",
        message: "Connection failed",
        data: { reason: "timeout" },
      });

      expect(error.name).toBe("DATABASE_ERROR");
      expect(error.message).toBe("Connection failed");
      expect(error.data).toEqual({ reason: "timeout" });
      expect(error.stack).toBeDefined();
    });

    it("should create a frozen object", () => {
      const error = exception({
        name: "ERROR",
        message: "message",
      });
      expect(Object.isFrozen(error)).toBe(true);
    });

    it("should use Unit as default data when not provided", () => {
      const error = exception({
        name: "ERROR",
        message: "message",
      });

      expect(error.data).toBe(unit);
    });

    it("should accept custom stack", () => {
      const customStack = "CustomStackTrace";
      const error = exception({
        name: "ERROR",
        message: "message",
        stack: customStack,
      });

      expect(error.stack).toBe(customStack);
    });

    it("should generate stack if not provided", () => {
      const error = exception({
        name: "ERROR",
        message: "message",
      });

      expect(error.stack).toContain("Error");
    });
  });

  describe("exceptionWithStack", () => {
    it("should create Exception with auto-generated stack", () => {
      const error = exceptionWithStack({
        name: "ERROR",
        message: "message",
      });

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("Error");
    });
  });

  describe("isException", () => {
    it("should return true for Exception", () => {
      const error = exception({
        name: "ERROR",
        message: "message",
      });
      expect(isException(error)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isException(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isException(undefined)).toBe(false);
    });

    it("should return false for primitive", () => {
      expect(isException("string")).toBe(false);
      expect(isException(123)).toBe(false);
      expect(isException(true)).toBe(false);
    });

    it("should return false for object without name", () => {
      expect(isException({ message: "test", data: {}, stack: "" })).toBe(false);
    });

    it("should return false for object without message", () => {
      expect(isException({ name: "test", data: {}, stack: "" })).toBe(false);
    });

    it("should return false for object without data", () => {
      expect(isException({ name: "test", message: "test", stack: "" })).toBe(false);
    });

    it("should return false for object without stack", () => {
      expect(isException({ name: "test", message: "test", data: {} })).toBe(false);
    });

    it("should narrow type correctly", () => {
      const value: Exception<{ reason: string }> | string = exception({
        name: "ERROR",
        message: "message",
        data: { reason: "timeout" },
      });

      if (isException(value)) {
        expect(value.data.reason).toBe("timeout");
      }
    });
  });
});
