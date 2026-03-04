import { describe, it, expect } from "vitest";
import { cause, causeUnit, isCause, Cause } from "../src/cause";
import { unit } from "../src/unit";

describe("Cause", () => {
  describe("cause", () => {
    it("should create a Cause with data", () => {
      const error = cause({
        name: "NOT_FOUND",
        message: "User not found",
        data: { id: 123 },
      });

      expect(error.name).toBe("NOT_FOUND");
      expect(error.message).toBe("User not found");
      expect(error.data).toEqual({ id: 123 });
    });

    it("should create a frozen object", () => {
      const error = cause({
        name: "ERROR",
        message: "message",
        data: {},
      });
      expect(Object.isFrozen(error)).toBe(true);
    });

    it("should create a Cause with typed data", () => {
      interface UserError {
        id: number;
        field: string;
      }

      const error = cause<UserError>({
        name: "VALIDATION_ERROR",
        message: "Invalid field",
        data: { id: 1, field: "email" },
      });

      expect(error.data.id).toBe(1);
      expect(error.data.field).toBe("email");
    });

    it("should create a Cause with empty data", () => {
      const error = cause({
        name: "ERROR",
        message: "message",
        data: null as unknown as undefined,
      });

      expect(error.data).toBeNull();
    });
  });

  describe("causeUnit", () => {
    it("should create a Cause with Unit data", () => {
      const error = causeUnit({
        name: "ERROR",
        message: "Something went wrong",
      });

      expect(error.name).toBe("ERROR");
      expect(error.message).toBe("Something went wrong");
      expect(error.data).toBe(unit);
    });
  });

  describe("isCause", () => {
    it("should return true for Cause", () => {
      const error = cause({
        name: "ERROR",
        message: "message",
        data: {},
      });
      expect(isCause(error)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isCause(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isCause(undefined)).toBe(false);
    });

    it("should return false for primitive", () => {
      expect(isCause("string")).toBe(false);
      expect(isCause(123)).toBe(false);
      expect(isCause(true)).toBe(false);
    });

    it("should return false for object without name", () => {
      expect(isCause({ message: "test", data: {} })).toBe(false);
    });

    it("should return false for object without message", () => {
      expect(isCause({ name: "test", data: {} })).toBe(false);
    });

    it("should return false for object without data", () => {
      expect(isCause({ name: "test", message: "test" })).toBe(false);
    });

    it("should narrow type correctly", () => {
      const value: Cause<{ id: number }> | string = cause({
        name: "ERROR",
        message: "message",
        data: { id: 1 },
      });

      if (isCause(value)) {
        expect(value.data.id).toBe(1);
      }
    });
  });
});
