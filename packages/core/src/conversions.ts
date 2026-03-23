/**
 * Conversion helpers - convert between Result, Maybe, Try and other types
 *
 * ## Naming Convention
 *
 * This module uses "fromX" naming convention (source -> destination):
 * - Result.fromMaybe(maybe, onNone) - Maybe -> Result
 * - Maybe.fromResult(result) - Result -> Maybe
 *
 * Legacy functions with "toX" naming are still available for backwards compatibility.
 */

import { ok, err, Result, isOk } from "./result.js";
import { some, none, Maybe, isSome } from "./maybe.js";
import { Try, isOk as isTryOk, createTrySuccess, createTryFailure } from "./try.js";

/**
 * Options for converting Maybe to Result
 */
export interface ToResultOptions<E> {
  /** Error to use when Maybe is None */
  onNone: () => E;
}

// ============================================
// New "fromX" naming (recommended)
// ============================================

/**
 * Converts Maybe to Result
 * @param maybe - The Maybe to convert
 * @param onNone - Error to use when Maybe is None
 * @returns Result<T, E>
 */
export const fromMaybe = <T, E>(maybe: Maybe<T>, onNone: () => E): Result<T, E> =>
  isSome(maybe) ? ok(maybe.value) : err(onNone());

/**
 * Converts Result to Maybe
 * @param result - The Result to convert
 * @returns Maybe<T> (loses error info)
 */
export const fromResult = <T, E>(result: Result<T, E>): Maybe<T> =>
  isOk(result) ? some(result.value as NonNullable<T>) : none();

/**
 * Converts a nullable value directly to Result in one step.
 * @param value - The value that may be null or undefined
 * @param onNull - Error factory to call when value is null/undefined
 * @returns Ok<NonNullable<T>> if value is not null/undefined, Err<E> otherwise
 */
export const resultFromNullable = <T, E>(
  value: T | null | undefined,
  onNull: () => E
): Result<NonNullable<T>, E> =>
  value == null ? err(onNull()) : ok(value as NonNullable<T>);

/**
 * Wraps a throwing function in a Result.
 */
export const resultFromThrowable = <T>(fn: () => T): Result<T, Error> => {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Converts a value to Result based on a predicate.
 * Returns Ok if predicate passes, Err with onFalse(value) otherwise.
 */
export const fromPredicate = <T, E>(
  value: T,
  predicate: (value: T) => boolean,
  onFalse: (value: T) => E
): Result<T, E> =>
  predicate(value) ? ok(value) : err(onFalse(value));

/**
 * Converts Try to Result.
 * @param tryResult - The Try to convert
 * @returns Result<T, E>
 */
export const fromTry = <T, E>(tryResult: Try<T, E>): Result<T, E> =>
  isTryOk(tryResult) ? ok(tryResult.value) : err(tryResult.error);

/**
 * Converts Result to Try.
 * @param result - The Result to convert
 * @returns Try<T, E>
 */
export const tryFromResult = <T, E>(result: Result<T, E>): Try<T, E> =>
  isOk(result)
    ? createTrySuccess(result.value)
    : createTryFailure(result.error);

/**
 * Converts Try to Maybe (loses error info).
 * @param tryResult - The Try to convert
 * @returns Maybe<T>
 */
export const maybeFromTry = <T, E>(tryResult: Try<T, E>): Maybe<T> =>
  isTryOk(tryResult) ? some(tryResult.value as NonNullable<T>) : none();

// ============================================
// Legacy "toX" naming (backwards compatible)
// ============================================

/**
 * Converts Maybe to Result (legacy name)
 * @deprecated Use fromMaybe instead
 */
export const toResult = <T, E>(maybe: Maybe<T>, onNone: () => E): Result<T, E> =>
  fromMaybe(maybe, onNone);

/**
 * Converts Result to Maybe (legacy name)
 * @deprecated Use fromResult instead
 */
export const toMaybeFromResult = <T, E>(result: Result<T, E>): Maybe<T> =>
  fromResult(result);
