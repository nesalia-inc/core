/**
 * Result builder functions
 */

import { type Ok, type Err, type Result } from "./types.js";
import { type Error } from "../error/types.js";

/**
 * Creates an Ok with methods
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param value - The success value
 * @returns Ok<T, E>
 */
const createOk = <T, E extends Error = Error>(value: T): Ok<T, E> => {
  const self: Ok<T, E> = {
    ok: true as const,
    value,
    isOk() { return true; },
    isErr() { return false; },
    map(fn) { return createOk(fn(value)); },
    flatMap<U>(fn: (value: T) => Result<U, E>) { return fn(value) as Result<U, E>; },
     
    mapErr(_fn) { return self; },
    getOrElse() { return value; },
    getOrCompute() { return value; },
    tap(fn) { fn(value); return self; },
    tapErr() { return self; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    match(fn: any) {
      if (typeof fn === 'object' && fn !== null && 'onSuccess' in fn) {
        return fn.onSuccess(value);
      }
      return fn(value);
    },
    unwrap() { return value; },
  };
  return Object.freeze(self);
};

/**
 * Creates an Err with methods
 * @typeParam E - The type of the error (must extend Error)
 * @param error - The error value
 * @returns Err<E>
 */
const createErr = <E extends Error>(error: E): Err<E> => {
  const self: Err<E> = {
    ok: false as const,
    error,
    isOk() { return false; },
    isErr() { return true; },
     
    map(_fn) { return self; },
     
    flatMap(_fn) { return self; },
    mapErr<F extends Error>(fn: (error: E) => F): Err<F> { return createErr(fn(error)); },
    getOrElse(defaultValue) { return defaultValue; },
    getOrCompute(fn) { return fn(); },
     
    tap(_fn) { return self; },
    tapErr(fn) { fn(error); return self; },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    match(fn: any) {
      if (typeof fn === 'object' && fn !== null && 'onError' in fn) {
        return fn.onError(error);
      }
      return fn(error);
    },
    unwrap() { throw error; },
  };
  return Object.freeze(self);
};

/**
 * Creates an Ok (success result)
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error (defaults to Error)
 * @param value - The success value
 * @returns Ok<T, E>
 */
export const ok = <T, E extends Error = Error>(value: T): Ok<T, E> => createOk(value);

/**
 * Creates an Err (error result)
 * @typeParam E - The type of the error (must extend Error)
 * @param error - The error value
 * @returns Err<E>
 */
export const err = <E extends Error>(error: E): Err<E> => createErr(error);

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
  isOk(result) ? createOk(fn(result.value)) : createErr(result.error);

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
): Result<U, E> => (isOk(result) ? fn(result.value) : createErr(result.error));

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
  isErr(result) ? createErr(fn(result.error)) : createOk(result.value);

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
): U => (isOk(result) ? ok(result.value) : err(result.error));

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
    ? createErr(result.value)
    : createOk(result.error);

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
    return createErr(firstErr.error);
  }
  return createOk(results.map((r) => (r as Ok<T, E>).value));
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
  throw result.error;
};
