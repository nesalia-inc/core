/**
 * Conversion helpers - convert between Result, Maybe, Try and other types
 */

import { ok, err, Result, isOk } from "./result";
import { none, fromNullable, Maybe, isSome } from "./maybe";
import type { Error } from "./error/types";

/**
 * Options for converting Maybe to Result
 */
export interface ToResultOptions<E extends Error> {
  /** Error to use when Maybe is None */
  onNone: () => E;
}

/**
 * Converts Maybe to Result
 * @param maybe - The Maybe to convert
 * @param onNone - Error to use when Maybe is None
 * @returns Result<T, E>
 */
export const toResult = <T, E extends Error>(maybe: Maybe<T>, onNone: () => E): Result<T, E> =>
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
export const toMaybeFromResult = <T, E extends Error>(result: Result<T, E>): Maybe<T> =>
  isOk(result) ? fromNullable(result.value) : none();

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
 * import { resultFromNullable } from '@deessejs/fp';
 *
 * const user = resultFromNullable(db.find(id), () => new NotFoundError({ id }));
 * const port = resultFromNullable(parseInt(env.PORT), () => new InvalidPortError({ port: env.PORT }));
 */
export const resultFromNullable = <T, E extends Error>(
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
 * import { resultFromThrowable } from '@deessejs/fp';
 *
 * const data = resultFromThrowable(() => JSON.parse(jsonString));
 */
export const resultFromThrowable = <T, E extends Error = Error>(fn: () => T): Result<T, E> => {
  try {
    return ok(fn());
  } catch (e) {
    return err((e instanceof Error ? e : new Error(String(e))) as E);
  }
};
