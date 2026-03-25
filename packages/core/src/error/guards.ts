/**
 * Error type guards
 */

import type { Error, ErrorGroup } from "./types.js";
import type { Err, Result } from "../result.js";
import type { Try, TryFailure } from "../try.js";

/**
 * Type guard to check if a value is an Error
 */
export const isError = (value: unknown): value is Error =>
  value !== null &&
  typeof value === "object" &&
  "name" in value &&
  "args" in value &&
  "notes" in value &&
  "cause" in value;

/**
 * Type guard to check if a value is an ErrorGroup
 */
export const isErrorGroup = (value: unknown): value is ErrorGroup =>
  value !== null &&
  typeof value === "object" &&
  "name" in value &&
  "exceptions" in value &&
  Array.isArray((value as ErrorGroup).exceptions) &&
  ((value as ErrorGroup).exceptions.length === 0 || isError((value as ErrorGroup).exceptions[0]));

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
