import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import {
  ok,
  err,
  some,
  none,
  isOk,
  isErr,
  isSome,
  isNone,
  error,
} from "../../src/index.js";
import {
  serializeResult,
  deserializeResult,
  serializeMaybe,
  deserializeMaybe,
  errorReviver,
  ResultDeserializationError,
  type ErrorRegistry,
} from "../../src/serialization/index.js";

describe("Result serialization", () => {
  describe("serializeResult()", () => {
    it("should serialize Ok result", () => {
      const success = ok({ id: "123", name: "Alice" });
      const serialized = serializeResult(success);

      expect(serialized).toEqual({
        _tag: "Ok",
        value: { id: "123", name: "Alice" },
      });
    });

    it("should serialize Ok result with primitive value", () => {
      const success = ok(42);
      const serialized = serializeResult(success);

      expect(serialized).toEqual({
        _tag: "Ok",
        value: 42,
      });
    });

    it("should serialize Err result with domain error", () => {
      const NotFoundError = error({
        name: "NotFoundError",
        schema: z.object({ id: z.string() }),
      });
      const failed = err(NotFoundError({ id: "123" }));
      const serialized = serializeResult(failed);

      expect(serialized._tag).toBe("Err");
      expect(serialized.error).toBeDefined();
      expect((serialized.error as { name: string }).name).toBe("NotFoundError");
    });

    it("should serialize Err result with string error", () => {
      const failed = err(new globalThis.Error("something went wrong"));
      const serialized = serializeResult(failed);

      expect(serialized._tag).toBe("Err");
      expect((serialized.error as { message: string }).message).toBe("something went wrong");
    });
  });

  describe("deserializeResult()", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string() }),
    });

    const ValidationError = error({
      name: "ValidationError",
      schema: z.object({ field: z.string() }),
    });

    const errorRegistry: ErrorRegistry = {
      NotFoundError,
      ValidationError,
    };

    it("should deserialize Ok result", () => {
      const json = { _tag: "Ok", value: { id: "123", name: "Alice" } };
      const result = deserializeResult(errorRegistry, json);

      expect(isOk(result)).toBe(true);
      expect(result.value).toEqual({ id: "123", name: "Alice" });
    });

    it("should deserialize Ok result with primitive value", () => {
      const json = { _tag: "Ok", value: 42 };
      const result = deserializeResult(errorRegistry, json);

      expect(isOk(result)).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should deserialize Err result with domain error", () => {
      const json = {
        _tag: "Err",
        error: {
          name: "NotFoundError",
          _tag: "NotFoundError",
          args: { id: "123" },
          message: "Resource not found",
        },
      };
      const result = deserializeResult(errorRegistry, json);

      expect(isErr(result)).toBe(true);
      expect(result.error.name).toBe("NotFoundError");
      expect((result.error as { args: { id: string } }).args).toEqual({ id: "123" });
    });

    it("should return Err for missing value field in Ok", () => {
      const json = { _tag: "Ok" };
      const result = deserializeResult(errorRegistry, json);

      expect(isErr(result)).toBe(true);
    });

    it("should return Err for missing error field in Err", () => {
      const json = { _tag: "Err" };
      const result = deserializeResult(errorRegistry, json);

      expect(isErr(result)).toBe(true);
    });

    it("should return Err for unknown _tag", () => {
      const json = { _tag: "Unknown" };
      const result = deserializeResult(errorRegistry, json);

      expect(isErr(result)).toBe(true);
    });

    it("should return Err for non-object input", () => {
      const result1 = deserializeResult(errorRegistry, null);
      expect(isErr(result1)).toBe(true);

      const result2 = deserializeResult(errorRegistry, "string");
      expect(isErr(result2)).toBe(true);

      const result3 = deserializeResult(errorRegistry, 123);
      expect(isErr(result3)).toBe(true);

      const result4 = deserializeResult(errorRegistry, undefined);
      expect(isErr(result4)).toBe(true);
    });

    it("should return Err for array input", () => {
      const json = [{ _tag: "Ok", value: 1 }];
      const result = deserializeResult(errorRegistry, json);

      expect(isErr(result)).toBe(true);
    });
  });

  describe("migrations", () => {
    it("should apply migration for versioned data", () => {
      const errorRegistry: ErrorRegistry = {};
      const json = { _tag: "Ok", value: { name: "Alice" }, _version: 1 };

      const migrations = {
        1: (_v1: unknown) => {
          const obj = _v1 as { name: string };
          return { ...obj, email: obj.name.toLowerCase() + "@example.com" };
        },
      };

      const result = deserializeResult(errorRegistry, json, { migrations });

      expect(isOk(result)).toBe(true);
      expect(result.value).toEqual({ name: "Alice", email: "alice@example.com" });
    });

    it("should skip migration if version not in migrations", () => {
      const errorRegistry: ErrorRegistry = {};
      const json = { _tag: "Ok", value: { name: "Alice" }, _version: 99 };

      const migrations = {
        1: (_v1: unknown) => ({ migrated: true }),
      };

      const result = deserializeResult(errorRegistry, json, { migrations });

      expect(isOk(result)).toBe(true);
      expect(result.value).toEqual({ name: "Alice" });
    });

    it("should treat non-numeric version as 0 and apply migration", () => {
      const errorRegistry: ErrorRegistry = {};
      const json = { _tag: "Ok", value: { name: "Alice" }, _version: "not-a-number" };

      const migrations = {
        0: (_v1: unknown) => ({ migrated: true }),
      };

      const result = deserializeResult(errorRegistry, json, { migrations });

      expect(isOk(result)).toBe(true);
      expect(result.value).toEqual({ migrated: true });
    });
  });

  describe("reconstructError", () => {
    it("should return null when JSON.parse throws for string error data", () => {
      // This tests the catch block at line 121 when errorData is a string that fails JSON parsing
      const errorRegistry: ErrorRegistry = {};
      const json = { _tag: "Err", error: "invalid json that will fail parsing" };

      const result = deserializeResult(errorRegistry, json);

      expect(isErr(result)).toBe(true);
      expect(result.error.name).toBe("ResultDeserializationError");
    });

    it("should fall through to manual reconstruction when JSON.parse succeeds but doesn't produce Error", () => {
      // Tests the path where JSON.parse succeeds but returns non-Error value
      // This exercises the catch block at line 134
      const TestError = error({ name: "TestError" });
      const errorRegistry: ErrorRegistry = {
        TestError,
      };

      // Create an object that stringifies to valid JSON but when parsed with reviver
      // returns a non-Error value
      const json = {
        _tag: "Err",
        error: {
          _tag: "SomeOtherTag", // not in registry
          name: "CustomError",
          message: "test",
          args: {},
        },
      };

      const result = deserializeResult(errorRegistry, json);

      // Should fall through to manual reconstruction since registry lookup fails
      expect(isErr(result)).toBe(true);
      expect(result.error.name).toBe("CustomError");
    });

    it("should reconstruct error from plain object with name and message", () => {
      // Tests the manual reconstruction path at lines 140-148
      const errorRegistry: ErrorRegistry = {};
      const json = {
        _tag: "Err",
        error: {
          name: "NetworkError",
          message: "Connection failed",
          args: { code: 500 },
        },
      };

      const result = deserializeResult(errorRegistry, json);

      expect(isErr(result)).toBe(true);
      expect(result.error.name).toBe("NetworkError");
    });

    it("should return ResultDeserializationError when reconstructError returns null", () => {
      // Tests line 212-215 path
      const errorRegistry: ErrorRegistry = {};
      const json = {
        _tag: "Err",
        error: {
          // No name or message - reconstruction will fail
          data: "some random data",
        },
      };

      const result = deserializeResult(errorRegistry, json);

      expect(isErr(result)).toBe(true);
      expect(result.error.name).toBe("ResultDeserializationError");
      expect(result.error.args.reason).toBe("Failed to reconstruct error");
    });
  });
});

describe("Maybe serialization", () => {
  describe("serializeMaybe()", () => {
    it("should serialize Some with object value", () => {
      const present = some({ id: "123", name: "Alice" });
      const serialized = serializeMaybe(present);

      expect(serialized).toEqual({
        _tag: "Some",
        value: { id: "123", name: "Alice" },
      });
    });

    it("should serialize Some with primitive value", () => {
      const present = some(42);
      const serialized = serializeMaybe(present);

      expect(serialized).toEqual({
        _tag: "Some",
        value: 42,
      });
    });

    it("should serialize None", () => {
      const absent = none();
      const serialized = serializeMaybe(absent);

      expect(serialized).toEqual({
        _tag: "None",
      });
    });
  });

  describe("deserializeMaybe()", () => {
    it("should deserialize Some", () => {
      const json = { _tag: "Some", value: { id: "123", name: "Alice" } };
      const maybe = deserializeMaybe(json);

      expect(isSome(maybe)).toBe(true);
      expect(maybe.value).toEqual({ id: "123", name: "Alice" });
    });

    it("should deserialize Some with primitive value", () => {
      const json = { _tag: "Some", value: 42 };
      const maybe = deserializeMaybe(json);

      expect(isSome(maybe)).toBe(true);
      expect(maybe.value).toBe(42);
    });

    it("should deserialize None", () => {
      const json = { _tag: "None" };
      const maybe = deserializeMaybe(json);

      expect(isNone(maybe)).toBe(true);
    });

    it("should return None for non-object input", () => {
      expect(isNone(deserializeMaybe(null))).toBe(true);
      expect(isNone(deserializeMaybe("string"))).toBe(true);
      expect(isNone(deserializeMaybe(123))).toBe(true);
      expect(isNone(deserializeMaybe(undefined))).toBe(true);
    });

    it("should return None for array input", () => {
      const json = [{ _tag: "Some", value: 1 }];
      const maybe = deserializeMaybe(json);

      expect(isNone(maybe)).toBe(true);
    });

    it("should return None for unknown _tag", () => {
      const json = { _tag: "Unknown" };
      const maybe = deserializeMaybe(json);

      expect(isNone(maybe)).toBe(true);
    });

    it("should return None for Some without value field", () => {
      const json = { _tag: "Some" };
      const maybe = deserializeMaybe(json);

      expect(isNone(maybe)).toBe(true);
    });
  });
});

describe("Error.reviver", () => {
  const NotFoundError = error({
    name: "NotFoundError",
    schema: z.object({ id: z.string() }),
  });

  const ValidationError = error({
    name: "ValidationError",
    schema: z.object({ field: z.string() }),
  });

  const errorRegistry: ErrorRegistry = {
    NotFoundError,
    ValidationError,
  };

  beforeEach(() => {
    // Set up the registry for each test
    (errorReviver as unknown as { registry?: ErrorRegistry }).registry = errorRegistry;
  });

  it("should reconstruct domain error from JSON string", () => {
    const json = '{"name":"NotFoundError","_tag":"NotFoundError","args":{"id":"123"},"message":"Resource not found"}';
    const restored = JSON.parse(json, errorReviver);

    expect(restored).toBeDefined();
    expect((restored as { name: string }).name).toBe("NotFoundError");
    // Check it has error-like properties
    expect((restored as { args: unknown }).args).toEqual({ id: "123" });
  });

  it("should reconstruct error using registry", () => {
    const json = '{"name":"NotFoundError","_tag":"NotFoundError","args":{"id":"456"},"message":"Not found"}';
    const restored = JSON.parse(json, errorReviver);

    // The reconstructed object should have the correct name
    expect((restored as { name: string }).name).toBe("NotFoundError");
    expect((restored as { args: { id: string } }).args).toEqual({ id: "456" });
  });

  it("should return plain object for unknown error tag", () => {
    const json = '{"name":"UnknownError","_tag":"UnknownError","args":{"x":1},"message":"Unknown"}';
    const restored = JSON.parse(json, errorReviver);

    // Should not throw and should return the object as-is
    expect(restored).toBeDefined();
    expect(typeof restored).toBe("object");
  });

  it("should reject prototype pollution attempts", () => {
    const malicious = '{"__proto__": {"admin": true}}';
    const restored = JSON.parse(malicious, errorReviver);

    // Should return undefined for the blocked key
    expect((restored as { admin?: boolean }).admin).toBeUndefined();
  });

  it("should handle root object (empty key)", () => {
    const json = '{"name":"TestError","_tag":"TestError","args":{}}';
    const restored = JSON.parse(json, errorReviver);

    expect(restored).toBeDefined();
    expect((restored as { name: string }).name).toBe("TestError");
  });

  it("should preserve non-error objects", () => {
    const json = '{"id":"123","name":"Alice"}';
    const restored = JSON.parse(json, errorReviver);

    expect(restored).toEqual({ id: "123", name: "Alice" });
  });

  it("should preserve arrays", () => {
    const json = '[1,2,3]';
    const restored = JSON.parse(json, errorReviver);

    expect(restored).toEqual([1, 2, 3]);
  });

  it("should preserve primitives", () => {
    const json = '"hello"';
    const restored = JSON.parse(json, errorReviver);

    expect(restored).toBe("hello");
  });
});

describe("ResultDeserializationError", () => {
  it("should have correct name", () => {
    const err = ResultDeserializationError({ reason: "test", input: {} });
    expect(err.name).toBe("ResultDeserializationError");
  });

  it("should have args with reason and input", () => {
    const input = { _tag: "Unknown" };
    const err = ResultDeserializationError({ reason: "Unknown tag", input });

    expect(err.args.reason).toBe("Unknown tag");
    expect(err.args.input).toBe(input);
  });
});

describe("roundtrip serialization", () => {
  it("should roundtrip Result Ok", () => {
    const original = ok({ id: "123", name: "Alice" });
    const serialized = serializeResult(original);
    const json = JSON.stringify(serialized);
    const parsed = JSON.parse(json);
    const restored = deserializeResult({}, parsed);

    expect(isOk(restored)).toBe(true);
    expect(restored.value).toEqual({ id: "123", name: "Alice" });
  });

  it("should roundtrip Result Err", () => {
    const NotFoundError = error({
      name: "NotFoundError",
      schema: z.object({ id: z.string() }),
    });
    const errorRegistry: ErrorRegistry = { NotFoundError };

    const original = err(NotFoundError({ id: "123" }));
    const serialized = serializeResult(original);
    const json = JSON.stringify(serialized);
    const parsed = JSON.parse(json);
    const restored = deserializeResult(errorRegistry, parsed);

    expect(isErr(restored)).toBe(true);
    expect(restored.error.name).toBe("NotFoundError");
  });

  it("should roundtrip Maybe Some", () => {
    const original = some({ id: "123", name: "Alice" });
    const serialized = serializeMaybe(original);
    const json = JSON.stringify(serialized);
    const parsed = JSON.parse(json);
    const restored = deserializeMaybe(parsed);

    expect(isSome(restored)).toBe(true);
    expect(restored.value).toEqual({ id: "123", name: "Alice" });
  });

  it("should roundtrip Maybe None", () => {
    const original = none();
    const serialized = serializeMaybe(original);
    const json = JSON.stringify(serialized);
    const parsed = JSON.parse(json);
    const restored = deserializeMaybe(parsed);

    expect(isNone(restored)).toBe(true);
  });
});
