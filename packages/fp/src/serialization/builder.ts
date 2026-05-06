/**
 * Serialization builder functions
 *
 * Provides serialize/deserialize functions for Result, Maybe, and Error types.
 */

import { type Result } from "../result/index.js";
import { type Maybe } from "../maybe/index.js";
import { type Error, isError } from "../error/index.js";
import {
  type ResultJSON,
  type MaybeJSON,
  type ErrorRegistry,
  type ResultDeserializeOptions,
  type ResultDeserializationErrorData,
} from "./types.js";
import { ok, err, isOk } from "../result/index.js";
import { some, none, isSome } from "../maybe/index.js";
import { error } from "../error/index.js";

// ============================================================================
// ERROR REviviver
// ============================================================================

/**
 * Keys that are blocked for prototype pollution protection
 */
const BLOCKED_KEYS = ["__proto__", "constructor", "prototype"] as const;

/**
 * JSON.parse reviver for reconstructing Error instances
 *
 * Reconstructs domain errors from JSON that was serialized via toJSON().
 * Returns a plain object if the tag is unknown or for blocked keys.
 *
 * @example
 * const json = '{"name":"NotFoundError","_tag":"NotFoundError","args":{"id":"123"}}';
 * const restored = JSON.parse(json, Error.reviver);
 */
export const errorReviver = (key: string, value: unknown): unknown => {
  // Reject blocked keys to prevent prototype pollution
  if (BLOCKED_KEYS.includes(key as "__proto__" | "constructor" | "prototype")) {
    return undefined;
  }

  // If this is the root object, return as-is
  if (key === "") {
    return value;
  }

  // If this looks like a serialized Error (has name, _tag, args)
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "_tag" in value
  ) {
    const obj = value as Record<string, unknown>;

    if (typeof obj._tag === "string") {
      // Check if we have an error registry (stored on the reviver function)
      const registry = (errorReviver as unknown as { registry?: ErrorRegistry }).registry;

      if (registry && obj._tag in registry) {
        const entry = registry[obj._tag as string];
        const args = obj.args;

        if (typeof entry === "function") {
           
          return (entry as (args: unknown) => unknown)(args);
        }
      }
    }

    // Unknown error tag or no registry - return as plain Error-like object
    // We can't reconstruct the actual class, but we preserve the data
    return obj;
  }

  return value;
};

/**
 * Sets the error registry for the error reviver
 * This allows the reviver to reconstruct domain errors
 */
errorReviver.registry = undefined as ErrorRegistry | undefined;

// ============================================================================
// RESULT SERIALIZATION
// ============================================================================

/**
 * Serializes a Result to a JSON-compatible object
 *
 * @param result - The Result to serialize
 * @returns A tagged JSON object: { "_tag": "Ok", value: T } or { "_tag": "Err", error: E }
 *
 * @example
 * const success = ok({ id: "123" });
 * Result.serialize(success);
 * // { "_tag": "Ok", value: { id: "123" } }
 */
export const serializeResult = <T, E extends Error>(result: Result<T, E>): ResultJSON<T, E> => {
  if (isOk(result)) {
    return { _tag: "Ok" as const, value: result.value };
  }
  return { _tag: "Err" as const, error: result.error as E };
};

/**
 * Reconstructs an Error from JSON using the error reviver
 */
const reconstructError = (errorData: unknown): Error | null => {
  // Check if this is a JSON string - if so, parse with reviver
  if (typeof errorData === "string") {
    try {
      const parsed = JSON.parse(errorData, errorReviver);
      if (isError(parsed as Error)) {
        return parsed as Error;
      }
    } catch {
      // Fall through to try as object
    }
  }

  // If it's an object, parse it with the reviver
  if (typeof errorData === "object" && errorData !== null) {
    const jsonStr = JSON.stringify(errorData);
    try {
      const parsed = JSON.parse(jsonStr, errorReviver);
      if (isError(parsed as Error)) {
        return parsed as Error;
      }
    } catch {
      // Fall through to manual reconstruction
    }
  }

  // Try manual reconstruction from plain object
  if (
    typeof errorData === "object" &&
    errorData !== null &&
    "name" in errorData &&
    "message" in errorData
  ) {
    const errObj = errorData as Record<string, unknown>;
    return error({ name: String(errObj.name) })(errObj.args as object);
  }

  return null;
};

/**
 * Deserializes a Result from a JSON-compatible object
 *
 * @param errorRegistry - Registry of error constructors for reconstruction
 * @param json - The JSON object to deserialize
 * @param options - Optional deserialization options (e.g., migrations)
 * @returns Ok with the deserialized value, or Err with ResultDeserializationError
 *
 * @example
 * const json = { "_tag": "Ok", value: { id: "123" } };
 * Result.deserialize(errorRegistry, json);
 * // Ok<{ id: string }>
 */
export const deserializeResult = (
  errorRegistry: ErrorRegistry,
  json: unknown,
  options?: ResultDeserializeOptions
): Result<unknown, Error> => {
  // Set registry for error reviver
  (errorReviver as unknown as { registry?: ErrorRegistry }).registry = errorRegistry;

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return err(ResultDeserializationError({ reason: "Expected object", input: json }));
  }

  const obj = json as Record<string, unknown>;

  // Apply migrations if present
  let value: unknown = obj.value;
  if (obj._version !== undefined && options?.migrations) {
    const version = typeof obj._version === "number" ? obj._version : 0;
    const migrate = options.migrations[version];
    if (migrate) {
      // Apply migration to the value field
      value = migrate(obj.value);
    }
  }

  if (obj._tag === "Ok") {
    if (!("value" in obj)) {
      return err(ResultDeserializationError({ reason: "Missing 'value' field", input: json }));
    }
    return ok(value);
  }

  if (obj._tag === "Err") {
    if (!("error" in obj)) {
      return err(ResultDeserializationError({ reason: "Missing 'error' field", input: json }));
    }

    const errorData = obj.error;

    // Use reconstructError to properly parse and reconstruct the error
    const restored = reconstructError(errorData);

    if (restored !== null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return err(restored as any);
    }

    return err(ResultDeserializationError({
      reason: "Failed to reconstruct error",
      input: json,
    }));
  }

  return err(ResultDeserializationError({ reason: `Unknown _tag: ${obj._tag}`, input: json }));
};

// ============================================================================
// MAYBE SERIALIZATION
// ============================================================================

/**
 * Serializes a Maybe to a JSON-compatible object
 *
 * @param maybe - The Maybe to serialize
 * @returns A tagged JSON object: { "_tag": "Some", value: T } or { "_tag": "None" }
 *
 * @example
 * const present = some({ id: "123" });
 * Maybe.serialize(present);
 * // { "_tag": "Some", value: { id: "123" } }
 *
 * const absent = none();
 * Maybe.serialize(absent);
 * // { "_tag": "None" }
 */
export const serializeMaybe = <T>(maybe: Maybe<T>): MaybeJSON<T> => {
  if (isSome(maybe)) {
    return { _tag: "Some" as const, value: maybe.value };
  }
  return { _tag: "None" as const };
};

/**
 * Deserializes a Maybe from a JSON-compatible object
 *
 * @param json - The JSON object to deserialize
 * @returns Some with the deserialized value, or None
 *
 * @example
 * const json = { "_tag": "Some", value: { id: "123" } };
 * Maybe.deserialize(json);
 * // Some<{ id: string }>
 */
export const deserializeMaybe = <T>(json: unknown): Maybe<T> => {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return none();
  }

  const obj = json as Record<string, unknown>;

  if (obj._tag === "Some") {
    if (!("value" in obj)) {
      return none();
    }
    return some(obj.value as NonNullable<T>);
  }

  if (obj._tag === "None") {
    return none();
  }

  return none();
};

// ============================================================================
// RESULTDESERIALIZATION ERROR
// ============================================================================

/**
 * Error thrown when Result deserialization fails
 */
export const ResultDeserializationError = error({
  name: "ResultDeserializationError",
}) as (args: ResultDeserializationErrorData) => Error<ResultDeserializationErrorData>;
