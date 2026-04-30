/**
 * Error type guards
 *
 * Provides type-safe guards for Error and ErrorGroup validation.
 * These guards verify both structure AND primitive types for robustness.
 */

import { type Error, type ErrorGroup } from "./types.js";

/**
 * Helper for safe object narrowing
 */
const isObject = (val: unknown): val is Record<string, unknown> =>
  val !== null && typeof val === "object";

/**
 * Check if a value is a nested Maybe/Result (has ok property)
 */
const isMaybeResult = (val: unknown): val is { ok: boolean } =>
  isObject(val) && "ok" in val;

/**
 * Validates if a Maybe<Error> structure contains a valid Error
 */
const validateMaybeCause = (maybe: { ok: boolean; value?: unknown }): boolean => {
  // None or Err - both are valid (no cause or error cause)
  if (!maybe.ok) return true;

  // Some<Error> - validate the inner error
  if (maybe.value === undefined) return false;

  // If value has ok property, it's a nested Maybe/Result - check recursively
  if (isMaybeResult(maybe.value)) {
    return isValidCause(maybe.value);
  }

  // Otherwise it's an Error - validate it
  return isError(maybe.value);
};

/**
 * Check if a cause value is valid for Error type
 * Valid if: null, Maybe<Error> (Some with Error, or None), or direct Error
 */
const isValidCause = (cause: unknown): boolean => {
  // Legacy null cause
  if (cause === null) return true;

  // Direct Error object (native JS error)
  if (isObject(cause) && "message" in cause && "name" in cause) {
    return true;
  }

  // Maybe<Error> structure - check ok property
  if (!isMaybeResult(cause)) return false;

  return validateMaybeCause(cause as { ok: boolean; value?: unknown });
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
