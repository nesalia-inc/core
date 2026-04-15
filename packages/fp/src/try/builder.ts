/**
 * Try builder functions
 */

import type { Try, TrySuccess, TryFailure } from "./types";

/**
 * Creates a TrySuccess with methods
 * @typeParam T - The type of the value
 * @param value - The success value
 * @returns TrySuccess<T>
 */
export const createTrySuccess = <T>(value: T): TrySuccess<T> => ({
  ok: true,
  value,
  map(fn) { return createTrySuccess(fn(value)); },
  flatMap(fn) { return fn(value); },
  getOrElse() { return value; },
  getOrCompute() { return value; },
  tap(fn) { fn(value); return this; },
  tapErr() { return this; },
  match(ok) { return ok(value); },
});

/**
 * Creates a TryFailure with methods
 * @typeParam E - The type of the error
 * @param error - The error value
 * @returns TryFailure<E>
 */
export const createTryFailure = <E>(error: E): TryFailure<E> => ({
  ok: false,
  error,
  map() { return this as TryFailure<E>; },
  flatMap() { return this as TryFailure<E>; },
  getOrElse(defaultValue) { return defaultValue; },
  getOrCompute(fn) { return fn(); },
  tap() { return this as TryFailure<E>; },
  tapErr(fn) { fn(error); return this; },
  match(_, err) { return err(error); },
});

/**
 * Wraps a synchronous function in a try/catch
 * @typeParam T - The type of the value
 * @param fn - The function to try
 * @returns Try<T, Error>
 */
export function attempt<T>(fn: () => T): Try<T, Error>;
/**
 * Wraps a synchronous function in a try/catch with custom error handler
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error (must extend Error)
 * @param fn - The function to try
 * @param onError - Error handler to transform caught error into typed error
 * @returns Try<T, E>
 */
export function attempt<T, E extends Error>(fn: () => T, onError: (caught: Error) => E): Try<T, E>;
/**
 * Implementation
 */
export function attempt<T, E extends Error>(
  fn: () => T,
  onError?: (caught: Error) => E
): Try<T, Error | E> {
  try {
    return createTrySuccess(fn());
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return createTryFailure(onError ? onError(err) : err) as Try<T, Error | E>;
  }
}

/**
 * Wraps an async function in a try/catch
 * @typeParam T - The type of the value
 * @param fn - The async function to try
 * @returns Promise<Try<T, Error>>
 */
export function attemptAsync<T>(fn: () => Promise<T>): Promise<Try<T, Error>>;
/**
 * Wraps an async function in a try/catch with custom error handler
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error (must extend Error)
 * @param fn - The async function to try
 * @param onError - Error handler to transform caught error into typed error
 * @returns Promise<Try<T, E>>
 */
export function attemptAsync<T, E extends Error>(
  fn: () => Promise<T>,
  onError: (caught: Error) => E
): Promise<Try<T, E>>;
/**
 * Implementation
 */
export async function attemptAsync<T, E extends Error>(
  fn: () => Promise<T>,
  onError?: (caught: Error) => E
): Promise<Try<T, Error | E>> {
  try {
    return createTrySuccess(await fn());
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return createTryFailure(onError ? onError(err) : err) as Try<T, Error | E>;
  }
}

/**
 * Type guard to check if Try is successful
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param t - The Try to check
 * @returns true if Try is TrySuccess<T>
 */
export const isOk = <T, E>(t: Try<T, E>): t is TrySuccess<T> => t.ok === true;

/**
 * Type guard to check if Try is a failure
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param t - The Try to check
 * @returns true if Try is TryFailure<E>
 */
export const isErr = <T, E>(t: Try<T, E>): t is TryFailure<E> => t.ok === false;

/**
 * Maps the value of Try if successful, returns Failure otherwise
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the mapped value
 * @param t - The Try to map
 * @param fn - The mapping function
 * @returns Try<U, E>
 */
export const map = <T, E, U>(t: Try<T, E>, fn: (value: T) => U): Try<U, E> =>
  isOk(t) ? createTrySuccess(fn(t.value)) : createTryFailure(t.error);

/**
 * Chains Tries - function if successful, returns Failure otherwise
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the chained value
 * @param t - The Try to chain
 * @param fn - The chaining function
 * @returns Result of the function if successful, Failure otherwise
 */
export const flatMap = <T, E, U>(
  t: Try<T, E>,
  fn: (value: T) => Try<U, E>
): Try<U, E> => (isOk(t) ? fn(t.value) : createTryFailure(t.error));

/**
 * Gets the value or a default
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param t - The Try
 * @param defaultValue - The default value
 * @returns The value if successful, default otherwise
 */
export const getOrElse = <T, E>(t: Try<T, E>, defaultValue: T): T => (isOk(t) ? t.value : defaultValue);

/**
 * Gets the value or computes a default
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the computed default
 * @param t - The Try
 * @param fn - The function to compute default
 * @returns The value if successful, result of fn otherwise
 */
export const getOrCompute = <T, E, U>(t: Try<T, E>, fn: () => U): T | U =>
  isOk(t) ? t.value : fn();

/**
 * Performs a side effect without changing the value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param t - The Try to inspect
 * @param fn - The side effect function
 * @returns The same Try
 */
export const tap = <T, E>(t: Try<T, E>, fn: (value: T) => void): Try<T, E> => {
  if (isOk(t)) {
    fn(t.value);
  }
  return t;
};

/**
 * Performs a side effect without changing the value if Err
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param t - The Try to inspect
 * @param fn - The side effect function
 * @returns The same Try
 */
export const tapErr = <T, E>(t: Try<T, E>, fn: (error: E) => void): Try<T, E> => {
  if (isErr(t)) {
    fn(t.error);
  }
  return t;
};

/**
 * Matches both success and failure cases
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the result
 * @param t - The Try to match
 * @param ok - Function to handle success
 * @param err - Function to handle failure
 * @returns Result of the handler function
 */
export const match = <T, E, U>(
  t: Try<T, E>,
  ok: (value: T) => U,
  err: (error: E) => U
): U => (isOk(t) ? ok(t.value) : err(t.error));

/**
 * Converts Try to a nullable value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param t - The Try to convert
 * @returns The value if successful, null otherwise
 */
export const toNullable = <T, E>(t: Try<T, E>): T | null => (isOk(t) ? t.value : null);

/**
 * Converts Try to an undefined-able value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param t - The Try to convert
 * @returns The value if successful, undefined otherwise
 */
export const toUndefined = <T, E>(t: Try<T, E>): T | undefined => (isOk(t) ? t.value : undefined);
