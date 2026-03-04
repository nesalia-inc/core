import { describe, it, expect } from "vitest";
import {
  success,
  cause,
  exception,
  causeUnit,
  exceptionUnit,
  isSuccess,
  isCause,
  isException,
  Outcome,
} from "../src/outcome";
import { unit } from "../src/unit";

describe("Outcome", () => {
  describe("success", () => {
    it("should create a Success outcome", () => {
      const result = success({ id: 1, name: "John" });
      expect(isSuccess(result)).toBe(true);
      expect(isCause(result)).toBe(false);
      expect(isException(result)).toBe(false);
      expect(result.value).toEqual({ id: 1, name: "John" });
    });
  });

  describe("cause", () => {
    it("should create a Cause outcome", () => {
      const result = cause({
        name: "NOT_FOUND",
        message: "User not found",
        data: { id: 123 },
      });
      expect(isSuccess(result)).toBe(false);
      expect(isCause(result)).toBe(true);
      expect(isException(result)).toBe(false);
      expect(result.name).toBe("NOT_FOUND");
      expect(result.data).toEqual({ id: 123 });
    });
  });

  describe("exception", () => {
    it("should create an Exception outcome", () => {
      const result = exception({
        name: "DATABASE_ERROR",
        message: "Connection failed",
        data: { reason: "timeout" },
      });
      expect(isSuccess(result)).toBe(false);
      expect(isCause(result)).toBe(false);
      expect(isException(result)).toBe(true);
      expect(result.name).toBe("DATABASE_ERROR");
      expect(result.data).toEqual({ reason: "timeout" });
    });

    it("should use Unit as default data", () => {
      const result = exception({
        name: "ERROR",
        message: "message",
      });
      expect(result.data).toBe(unit);
    });
  });

  describe("causeUnit", () => {
    it("should create a Cause with Unit data", () => {
      const result = causeUnit({
        name: "ERROR",
        message: "Something went wrong",
      });
      expect(isCause(result)).toBe(true);
      expect(result.data).toBe(unit);
    });
  });

  describe("exceptionUnit", () => {
    it("should create an Exception with Unit data", () => {
      const result = exceptionUnit({
        name: "ERROR",
        message: "Something went wrong",
      });
      expect(isException(result)).toBe(true);
      expect(result.data).toBe(unit);
    });
  });

  describe("type narrowing", () => {
    it("should correctly narrow Outcome types", () => {
      const outcomes: Outcome<number>[] = [
        success(42),
        cause({ name: "ERROR", message: "msg", data: {} }),
        exception({ name: "ERROR", message: "msg" }),
      ];

      for (const outcome of outcomes) {
        if (isSuccess(outcome)) {
          expect(typeof outcome.value).toBe("number");
        } else if (isCause(outcome)) {
          expect(typeof outcome.name).toBe("string");
        } else if (isException(outcome)) {
          expect(typeof outcome.name).toBe("string");
        }
      }
    });

    it("should work with typed Cause data", () => {
      interface UserError {
        id: number;
      }

      const result: Outcome<number, UserError> = cause({
        name: "NOT_FOUND",
        message: "User not found",
        data: { id: 123 },
      });

      if (isCause<UserError>(result)) {
        expect(result.data.id).toBe(123);
      }
    });

    it("should work with typed Exception data", () => {
      interface DbError {
        reason: string;
      }

      const result: Outcome<number, unknown, DbError> = exception({
        name: "DB_ERROR",
        message: "Connection failed",
        data: { reason: "timeout" },
      });

      if (isException<DbError>(result)) {
        expect(result.data.reason).toBe("timeout");
      }
    });
  });
});
