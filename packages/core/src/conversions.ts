/**
 * Conversion helpers - convert between Result, Maybe, Try and other types
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

/**
 * Converts Maybe to Result
 * @param maybe - The Maybe to convert
 * @param onNone - Error to use when Maybe is None
 * @returns Result<T, E>
 */
export const toResult = <T, E>(maybe: Maybe<T>, onNone: () => E): Result<T, E> =>
  isSome(maybe) ? ok(maybe.value) : err(onNone());

/**
 * Converts Result to Maybe
 * @param result - The Result to convert
 * @returns Maybe<T> (loses error info)
 */
export const toMaybeFromResult = <T, E>(result: Result<T, E>): Maybe<T> =>
  isOk(result) ? some(result.value as NonNullable<T>) : none();

/**
 * Converts undefined to None, otherwise to Some
 * @param value - The value to convert
 * @returns Maybe<T>
 */
export const fromUndefinedable = <T>(value: T | undefined): Maybe<T> =>
  value === undefined ? none() : some(value as NonNullable<T>);

/**
 * Converts a nullable value directly to Result in one step.
 * Shorthand for combining fromNullable and toResult.
 *
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
 * Try<T, Error> is equivalent to Result<T, Error>.
 *
 * @param tryResult - The Try to convert
 * @returns Result<T, E>
 */
export const toResultFromTry = <T, E>(tryResult: Try<T, E>): Result<T, E> =>
  isTryOk(tryResult) ? ok(tryResult.value) : err(tryResult.error);

/**
 * Converts Result to Try.
 * Wraps Result in a Try.
 *
 * @param result - The Result to convert
 * @returns Try<T, E>
 */
export const toTryFromResult = <T, E>(result: Result<T, E>): Try<T, E> =>
  isOk(result)
    ? createTrySuccess(result.value)
    : createTryFailure(result.error);

/**
 * Converts Try to Maybe (loses error info).
 *
 * @param tryResult - The Try to convert
 * @returns Maybe<T>
 */
export const toMaybeFromTry = <T, E>(tryResult: Try<T, E>): Maybe<T> =>
  isTryOk(tryResult) ? some(tryResult.value as NonNullable<T>) : none();
