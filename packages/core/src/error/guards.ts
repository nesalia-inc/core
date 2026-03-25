/**
 * Error type guards
 *
 * Provides type-safe guards for Error and ErrorGroup validation.
 * These guards verify both structure AND primitive types for robustness.
 */

import type { Error, ErrorGroup } from "./types";
import type { Err, Result } from "../result";
import type { Try, TryFailure } from "../try";

/**
 * Helper for safe object narrowing
 */
const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === "object";

/**
 * Check if a cause value is valid for Error type
 * Valid if: null, Maybe<Error> (Some with Error, or None), or direct Error
 */
const isValidCause = (cause: unknown): boolean => {
  // Legacy null cause
  if (cause === null) return true;

  // Maybe<Error> structure - check ok property
  if (isObject(cause) && "ok" in cause) {
    const maybe = cause as { ok: boolean; value?: unknown; error?: unknown };
    if (maybe.ok === true && maybe.value !== undefined) {
      // Some<Error> - validate the inner error (if it's an Error, not None)
      // If value has ok property, it's a nested Maybe/Result - check recursively
      if (isObject(maybe.value) && "ok" in (maybe.value as object)) {
        return isValidCause(maybe.value);
      }
      // Otherwise it's an Error - validate it
      return isError(maybe.value);
    }
    if (maybe.ok === false) {
      // None or Err - both are valid (no cause or error cause)
      return true;
    }
    return false;
  }

  // Direct Error object (native JS error)
  if (isObject(cause) && "message" in cause && "name" in cause) {
    return true;
  }

  return false;
};

/**
 * Type guard to check if a value is an Error
 *
 * Validates:
 * - Value is an object (not null, not primitive)
 * - name is a string
 * - notes is an array of strings
 * - cause is null, Maybe<Error>, or Error object
 * - args exists (any type)
 */
export const isError = (value: unknown): value is Error => {
  if (!isObject(value)) return false;

  if (typeof value.name !== "string") return false;
  if (!Array.isArray(value.notes)) return false;
  if (value.notes.some((note) => typeof note !== "string")) return false;
  if (!isValidCause(value.cause)) return false;

  return (
    "args" in value &&
    "cause" in value
  );
};

/**
 * Type guard to check if a value is an ErrorGroup
 *
 * Validates:
 * - Value is an object
 * - name is "ExceptionGroup" (conventional name)
 * - exceptions is an array where ALL elements are Error
 */
export const isErrorGroup = (value: unknown): value is ErrorGroup => {
  if (!isObject(value)) return false;

  if (value.name !== "ExceptionGroup") return false;
  if (!Array.isArray(value.exceptions)) return false;

  // Use every() for exhaustive validation instead of just checking first element
  return value.exceptions.every(isError);
};

/**
 * Check if Result is Err with Error type
 */
export const isErrWithError = (result: Result<unknown, globalThis.Error>): result is Err<Error> =>
  result.ok === false && isError(result.error);

/**
 * Check if Try is TryFailure with Error type
 */
export const isErrTryWithError = (t: Try<unknown, globalThis.Error>): t is TryFailure<Error> =>
  t.ok === false && isError(t.error);

/**
 * Assertion function for Error
 *
 * Throws if value is not an Error, useful for control flow.
 *
 * @example
 * function processError(value: unknown) {
 *   assertIsError(value);
 *   // value is Error here, no need for null checks
 *   console.log(value.name);
 * }
 */
export function assertIsError(value: unknown): asserts value is Error {
  if (!isError(value)) {
    throw new TypeError(`Expected Error, got ${typeof value}`);
  }
}

/**
 * Assertion function for ErrorGroup
 *
 * Throws if value is not an ErrorGroup.
 */
export function assertIsErrorGroup(value: unknown): asserts value is ErrorGroup {
  if (!isErrorGroup(value)) {
    throw new TypeError(`Expected ErrorGroup, got ${typeof value}`);
  }
}
