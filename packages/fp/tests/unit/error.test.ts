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

      const e = new SizeError({ current: 3, wanted: 5 });

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
      const e = new SizeError({ current: "not a number", wanted: 5 });

      expect(e.name).toBe("SizeErrorValidationError");
      expect(e.notes).toHaveLength(1);
      expect(e.args).toBeDefined();
    });

    it("should work with addNotes on valid Zod error", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({
          field: z.string().min(1),
        }),
      });

      // Valid args, then addNotes
      const e = new ValidationError({ field: "email" }).addNotes("Form submission failed");

      expect(e.notes).toEqual(["Form submission failed"]);
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

      const cause = new NetworkError({ host: "api.example.com" });
      const e = new SizeError({ current: 3, wanted: 5 }).from(cause);

      expect(e.cause.isSome()).toBe(true);
      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("NetworkError");
    });

    it("should create a frozen error object", () => {
      const SizeError = error({
        name: "SizeError",
        schema: z.object({ value: z.number() }),
      });

      const e = new SizeError({ value: 10 });

      expect(Object.isFrozen(e)).toBe(true);
      expect(Object.isFrozen(e.notes)).toBe(true);
    });

    it("should add notes after creating error", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      // Use addNotes directly on error
      const e = new ValidationError({ field: "email" }).addNotes("Builder note");

      expect(e.notes).toEqual(["Builder note"]);
    });

    it("should chain addNotes on error multiple times", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      // Chain addNotes calls on the error
      const e = new ValidationError({ field: "email" }).addNotes("Note 1").addNotes("Note 2");

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

      const cause = new NetworkError({ host: "api.example.com" });
      // Use from directly on error
      const e = new SizeError({ current: 3, wanted: 5 }).from(cause);

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

      const causeResult = err(new NetworkError({ host: "api.example.com" }));
      // Pass Err instead of Error - extract the error from the result
      const e = new SizeError({ current: 3, wanted: 5 }).from(causeResult);

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

      const cause = new NetworkError({ host: "api.example.com" });
      // from().addNotes() should preserve the cause
      const e = new SizeError({ current: 3, wanted: 5 }).from(cause).addNotes("Note after from");

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

      const cause = new NetworkError({ host: "api.example.com" });
      // addNotes().from() should work
      const e = new SizeError({ current: 3, wanted: 5 }).addNotes("Initial note").from(cause);

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

      const networkCause = new NetworkError({ host: "api.example.com" });
      const authCause = new AuthError({ token: "abc123" });
      // from().from() should override the cause
      const e = new SizeError({ current: 3, wanted: 5 }).from(networkCause).from(authCause);

      expect(e.cause.map(c => c.name).getOrElse(undefined)).toBe("AuthError");
    });
  });

  describe("addNotes()", () => {
    it("should add a single note", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const e = new ValidationError({ field: "email" }).addNotes("Invalid format");

      expect(e.notes).toEqual(["Invalid format"]);
    });

    it("should add multiple notes", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const e = new ValidationError({ field: "email" })
        .addNotes("First note")
        .addNotes("Second note");

      expect(e.notes).toEqual(["First note", "Second note"]);
    });

    it("should preserve notes after creation", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const withNotes = new ValidationError({ field: "email" }).addNotes("Context: API");
      const withoutNotes = new ValidationError({ field: "email" });

      expect(withNotes.notes).toEqual(["Context: API"]);
      expect(withoutNotes.notes).toEqual([]);
    });

    it("should chain addNotes correctly", () => {
      const ValidationError = error({
        name: "ValidationError",
        schema: z.object({ field: z.string() }),
      });

      const e = new ValidationError({ field: "email" })
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

      const cause = new NetworkError({ host: "api.example.com" });
      const e = new SizeError({ current: 3, wanted: 5 }).from(cause);

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

      const causeResult = err(new NetworkError({ host: "api.example.com" }));
      const e = new SizeError({ current: 3, wanted: 5 }).from(causeResult);

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
      const e = new SizeError({ current: 3, wanted: 5 }).from(noneLike);

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
      const e = new SizeError({ current: 3, wanted: 5 }).from(invalid);

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

      const cause = new NetworkError({ host: "api.example.com" });
      const e = new SizeError({ current: 3, wanted: 5 })
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
      new SizeError({ value: 10 }),
      new ValidationError({ field: "email" }),
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

    const group = exceptionGroup([new SizeError({ value: 10 })]);

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

    const innerGroup = exceptionGroup([new SizeError({ value: 10 })]);
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
    expect(() => raise(new SizeError({ current: 3, wanted: 5 }))).toThrow();
  });

  it("should throw with the correct error object", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({
        current: z.number(),
        wanted: z.number(),
      }),
    });

    const errorObj = new SizeError({ current: 3, wanted: 5 });

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

    const e = new SizeError({ value: 10 });

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

    const group = exceptionGroup([new SizeError({ value: 10 })]);

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

    const e = new SizeError({ value: 10 });
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

    const e = new SizeError({ current: 3, wanted: 5 });

    expect(getErrorMessage(e)).toBe('SizeError: {"current":3,"wanted":5}');
  });

  it("should return message for ErrorGroup", () => {
    const SizeError = error({
      name: "SizeError",
      schema: z.object({ value: z.number() }),
    });

    const group = exceptionGroup([
      new SizeError({ value: 10 }),
      new SizeError({ value: 20 }),
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

    const innerGroup = exceptionGroup([new SizeError({ value: 10 })]);
    const outerGroup = exceptionGroup([innerGroup, new ValidationError({ field: "email" })]);

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

    const e = new SizeError({ value: 10 });
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
      new SizeError({ value: 10 }),
      new ValidationError({ field: "email" }),
      new SizeError({ value: 20 }),
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

    const group = exceptionGroup([new SizeError({ value: 10 })]);

    const notFound = filterErrorsByName(group, "NonExistent");

    expect(notFound).toHaveLength(0);
  });
});

describe("error() without schema", () => {
  it("should create error without schema", () => {
    const SimpleError = error({
      name: "SimpleError",
    });

    const e = new SimpleError({ any: "args" });

    expect(e.name).toBe("SimpleError");
    expect(e.args).toEqual({ any: "args" });
    expect(isError(e)).toBe(true);
  });

  it("should create error without schema with message function", () => {
    const SimpleError = error({
      name: "SimpleError",
      message: (args) => `Custom: ${JSON.stringify(args)}`,
    });

    const e = new SimpleError({ key: "value" });

    expect(e.message).toBe('Custom: {"key":"value"}');
  });

  it("should work with addNotes without schema", () => {
    const SimpleError = error({
      name: "SimpleError",
    });

    const e = new SimpleError({ data: 42 }).addNotes("context");

    expect(e.notes).toContain("context");
  });

  it("should work with from without schema", () => {
    const CauseError = error({
      name: "CauseError",
    });
    const SimpleError = error({
      name: "SimpleError",
    });

    const e = new SimpleError({ data: 42 }).from(new CauseError({ reason: "bad" }));

    expect(e.cause.isSome()).toBe(true);
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
    const initialErr = err(new SizeError({ current: 3, wanted: 5 }));
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
        return err(new SizeError({ value: x }));
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
        return err(new SizeError({ value: x }));
      }
      return ok(x * 2);
    });

    // x = 10 > 5, so it returns error
    expect(isErr(result)).toBe(true);
  });

  it("should allow using Error directly with err()", () => {
    const MyError = error({ name: "MyError" });

    const domainError = new MyError({ detail: "something" });

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

    const e = new CredentialsError({
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

    const e = new AuthError({
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

    const e = new SecretError({ apiSecret: "my_secret_key" });

    expect(e.message).toContain("apiSecret");
    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("my_secret_key");
  });

  it("should redact api_key field", () => {
    const ConfigError = error({ name: "ConfigError" });

    const e = new ConfigError({ api_key: "key_12345" });

    expect(e.message).toContain("api_key");
    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("key_12345");
  });

  it("should redact credential field", () => {
    const ServiceError = error({ name: "ServiceError" });

    const e = new ServiceError({ credential: "my_credential" });

    expect(e.message).toContain("credential");
    expect(e.message).toContain("[REDACTED]");
    expect(e.message).not.toContain("my_credential");
  });

  it("should redact nested sensitive fields", () => {
    const ComplexError = error({ name: "ComplexError" });

    const e = new ComplexError({
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

    const e = new ValidationError({
      field: "email",
      value: "not_an_email",
    });

    expect(e.message).toContain("email");
    expect(e.message).toContain("not_an_email");
    expect(e.message).not.toContain("[REDACTED]");
  });

  it("should preserve args with sensitive fields intact", () => {
    const CredentialsError = error({ name: "CredentialsError" });

    const e = new CredentialsError({
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

    const e = new SecureError({
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

    const e = new TestError({
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
