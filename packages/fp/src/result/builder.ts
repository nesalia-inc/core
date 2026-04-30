/**
 * Result builder functions
 */

import { type Result } from "./types.js";
import { type Error } from "../error/types.js";

/**
 * Ok class - internal implementation
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 */
class Ok<T, E extends Error = Error> {
  readonly ok = true as const;
  constructor(readonly value: T) {}

  isOk(): true { return true; }
  isErr(): false { return false; }

  map<U>(fn: (value: T) => U): Ok<U, E> { return new Ok(fn(this.value)); }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> { return fn(this.value); }

  mapErr<F extends Error>(_fn: (error: never) => F): Ok<T, E> { return this; }

  getOrElse(): T { return this.value; }
  getOrCompute(): T { return this.value; }

  tap(fn: (value: T) => void): Ok<T, E> { fn(this.value); return this; }
  tapErr(): Ok<T, E> { return this; }

  match<U>(fn: ((value: unknown) => U) | { onSuccess: (value: T) => U; onError: (error: E) => U }): U {
    if (typeof fn === "object" && fn != null && "onSuccess" in fn) {
      return fn.onSuccess(this.value);
    }
    return fn(this.value);
  }

  unwrap(): T { return this.value; }
}

/**
 * Err class - internal implementation
 * @typeParam E - The type of the error
 */
class Err<E extends Error = Error> {
  readonly ok = false as const;
  constructor(readonly error: E) {}

  isOk(): false { return false; }
  isErr(): true { return true; }

  map<U>(_fn: (value: never) => U): Err<E> { return this; }

  flatMap<U>(_fn: (value: never) => Result<U, E>): Err<E> { return this; }

  mapErr<F extends Error>(fn: (error: E) => F): Err<F> { return new Err(fn(this.error)); }

  getOrElse<T>(defaultValue: T): T { return defaultValue; }
  getOrCompute<T>(fn: () => T): T { return fn(); }

  tap(): Err<E> { return this; }
  tapErr(fn: (error: E) => void): Err<E> { fn(this.error); return this; }

  match<U>(fn: ((value: unknown) => U) | { onSuccess: (value: unknown) => U; onError: (error: E) => U }): U {
    if (typeof fn === "object" && fn != null && "onError" in fn) {
      return fn.onError(this.error);
    }
    return fn(this.error);
  }

  unwrap(): never { throw this.error; }
}

/**
 * Creates an Ok (success result)
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error (defaults to Error)
 * @param value - The success value
 * @returns Ok<T, E>
 */
export const ok = <T, E extends Error = Error>(value: T): Ok<T, E> =>
  Object.freeze(new Ok(value)) as Ok<T, E>;

/**
 * Creates an Err (error result)
 * @typeParam E - The type of the error (must extend Error)
 * @param error - The error value
 * @returns Err<E>
 */
export const err = <E extends Error>(error: E): Err<E> =>
  Object.freeze(new Err(error)) as Err<E>;

/**
 * Type guard to check if Result is Ok
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to check
 * @returns true if Result is Ok<T>
 */
export const isOk = <T, E extends Error>(result: Result<T, E>): result is Ok<T, E> =>
  result.ok === true;

/**
 * Type guard to check if Result is Err
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to check
 * @returns true if Result is Err<E>
 */
export const isErr = <T, E extends Error>(result: Result<T, E>): result is Err<E> =>
  result.ok === false;

/**
 * Maps the value of Result if Ok, returns Err otherwise
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the mapped value
 * @param result - The Result to map
 * @param fn - The mapping function
 * @returns Result<U, E>
 */
export const map = <T, E extends Error, U>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> =>
  isOk(result) ? ok(fn(result.value)) : err((result as Err<E>).error);

/**
 * Chains Results - function if Ok, returns Err otherwise
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the chained value
 * @param result - The Result to chain
 * @param fn - The chaining function
 * @returns Result of the function if Ok, Err otherwise
 */
export const flatMap = <T, E extends Error, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => (isOk(result) ? fn(result.value) : err((result as Err<E>).error));

/**
 * Maps the error of Result if Err, returns Ok otherwise
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam F - The type of the mapped error
 * @param result - The Result to map
 * @param fn - The mapping function for error
 * @returns Result<T, F>
 */
export const mapErr = <T, E extends Error, F extends Error>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> =>
  isErr(result) ? err(fn(result.error)) : ok((result as Ok<T, E>).value);

/**
 * Gets the value or a default
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result
 * @param defaultValue - The default value
 * @returns The value if Ok, default otherwise
 */
export const getOrElse = <T, E extends Error>(result: Result<T, E>, defaultValue: T): T =>
  isOk(result) ? result.value : defaultValue;

/**
 * Gets the value or computes a default
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the computed default
 * @param result - The Result
 * @param fn - The function to compute default
 * @returns The value if Ok, result of fn otherwise
 */
export const getOrCompute = <T, E extends Error, U>(
  result: Result<T, E>,
  fn: () => U
): T | U =>
  isOk(result) ? result.value : fn();

/**
 * Performs a side effect without changing the value if Ok
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to inspect
 * @param fn - The side effect function
 * @returns The same Result
 */
export const tap = <T, E extends Error>(
  result: Result<T, E>,
  fn: (value: T) => void
): Result<T, E> => {
  if (isOk(result)) {
    fn(result.value);
  }
  return result;
};

/**
 * Performs a side effect without changing the value if Err
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to inspect
 * @param fn - The side effect function
 * @returns The same Result
 */
export const tapErr = <T, E extends Error>(
  result: Result<T, E>,
  fn: (error: E) => void
): Result<T, E> => {
  if (isErr(result)) {
    fn(result.error);
  }
  return result;
};

/**
 * Matches both Ok and Err cases
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the result
 * @param result - The Result to match
 * @param ok - Function to handle Ok
 * @param err - Function to handle Err
 * @returns Result of the handler function
 */
export const match = <T, E extends Error, U>(
  result: Result<T, E>,
  ok: (value: T) => U,
  err: (error: E) => U
): U => (isOk(result) ? ok(result.value) : err((result as Err<E>).error));

/**
 * Swaps Ok and Err variants
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to swap
 * @returns Err if Ok, Ok if Err
 * @note This function has type limitations because:
 *   - Ok<T, E> swapped becomes Err<T>, but Err requires its type to extend Error
 *   - Err<E> swapped becomes Ok<E>, but Ok's second param must extend Error
 *   TypeScript cannot express "T becomes the error" or "E becomes the value"
 *   without circular type constraints. The any is unavoidable for this operation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- swap operation requires any due to TypeScript limitations */
export const swap = (result: Result<any, any>): unknown =>
  isOk(result)
    ? err((result as Ok<any, any>).value)
    : ok((result as Err<any>).error);

/**
 * Converts Result to a nullable value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to convert
 * @returns The value if Ok, null otherwise
 */
export const toNullable = <T, E extends Error>(result: Result<T, E>): T | null =>
  isOk(result) ? result.value : null;

/**
 * Converts Result to an undefined-able value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to convert
 * @returns The value if Ok, undefined otherwise
 */
export const toUndefined = <T, E extends Error>(result: Result<T, E>): T | undefined =>
  isOk(result) ? result.value : undefined;

/**
 * Combines multiple Results into a single Result
 * Returns Ok with array of values if all are Ok
 * Returns first Err if any is Err (fail-fast)
 * @typeParam T - The type of the values
 * @typeParam E - The type of the error
 * @param results - The Results to combine
 * @returns Result<T[], E>
 */
export const all = <T, E extends Error>(...results: Array<Result<T, E>>): Result<T[], E> => {
  const firstErr = results.find(isErr);
  if (firstErr) {
    return err(firstErr.error);
  }
  return ok(results.map((r) => (r as Ok<T, E>).value));
};

/**
 * Unwraps a Result, returning the value if Ok, throwing the error if Err
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to unwrap
 * @returns The value if Ok, throws the error if Err
 * @throws The error if Result is Err
 */
export const unwrap = <T, E extends Error>(result: Result<T, E>): T => {
  if (isOk(result)) {
    return result.value;
  }
  throw (result as Err<E>).error;
};

/**
 * Transforms an array of items by applying a Result-returning function to each,
 * short-circuiting on the first Err (fail-fast semantics).
 *
 * @typeParam T - The type of the input items
 * @typeParam U - The type of the transformed values
 * @typeParam E - The type of the error
 * @param items - The array of items to traverse
 * @param fn - Function to apply to each item, returning a Result
 * @returns Ok with array of values if all succeed, or the first Err
 *
 * @example
 * import { traverse, ok, err } from '@deessejs/fp';
 *
 * const parseNum = (s: string): Result<number, Error> =>
 *   isNaN(+s) ? err(new Error('not a number')) : ok(+s);
 *
 * traverse(['1', '2', '3'], parseNum); // Ok([1, 2, 3])
 * traverse(['1', 'a', '3'], parseNum); // Err(Error('not a number'))
 */
export const traverse = <T, U, E extends Error>(
  items: readonly T[],
  fn: (item: T) => Result<U, E>
): Result<U[], E> => {
  const results: U[] = [];
  for (const item of items) {
    const result = fn(item);
    if (isErr(result)) {
      return result;
    }
    results.push((result as Ok<U, E>).value);
  }
  return ok(results);
};