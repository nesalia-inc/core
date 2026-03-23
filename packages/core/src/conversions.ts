/**
 * Conversion helpers - convert between Result, Maybe, Try and other types
 */

import { ok, err, Result, isOk } from "./result.js";
import { some, none, Maybe, isSome } from "./maybe.js";

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
 * Alias for toResult - converts Maybe to Result
 * @param maybe - The Maybe to convert
 * @param onNone - Error to use when Maybe is None
 * @returns Result<T, E>
 */
export const fromMaybe = toResult;

/**
 * Converts Result to Maybe
 * @param result - The Result to convert
 * @returns Maybe<T> (loses error info)
 */
export const toMaybeFromResult = <T, E>(result: Result<T, E>): Maybe<T> =>
  isOk(result) ? some(result.value as NonNullable<T>) : none();

/**
 * Alias for toMaybeFromResult - converts Result to Maybe
 * @param result - The Result to convert
 * @returns Maybe<T> (loses error info)
 */
export const fromResult = toMaybeFromResult;

/**
 * Converts a nullable value directly to Result in one step.
 * Shorthand for combining fromNullable and toResult.
 *
 * @param value - The value that may be null or undefined
 * @param onNull - Error factory to call when value is null/undefined
 * @returns Ok<NonNullable<T>> if value is not null/undefined, Err<E> otherwise
 *
 * @example
 * import { resultFromNullable } from '@deessejs/core';
 *
 * const user = resultFromNullable(db.find(id), () => 'NOT_FOUND');
 * const port = resultFromNullable(parseInt(env.PORT), () => 'INVALID_PORT');
 */
export const resultFromNullable = <T, E>(
  value: T | null | undefined,
  onNull: () => E
): Result<NonNullable<T>, E> =>
  value == null ? err(onNull()) : ok(value as NonNullable<T>);

/**
 * Wraps a throwing function in a Result.
 *
 * @param fn - The function that may throw
 * @returns Ok<T> with the return value, Err<Error> if the function throws
 *
 * @example
 * import { resultFromThrowable } from '@deessejs/core';
 *
 * const data = resultFromThrowable(() => JSON.parse(jsonString));
 */
export const resultFromThrowable = <T>(fn: () => T): Result<T, Error> => {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};
