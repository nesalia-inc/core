import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  error,
  exceptionGroup,
  raise,
  isError,
  isErrorGroup,
  isErrWithError,
  isErrTryWithError,
  getErrorMessage,
  flattenErrorGroup,
  filterErrorsByName,
  ok,
  err,
  isOk,
  isErr,
} from "../src";

describe("error() with Zod schema validation", () => {
  describe("Zod schema validation", () => {
    it("should create error with Zod schema and validate args", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const e = SizeError({ current: 3, wanted: 5 });

      expect(isErr(e)).toBe(true);
      expect(e.error.name).toBe("SizeError");
      expect(e.error.args).toEqual({ current: 3, wanted: 5 });
    });

    it("should return validation error for invalid args", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      // @ts-expect-error - intentionally passing wrong type
      const e = SizeError({ current: "not a number", wanted: 5 });

      expect(isErr(e)).toBe(true);
      expect(e.error.name).toBe("SizeErrorValidationError");
      expect(e.error.notes).toHaveLength(1);
      expect(e.error.args).toBeDefined();
    });

    it("should work with addNotes on valid Zod error", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({
          field: z.string().min(1),
        }),
      });

      // Valid args, then addNotes
      const e = ValidationError({ field: "email" }).addNotes("Form submission failed");

      expect(isErr(e)).toBe(true);
      expect(e.error.notes).toEqual(["Form submission failed"]);
    });

    it("should work with from on Zod error", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({
          host: z.string(),
        }),
      });

      const cause = NetworkError({ host: "api.example.com" });
      const e = SizeError({ current: 3, wanted: 5 }).from(cause.error);

      expect(isErr(e)).toBe(true);
      expect(e.error.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });

    it("should create a frozen error object", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({ value: z.number() }),
      });

      const e = SizeError({ value: 10 });

      expect(Object.isFrozen(e)).toBe(true);
      expect(Object.isFrozen(e.error)).toBe(true);
      expect(Object.isFrozen(e.error.notes)).toBe(true);
    });

    it("should add notes after creating error", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      // Use addNotes on result after creating error
      const e = ValidationError({ field: "email" }).addNotes("Builder note");

      expect(e.error.notes).toEqual(["Builder note"]);
    });

    it("should chain addNotes on result multiple times", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      // Chain addNotes calls on the result
      const e = ValidationError({ field: "email" }).addNotes("Note 1").addNotes("Note 2");

      expect(e.error.notes).toEqual(["Note 1", "Note 2"]);
    });

    it("should add cause after creating error", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({ host: z.string() }),
      });

      const cause = NetworkError({ host: "api.example.com" });
      // Use from on result after creating error
      const e = SizeError({ current: 3, wanted: 5 }).from(cause.error);

      expect(e.error.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });

    it("should add cause from Err instead of Error", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({ host: z.string() }),
      });

      const cause = NetworkError({ host: "api.example.com" });
      // Pass Err instead of Error
      const e = SizeError({ current: 3, wanted: 5 }).from(cause);

      expect(e.error.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });

    it("should preserve cause when addNotes is called after from", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({ host: z.string() }),
      });

      const cause = NetworkError({ host: "api.example.com" });
      // from().addNotes() should preserve the cause
      const e = SizeError({ current: 3, wanted: 5 }).from(cause.error).addNotes("Note after from");

      expect(e.error.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
      expect(e.error.notes).toEqual(["Note after from"]);
    });

    it("should add notes before from", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({ host: z.string() }),
      });

      const cause = NetworkError({ host: "api.example.com" });
      // addNotes().from() should work
      const e = SizeError({ current: 3, wanted: 5 }).addNotes("Initial note").from(cause.error);

      expect(e.error.notes).toEqual(["Initial note"]);
      expect(e.error.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });

    it("should chain from twice on result", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({ host: z.string() }),
      });

      const AuthError = error({
        name: "AuthError",
        schema: z.object({ token: z.string() }),
      });

      const networkCause = NetworkError({ host: "api.example.com" });
      const authCause = AuthError({ token: "abc123" });
      // from().from() should override the cause
      const e = SizeError({ current: 3, wanted: 5 }).from(networkCause.error).from(authCause.error);

      expect(e.error.cause.map(c => c.name).getOrElse(undefined)).toBe("AuthError");
    });
  });

  describe("addNotes()", () => {
    it("should add a single note", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const e = ValidationError({ field: "email" }).addNotes("Invalid format");

      expect(e.error.notes).toEqual(["Invalid format"]);
    });

    it("should add multiple notes", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const e = ValidationError({ field: "email" })
        .addNotes("First note")
        .addNotes("Second note");

      expect(e.error.notes).toEqual(["First note", "Second note"]);
    });

    it("should preserve notes after creation", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const withNotes = ValidationError({ field: "email" }).addNotes("Context: API");
      const withoutNotes = ValidationError({ field: "email" });

      expect(withNotes.error.notes).toEqual(["Context: API"]);
      expect(withoutNotes.error.notes).toEqual([]);
    });

    it("should chain addNotes correctly", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const e = ValidationError({ field: "email" })
        .addNotes("Note 1")
        .addNotes("Note 2", "Note 3");

      expect(e.error.notes).toEqual(["Note 1", "Note 2", "Note 3"]);
    });
  });

  describe("from()", () => {
    it("should chain cause from another Error", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({ host: z.string() }),
      });

      const cause = NetworkError({ host: "api.example.com" });
      const e = SizeError({ current: 3, wanted: 5 }).from(cause.error);

      expect(e.error.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
      expect(e.error.cause.map(c => c.args).getOrElse(undefined)).toEqual({ host: "api.example.com" });
    });

    it("should chain cause from Err", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({ host: z.string() }),
      });

      const cause = NetworkError({ host: "api.example.com" });
      const e = SizeError({ current: 3, wanted: 5 }).from(cause);

      expect(e.error.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });
  });

  describe("combined addNotes and from", () => {
    it("should combine addNotes and from", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({ host: z.string() }),
      });

      const cause = NetworkError({ host: "api.example.com" });
      const e = SizeError({ current: 3, wanted: 5 })
        .addNotes("Operation: upload")
        .from(cause.error);

      expect(e.error.notes).toEqual(["Operation: upload"]);
      expect(e.error.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });
  });
});

describe("exceptionGroup()", () => {
  it("should create an error group", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string() }),
    });

    const group = exceptionGroup([
      SizeError({ value: 10 }),
      ValidationError({ field: "email" }),
    ]);

    expect(group.name).toBe("ExceptionGroup");
    expect(group.exceptions).toHaveLength(2);
    expect(group.exceptions[0].name).toBe("SizeError");
    expect(group.exceptions[1].name).toBe("ValidationError");
  });

  it("should create a frozen group", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const group = exceptionGroup([SizeError({ value: 10 })]);

    expect(Object.isFrozen(group)).toBe(true);
    expect(Object.isFrozen(group.exceptions)).toBe(true);
  });

  it("should handle empty group", () => {
    const group = exceptionGroup([]);

    expect(group.name).toBe("ExceptionGroup");
    expect(group.exceptions).toHaveLength(0);
  });

  it("should accept plain Error objects", () => {
    const plainError = {
      name: "PlainError",
      args: { value: 1 },
      notes: [] as readonly string[],
      cause: null,
      message: "PlainError",
    };

    const group = exceptionGroup([plainError]);

    expect(group.exceptions).toHaveLength(1);
    expect(group.exceptions[0].name).toBe("PlainError");
  });

  it("should flatten nested ErrorGroups", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const innerGroup = exceptionGroup([SizeError({ value: 10 })]);
    const outerGroup = exceptionGroup([innerGroup]);

    expect(outerGroup.exceptions).toHaveLength(1);
    expect(outerGroup.exceptions[0].name).toBe("SizeError");
  });
});

describe("raise()", () => {
  it("should throw the error and return never", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({
        current: z.number(),
        wanted: z.number(),
      }),
    });

    // raise() throws the error and returns never
    expect(() => raise(SizeError({ current: 3, wanted: 5 }))).toThrow();
  });

  it("should throw with the correct error object", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({
        current: z.number(),
        wanted: z.number(),
      }),
    });

    const errorObj = SizeError({ current: 3, wanted: 5 }).error;

    try {
      raise(errorObj);
      fail("Expected error to be thrown");
    } catch (e) {
      expect(e).toBe(errorObj);
    }
  });
});

describe("isError()", () => {
  it("should return true for valid Error", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const e = SizeError({ value: 10 });

    expect(isError(e.error)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isError(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isError(undefined)).toBe(false);
  });

  it("should return false for primitive", () => {
    expect(isError("string")).toBe(false);
    expect(isError(42)).toBe(false);
    expect(isError(true)).toBe(false);
  });

  it("should return false for plain object", () => {
    expect(isError({ name: "Error" })).toBe(false);
  });

  it("should return false for Result with non-Error", () => {
    // globalThis.Error doesn't satisfy our custom Error type (missing args, notes, cause)
    const result = err(new globalThis.Error("string error"));
    expect(isError(result.error)).toBe(false);
  });
});

describe("isErrorGroup()", () => {
  it("should return true for valid ErrorGroup", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const group = exceptionGroup([SizeError({ value: 10 })]);

    expect(isErrorGroup(group)).toBe(true);
  });

  it("should return true for empty group", () => {
    const group = exceptionGroup([]);
    expect(isErrorGroup(group)).toBe(true);
  });

  it("should return false for single Error", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const e = SizeError({ value: 10 });
    expect(isErrorGroup(e.error)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isErrorGroup(null)).toBe(false);
  });
});

describe("isErrWithError()", () => {
  it("should return true when Result contains Error", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const result = SizeError({ value: 10 });

    expect(isErrWithError(result)).toBe(true);
  });

  it("should return false when Result is Ok", () => {
    const result = ok(42);
    expect(isErrWithError(result)).toBe(false);
  });

  it("should return false when Result contains non-Error", () => {
    // globalThis.Error doesn't satisfy our custom Error type
    const result = err(new globalThis.Error("some error"));
    expect(isErrWithError(result)).toBe(false);
  });
});

describe("isErrTryWithError()", () => {
  it("should return true when Try contains Error", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    // Create a TryFailure directly with our Error type
    const t = SizeError({ value: 10 });
    // Simulate a Try structure with our Error
    const tryWithError = { ok: false as const, error: t.error };

    expect(isErrTryWithError(tryWithError)).toBe(true);
  });

  it("should return false when Try does not contain Error", () => {
    const tryWithString = { ok: false as const, error: "some error" };
    expect(isErrTryWithError(tryWithString)).toBe(false);
  });
});

describe("getErrorMessage()", () => {
  it("should return message for single Error with args", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({
        current: z.number(),
        wanted: z.number(),
      }),
    });

    const e = SizeError({ current: 3, wanted: 5 });

    expect(getErrorMessage(e.error)).toBe('SizeError: {"current":3,"wanted":5}');
  });

  it("should return message for ErrorGroup", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const group = exceptionGroup([
      SizeError({ value: 10 }),
      SizeError({ value: 20 }),
    ]);

    expect(getErrorMessage(group)).toBe("ExceptionGroup: 2 error(s)");
  });
});

describe("flattenErrorGroup()", () => {
  it("should flatten nested groups", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string() }),
    });

    const innerGroup = exceptionGroup([SizeError({ value: 10 })]);
    const outerGroup = exceptionGroup([innerGroup, ValidationError({ field: "email" })]);

    const flat = flattenErrorGroup(outerGroup);

    expect(flat).toHaveLength(2);
    expect(flat[0].name).toBe("SizeError");
    expect(flat[1].name).toBe("ValidationError");
  });

  it("should handle single error", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const e = SizeError({ value: 10 });
    const flat = flattenErrorGroup(e.error);

    expect(flat).toHaveLength(1);
    expect(flat[0].name).toBe("SizeError");
  });
});

describe("filterErrorsByName()", () => {
  it("should filter errors by name", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string() }),
    });

    const group = exceptionGroup([
      SizeError({ value: 10 }),
      ValidationError({ field: "email" }),
      SizeError({ value: 20 }),
    ]);

    const sizeErrors = filterErrorsByName(group, "SizeError");

    expect(sizeErrors).toHaveLength(2);
    expect(sizeErrors.every((e) => e.name === "SizeError")).toBe(true);
  });

  it("should return empty array when no matches", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const group = exceptionGroup([SizeError({ value: 10 })]);

    const notFound = filterErrorsByName(group, "NonExistent");

    expect(notFound).toHaveLength(0);
  });
});

describe("integration with Result", () => {
  it("should work with mapErr", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({
        current: z.number(),
        wanted: z.number(),
      }),
    });

    // Start with an Err and transform it with mapErr
    const initialErr = err(SizeError({ current: 3, wanted: 5 }).error);
    const result = initialErr.mapErr((e) => e);

    expect(isErr(result)).toBe(true);
    expect(result.error.name).toBe("SizeError");
  });

  it("should work with flatMap", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const result = ok(10).flatMap((x) => {
      if (x <= 5) {
        return SizeError({ value: x });
      }
      return ok(x * 2);
    });

    expect(isOk(result)).toBe(true);
    expect(result.value).toBe(20);
  });

  it("should work with flatMap when error", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const result = ok(10).flatMap((x) => {
      if (x > 5) {
        return SizeError({ value: x });
      }
      return ok(x * 2);
    });

    // x = 10 > 5, so it returns error
    expect(isErr(result)).toBe(true);
  });
});
