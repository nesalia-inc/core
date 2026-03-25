/**
 * Error type guards
 *
 * Provides type-safe guards for Error and ErrorGroup validation.
 * These guards verify both structure AND primitive types for robustness.
 */

import type { Error, ErrorGroup } from "./types.js";
import type { Err, Result } from "../result.js";
import type { Try, TryFailure } from "../try.js";

/**
 * Helper for safe object narrowing
 */
const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === "object";

/**
 * Type guard to check if a value is an Error
 *
 * Validates:
 * - Value is an object (not null, not primitive)
 * - name is a string
 * - notes is an array of strings
 * - cause is null or an object
 * - args exists (any type)
 */
export const isError = (value: unknown): value is Error => {
  if (!isObject(value)) return false;

  if (typeof value.name !== "string") return false;
  if (!Array.isArray(value.notes)) return false;
  if (value.notes.some((note) => typeof note !== "string")) return false;
  if (value.cause !== null && !isObject(value.cause)) return false;

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
