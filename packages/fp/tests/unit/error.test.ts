import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  error,
  exceptionGroup,
  raise,
  isError,
  isErrorGroup,
  getErrorMessage,
  flattenErrorGroup,
  filterErrorsByName,
  ok,
  err,
  isOk,
  isErr,
  panic,
  isPanic,
  matchErrorPartial,
  matchError,
} from "../../src/index.js";

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

      // Error is a plain object - verify structure directly
      expect(e.name).toBe("SizeError");
      expect(e.args).toEqual({ current: 3, wanted: 5 });
      expect(isError(e)).toBe(true);
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

      expect(e.name).toBe("SizeErrorValidationError");
      expect(e.notes).toHaveLength(1);
      expect(e.args).toBeDefined();
    });

    it("should work with addNotes on Zod error", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({
          field: z.string().min(1),
        }),
      });

      // Valid args, then addNotes
      const e = ValidationError({ field: "email" }).addNotes("Form submission failed");

      expect(e.notes).toEqual(["Form submission failed"]);
    });

    it("should not allow addNotes on validation error", () => {
      // When Zod validation fails, addNotes should return error with note about limitation
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({
          field: z.string().min(1),
        }),
      });

      // @ts-expect-error - intentionally passing wrong type to trigger validation error
      const validationErr = ValidationError({ field: 123 }); // Invalid - field must be string

      const withNotes = validationErr.addNotes("would be nice to add notes");

      // The note indicates addNotes doesn't work on validation errors
      expect(withNotes.notes).toContain("Cannot add notes to validation error");
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
      const e = SizeError({ current: 3, wanted: 5 }).from(cause);

      expect(e.cause.isSome()).toBe(true);
      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });

    it("should not allow from on validation error", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({
          field: z.string().min(1),
        }),
      });

      const NetworkError = error({
        name: "NetworkError",
        schema: z.object({
          host: z.string(),
        }),
      });

      // @ts-expect-error - intentionally passing wrong type to trigger validation error
      const validationErr = ValidationError({ field: 123 });

      const cause = NetworkError({ host: "api.example.com" });
      const withCause = validationErr.from(cause);

      expect(withCause.notes).toContain("Cannot chain cause on validation error");
    });

    it("should create a frozen error object", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({ value: z.number() }),
      });

      const e = SizeError({ value: 10 });

      expect(Object.isFrozen(e)).toBe(true);
      expect(Object.isFrozen(e.notes)).toBe(true);
    });

    it("should add notes after creating error", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      // Use addNotes directly on error
      const e = ValidationError({ field: "email" }).addNotes("Builder note");

      expect(e.notes).toEqual(["Builder note"]);
    });

    it("should chain addNotes on error multiple times", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      // Chain addNotes calls on the error
      const e = ValidationError({ field: "email" }).addNotes("Note 1").addNotes("Note 2");

      expect(e.notes).toEqual(["Note 1", "Note 2"]);
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
      // Use from directly on error
      const e = SizeError({ current: 3, wanted: 5 }).from(cause);

      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
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

      const causeResult = err(NetworkError({ host: "api.example.com" }));
      // Pass Err instead of Error - extract the error from the result
      const e = SizeError({ current: 3, wanted: 5 }).from(causeResult);

      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
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
      const e = SizeError({ current: 3, wanted: 5 }).from(cause).addNotes("Note after from");

      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
      expect(e.notes).toEqual(["Note after from"]);
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
      const e = SizeError({ current: 3, wanted: 5 }).addNotes("Initial note").from(cause);

      expect(e.notes).toEqual(["Initial note"]);
      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });

    it("should chain from twice on error", () => {
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
      const e = SizeError({ current: 3, wanted: 5 }).from(networkCause).from(authCause);

      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("AuthError");
    });
  });

  describe("addNotes()", () => {
    it("should add a single note", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const e = ValidationError({ field: "email" }).addNotes("Invalid format");

      expect(e.notes).toEqual(["Invalid format"]);
    });

    it("should add multiple notes", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const e = ValidationError({ field: "email" })
        .addNotes("First note")
        .addNotes("Second note");

      expect(e.notes).toEqual(["First note", "Second note"]);
    });

    it("should preserve notes after creation", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const withNotes = ValidationError({ field: "email" }).addNotes("Context: API");
      const withoutNotes = ValidationError({ field: "email" });

      expect(withNotes.notes).toEqual(["Context: API"]);
      expect(withoutNotes.notes).toEqual([]);
    });

    it("should chain addNotes correctly", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const e = ValidationError({ field: "email" })
        .addNotes("Note 1")
        .addNotes("Note 2", "Note 3");

      expect(e.notes).toEqual(["Note 1", "Note 2", "Note 3"]);
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
      const e = SizeError({ current: 3, wanted: 5 }).from(cause);

      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
      expect(e.cause.map(c => c.args).getOrElse(undefined)).toEqual({ host: "api.example.com" });
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

      const causeResult = err(NetworkError({ host: "api.example.com" }));
      const e = SizeError({ current: 3, wanted: 5 }).from(causeResult);

      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });

    it("should handle None-like cause (ok: false without value/error)", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      // Pass a None-like object (ok: false but no value or error property)
      // @ts-expect-error - intentionally testing invalid input
      const noneLike = { ok: false };
      const e = SizeError({ current: 3, wanted: 5 }).from(noneLike);

      // Should result in None (no cause)
      expect(e.cause.isNone()).toBe(true);
    });

    it("should handle invalid cause and return None", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({
          current: z.number(),
          wanted: z.number(),
        }),
      });

      // Pass an invalid object
      // @ts-expect-error - intentionally testing invalid input
      const invalid = {};
      const e = SizeError({ current: 3, wanted: 5 }).from(invalid);

      // Should result in None (no valid cause)
      expect(e.cause.isNone()).toBe(true);
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
        .from(cause);

      expect(e.notes).toEqual(["Operation: upload"]);
      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
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

    const errorObj = SizeError({ current: 3, wanted: 5 });

    try {
      raise(errorObj);
      fail("Expected error to be thrown");
    } catch (error_) {
      expect(error_).toBe(errorObj);
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

    expect(isError(e)).toBe(true);
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

  it("should return false for plain native error", () => {
    expect(isError(new globalThis.Error("string error"))).toBe(false);
  });

  it("should return false for cause with ok property that is not boolean true", () => {
    // cause.ok is truthy but not exactly true
    expect(isError({ name: "Test", notes: [], args: {}, cause: { ok: "true", value: {} } })).toBe(false);
  });

  it("should return false for cause with message and name but no args", () => {
    // Native error-like object without our Error's required args
    expect(isError({ name: "Test", notes: [], cause: { message: "msg", name: "Err" } })).toBe(false);
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
    expect(isErrorGroup(e)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isErrorGroup(null)).toBe(false);
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

    expect(getErrorMessage(e)).toBe('SizeError: {"current":3,"wanted":5}');
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
    const flat = flattenErrorGroup(e);

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

describe("error() without schema", () => {
  it("should create error without schema", () => {
    const SimpleError = error({
      name: "SimpleError",
    });

    const e = SimpleError({ any: "args" });

    expect(e.name).toBe("SimpleError");
    expect(e.args).toEqual({ any: "args" });
    expect(isError(e)).toBe(true);
  });

  it("should create error without schema with message function", () => {
    const SimpleError = error({
      name: "SimpleError",
      message: (args) => `Custom: ${JSON.stringify(args)}`,
    });

    const e = SimpleError({ key: "value" });

    expect(e.message).toBe('Custom: {"key":"value"}');
  });

  it("should work with addNotes without schema", () => {
    const SimpleError = error({
      name: "SimpleError",
    });

    const e = SimpleError({ data: 42 }).addNotes("context");

    expect(e.notes).toContain("context");
  });

  it("should work with from without schema", () => {
    const CauseError = error({
      name: "CauseError",
    });
    const SimpleError = error({
      name: "SimpleError",
    });

    const e = SimpleError({ data: 42 }).from(CauseError({ reason: "bad" }));

    expect(e.cause.isSome()).toBe(true);
  });
});

describe("ErrorBuilder.is() type guard", () => {
  it("should return true for matching error type", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string(), resource: z.string() }),
    });

    const err = NotFoundError({ id: "123", resource: "User" });

    expect(NotFoundError.is(err)).toBe(true);
  });

  it("should return false for different error type", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string() }),
    });

    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string() }),
    });

    const err = ValidationError({ field: "email" });

    expect(NotFoundError.is(err)).toBe(false);
  });

  it("should narrow type within if block", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string(), resource: z.string() }),
    });

    const err = NotFoundError({ id: "123", resource: "User" });

    if (NotFoundError.is(err)) {
      // TypeScript should narrow err to NotFoundError type
      // The error's data is in err.args
      expect(err.args.id).toBe("123");
      expect(err.args.resource).toBe("User");
    }
  });

  it("should work with errors without schema", () => {
    const SimpleError = error({ name: "SimpleError" });

    const err = SimpleError({ any: "args" });

    expect(SimpleError.is(err)).toBe(true);
  });

  it("should return false for non-error values", () => {
    const MyError = error({ name: "MyError" });

    expect(MyError.is(null)).toBe(false);
    expect(MyError.is(undefined)).toBe(false);
    expect(MyError.is("string")).toBe(false);
    expect(MyError.is(42)).toBe(false);
    expect(MyError.is({ name: "MyError" })).toBe(false);
    expect(MyError.is(new globalThis.Error("test"))).toBe(false);
  });

  it("should return false for validation errors of same name", () => {
    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string() }),
    });

    // @ts-expect-error - intentionally passing wrong type to trigger validation error
    const err = ValidationError({ field: 123 });

    // Validation errors have name "ValidationErrorValidationError" (not just "ValidationError")
    expect(ValidationError.is(err)).toBe(false);
  });

  it("should work with multiple error types in if-else chain", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string(), resource: z.string() }),
    });

    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string(), message: z.string() }),
    });

    const TimeoutError = error({
      name: "TimeoutError",
      schema: z.object({ ms: z.number() }),
    });

    const processError = (err: Error) => {
      if (NotFoundError.is(err)) {
        return `Not found: ${err.args.id}`;
      }
      if (ValidationError.is(err)) {
        return `Validation: ${err.args.field}`;
      }
      if (TimeoutError.is(err)) {
        return `Timeout: ${err.args.ms}ms`;
      }
      return "Unknown error";
    };

    expect(processError(NotFoundError({ id: "123", resource: "User" }))).toBe("Not found: 123");
    expect(processError(ValidationError({ field: "email", message: "invalid" }))).toBe("Validation: email");
    expect(processError(TimeoutError({ ms: 5000 }))).toBe("Timeout: 5000ms");
  });
});

describe("integration with Result", () => {
  it("should work with mapErr on wrapped error", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({
        current: z.number(),
        wanted: z.number(),
      }),
    });

    // Wrap the error with err() to get Result methods
    const initialErr = err(SizeError({ current: 3, wanted: 5 }));
    const result = initialErr.mapErr((e) => e);

    expect(isErr(result)).toBe(true);
    expect(result.error.name).toBe("SizeError");
  });

  it("should work with flatMap using err()", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const result = ok(10).flatMap((x) => {
      if (x <= 5) {
        return err(SizeError({ value: x }));
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
        return err(SizeError({ value: x }));
      }
      return ok(x * 2);
    });

    // x = 10 > 5, so it returns error
    expect(isErr(result)).toBe(true);
  });

  it("should allow using Error directly with err()", () => {
    const MyError = error({ name: "MyError" });

    const domainError = MyError({ detail: "something" });

    // domainError is a plain error object
    expect(isError(domainError)).toBe(true);
    expect(domainError.name).toBe("MyError");
    expect(domainError.args).toEqual({ detail: "something" });

    // Wrap with err() to get Result methods
    const result = err(domainError);
    expect(isErr(result)).toBe(true);
    expect(result.error).toBe(domainError); // result.error === domainError (reference, not self)
  });
});

describe("sensitive data redaction", () => {
  it("should redact password field", () => {
    const CredentialsError = error({ name: "CredentialsError" });

    const e = CredentialsError({
      username: "user@example.com",
      password: "super_secret_password",
    });

    expect(e.message).toContain("username");
    expect(e.message).toContain("user@example.com");
    expect(e.message).toContain("password");
    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("super_secret_password");
  });

  it("should redact token field", () => {
    const AuthError = error({ name: "AuthError" });

    const e = AuthError({
      userId: 12345,
      token: "sk_live_abc123",
    });

    expect(e.message).toContain("userId");
    expect(e.message).toContain("12345");
    expect(e.message).toContain("token");
    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("sk_live_abc123");
  });

  it("should redact secret field", () => {
    const SecretError = error({ name: "SecretError" });

    const e = SecretError({ apiSecret: "my_secret_key" });

    expect(e.message).toContain("apiSecret");
    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("my_secret_key");
  });

  it("should redact api_key field", () => {
    const ConfigError = error({ name: "ConfigError" });

    const e = ConfigError({ api_key: "key_12345" });

    expect(e.message).toContain("api_key");
    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("key_12345");
  });

  it("should redact credential field", () => {
    const ServiceError = error({ name: "ServiceError" });

    const e = ServiceError({ credential: "my_credential" });

    expect(e.message).toContain("credential");
    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("my_credential");
  });

  it("should redact nested sensitive fields", () => {
    const ComplexError = error({ name: "ComplexError" });

    const e = ComplexError({
      user: {
        name: "John",
        password: "secret123",
      },
    });

    expect(e.message).toContain("user");
    expect(e.message).toContain("name");
    expect(e.message).toContain("John");
    expect(e.message).not.toContain("secret123");
    expect(e.message).toContain("[REDACTED]");
  });

  it("should not redact non-sensitive fields", () => {
    const ValidationError = error({ name: "ValidationError" });

    const e = ValidationError({
      field: "email",
      value: "not_an_email",
    });

    expect(e.message).toContain("email");
    expect(e.message).toContain("not_an_email");
    expect(e.message).not.toContain("[REDACTED]");
  });

  it("should preserve args with sensitive fields intact", () => {
    const CredentialsError = error({ name: "CredentialsError" });

    const e = CredentialsError({
      username: "user@example.com",
      password: "super_secret_password",
    });

    // Args should NOT be modified - only the message is redacted
    expect(e.args).toEqual({
      username: "user@example.com",
      password: "super_secret_password",
    });
  });

  it("should redact with Zod schema validation", () => {
    const SecureError = error({
      name: "SecureError",
      schema: z.object({
        userId: z.number(),
        apiKey: z.string(),
      }),
    });

    const e = SecureError({
      userId: 123,
      apiKey: "secret_api_key",
    });

    expect(e.message).toContain("userId");
    expect(e.message).toContain("123");
    expect(e.message).toContain("apiKey");
    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("secret_api_key");
  });

  it("should be case-insensitive for sensitive field detection", () => {
    const TestError = error({ name: "TestError" });

    const e = TestError({
      PASSWORD: "secret1",
      Token: "secret2",
      SECRET: "secret3",
    });

    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("secret1");
    expect(e.message).not.toContain("secret2");
    expect(e.message).not.toContain("secret3");
  });
});

describe("Panic", () => {
  describe("panic()", () => {
    it("should throw Panic with string reason", () => {
      expect(() => panic("out of bounds")).toThrow();

      try {
        panic("out of bounds");
      } catch (error_: unknown) {
        const p = error_ as { _tag: string; reason: string; error: globalThis.Error };
        expect(p._tag).toBe("Panic");
        expect(p.reason).toBe("out of bounds");
        expect(p.error).toBeInstanceOf(globalThis.Error);
      }
    });

    it("should throw Panic with Error object", () => {
      const originalError = new globalThis.Error("callback failed");

      try {
        panic(originalError);
      } catch (error_: unknown) {
        const p = error_ as { _tag: string; reason: string; error: globalThis.Error };
        expect(p._tag).toBe("Panic");
        expect(p.reason).toBe("callback failed");
        expect(p.error).toBe(originalError);
      }
    });

    it("should throw Panic that propagates through try/catch", () => {
      const catchPanic = () => {
        try {
          panic("programmer defect");
        } catch {
          // Re-throw the panic
          throw new globalThis.Error("caught and rethrown");
        }
      };

      expect(catchPanic).toThrow();
    });

    it("should create frozen Panic object", () => {
      try {
        panic("test");
      } catch (error_: unknown) {
        const p = error_ as { _tag: string; reason: string; error: globalThis.Error };
        expect(Object.isFrozen(p)).toBe(true);
        // Note: Native Error objects cannot be frozen, so we only check the panic wrapper
      }
    });
  });

  describe("Panic.is (isPanic guard)", () => {
    it("should return true for Panic values", () => {
      try {
        panic("test panic");
      } catch (error_: unknown) {
        expect(isPanic(error_)).toBe(true);
      }
    });

    it("should return false for regular Error", () => {
      const e = error({ name: "TestError" })({ value: 1 });
      expect(isPanic(e)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isPanic(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isPanic(undefined)).toBe(false);
    });

    it("should return false for primitive", () => {
      expect(isPanic("string")).toBe(false);
      expect(isPanic(42)).toBe(false);
      expect(isPanic(true)).toBe(false);
    });

    it("should return false for plain object", () => {
      expect(isPanic({ _tag: "Panic" })).toBe(false);
      expect(isPanic({ _tag: "Panic", reason: "test" })).toBe(false);
      expect(isPanic({ _tag: "Panic", error: new globalThis.Error("test"), reason: "test" })).toBe(false);
    });

    it("should return false for Error with _tag property but not Panic", () => {
      const e = error({ name: "TaggedError" })({ id: "1" });
      // Regular errors don't have _tag
      expect(isPanic(e)).toBe(false);
    });
  });
});

describe("matchErrorPartial()", () => {
  it("should match specific error types", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string(), resource: z.string() }),
    });

    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string(), message: z.string() }),
    });

    const notFoundErr = NotFoundError({ id: "123", resource: "User" });
    const validationErr = ValidationError({ field: "email", message: "invalid" });

    const result1 = matchErrorPartial(notFoundErr, {
      NotFoundError: (e) => `Missing: ${e.args.id}`,
      ValidationError: (e) => `Invalid: ${e.args.field}`,
    }, (e) => `Unknown: ${e.name}`);

    expect(result1).toBe("Missing: 123");

    const result2 = matchErrorPartial(validationErr, {
      NotFoundError: (e) => `Missing: ${e.args.id}`,
      ValidationError: (e) => `Invalid: ${e.args.field}`,
    }, (e) => `Unknown: ${e.name}`);

    expect(result2).toBe("Invalid: email");
  });

  it("should call fallback for unhandled error types", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string() }),
    });

    const TimeoutError = error({
      name: "TimeoutError",
      schema: z.object({ ms: z.number() }),
    });

    const timeoutErr = TimeoutError({ ms: 5000 });

    const result = matchErrorPartial(timeoutErr, {
      NotFoundError: NotFoundError,
      ValidationError: error({ name: "ValidationError" }),
    }, (e) => `Unknown error: ${e.name}`);

    expect(result).toBe("Unknown error: TimeoutError");
  });

  it("should handle Panic in matchErrorPartial", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string() }),
    });

    let caughtPanic: { _tag: string; reason: string } | null = null;

    try {
      panic("unrecoverable defect");
    } catch (error_) {
      const p = error_ as { _tag: string; reason: string; error: globalThis.Error };
      caughtPanic = p;

      const result = matchErrorPartial(p, {
        NotFoundError: NotFoundError,
      }, (e) => `Panic: ${(e as { reason: string }).reason}`);

      expect(result).toBe("Panic: unrecoverable defect");
    }

    expect(caughtPanic).not.toBeNull();
  });

  it("should pass Panic type correctly to handlers", () => {
    let receivedValue: unknown = null;

    try {
      panic(new globalThis.Error("test error"));
    } catch (error_: unknown) {
      matchErrorPartial(error_ as { _tag: string; error: globalThis.Error; reason: string }, {
        NotFoundError: (e) => e,
      }, (e) => {
        receivedValue = e;
        return "fallback";
      });
    }

    expect(receivedValue).not.toBeNull();
    expect((receivedValue as { _tag: string })._tag).toBe("Panic");
  });

  it("should work with empty handlers (all fall through)", () => {
    const e = error({ name: "GenericError" })({ code: 500 });

    const result = matchErrorPartial(e, {}, (e) => `Default: ${e.name}`);

    expect(result).toBe("Default: GenericError");
  });

  it("should use correct handler when multiple match", () => {
    const NotFoundError = error({ name: "NotFoundError" });
    const ValidationError = error({ name: "ValidationError" });

    // When two handlers could match, first one wins
    const result = matchErrorPartial(
      NotFoundError({ id: "123" }),
      {
        NotFoundError: () => "not found handler",
        ValidationError: () => "validation handler",
      },
      () => "fallback"
    );

    expect(result).toBe("not found handler");

    // Also test that ValidationError handler works when ValidationError is passed
    const validationErr = ValidationError({ field: "email" });
    const result2 = matchErrorPartial(
      validationErr,
      {
        NotFoundError: () => "not found handler",
        ValidationError: () => "validation handler",
      },
      () => "fallback"
    );

    expect(result2).toBe("validation handler");
  });
});

describe("Panic in async context", () => {
  it("should allow panic to be used and caught in async function", async () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string() }),
    });

    // An async function that uses panic
    const getUserOrPanic = async (id: string) => {
      const result = id === "valid" ? { id } : null;
      if (!result) {
        panic(NotFoundError({ id }));
      }
      return result;
    };

    // When user not found, panic should be thrown
    try {
      await getUserOrPanic("invalid");
      fail("Expected panic to be thrown");
    } catch (error_: unknown) {
      expect(isPanic(error_)).toBe(true);
    }
  });

  it("should allow panic with string reason in async context", async () => {
    const getValueOrPanic = async (value: number) => {
      if (value < 0) {
        panic("Value must be non-negative");
      }
      return value;
    };

    try {
      await getValueOrPanic(-1);
      fail("Expected panic to be thrown");
    } catch (error_: unknown) {
      expect(isPanic(error_)).toBe(true);
    }
  });
});

describe("matchError()", () => {
  it("should match specific error types exhaustively", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string(), resource: z.string() }),
    });

    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string(), message: z.string() }),
    });

    const notFoundErr = NotFoundError({ id: "123", resource: "User" });
    const validationErr = ValidationError({ field: "email", message: "invalid" });

    const result1 = matchError(notFoundErr as NotFoundError | ValidationError, {
      NotFoundError: (e) => `Missing: ${e.args.id}`,
      ValidationError: (e) => `Invalid: ${e.args.field}`,
    });

    expect(result1).toBe("Missing: 123");

    const result2 = matchError(validationErr as NotFoundError | ValidationError, {
      NotFoundError: (e) => `Missing: ${e.args.id}`,
      ValidationError: (e) => `Invalid: ${e.args.field}`,
    });

    expect(result2).toBe("Invalid: email");
  });

  it("should work with three or more error types", () => {
    const NotFoundError = error({ name: "NotFoundError" });
    const ValidationError = error({ name: "ValidationError" });
    const TimeoutError = error({ name: "TimeoutError" });

    const timeoutErr = TimeoutError({ ms: 5000 });

    const result = matchError(timeoutErr as NotFoundError | ValidationError | TimeoutError, {
      NotFoundError: (e) => `Missing: ${e.args.id}`,
      ValidationError: (e) => `Invalid: ${e.args.field}`,
      TimeoutError: (e) => `Timeout: ${e.args.ms}ms`,
    });

    expect(result).toBe("Timeout: 5000ms");
  });

  it("should handle Panic with exhaustive matching", () => {
    let caughtPanic: { _tag: string; reason: string } | null = null;

    try {
      panic("unrecoverable defect");
    } catch (error_) {
      const p = error_ as { _tag: string; reason: string; error: globalThis.Error };
      caughtPanic = p;

      const result = matchError(p as Panic, {
        Panic: (e) => `Panic: ${e.reason}`,
      });

      expect(result).toBe("Panic: unrecoverable defect");
    }

    expect(caughtPanic).not.toBeNull();
  });

  it("should narrow error types in handlers", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string(), resource: z.string() }),
    });

    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string(), message: z.string() }),
    });

    const notFoundErr = NotFoundError({ id: "123", resource: "User" });

    // TypeScript should narrow e to NotFoundError inside its handler
    const result = matchError(notFoundErr as NotFoundError | ValidationError, {
      NotFoundError: (e) => {
        // e should be narrowed to NotFoundError
        const _typeCheck: typeof e.args.id = e.args.id;
        return `Missing ${_typeCheck}`;
      },
      ValidationError: (e) => `Invalid: ${e.args.field}`,
    });

    expect(result).toBe("Missing 123");
  });

  it("should work with errors that have no args schema", () => {
    const SimpleError = error({ name: "SimpleError" });
    const AnotherError = error({ name: "AnotherError" });

    const simpleErr = SimpleError({});

    const result = matchError(simpleErr as SimpleError | AnotherError, {
      SimpleError: (e) => `Simple: ${e.name}`,
      AnotherError: (e) => `Another: ${e.name}`,
    });

    expect(result).toBe("Simple: SimpleError");
  });
});
