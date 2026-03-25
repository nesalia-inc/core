/**
 * Result type - represents success or failure
 * Used for simple error handling without domain richness
 */

import type { NativeError } from "../error/types";

/**
 * Ok type - represents a successful result with methods
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error (constrained to Error)
 */
export type Ok<T, E extends NativeError = NativeError> = {
  readonly ok: true;
  readonly value: T;
  // Type guard methods
  isOk(): true;
  isErr(): false;
  // Methods for chaining - return the specific variant
  map<U>(fn: (value: T) => U): Ok<U, E>;
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
  mapErr<F extends NativeError>(fn: (error: never) => F): Ok<T, E>;
  getOrElse(defaultValue: T): T;
  getOrCompute<U>(fn: () => U): T | U;
  tap(fn: (value: T) => void): Ok<T, E>;
  tapErr(fn: (error: E) => void): Ok<T, E>;
  match<U>(ok: (value: T) => U, _err: (error: E) => U): U;
  unwrap(): T;
};

/**
 * Err type - represents a failed result with methods
 * @typeParam E - The type of the error (constrained to Error)
 */
export type Err<E extends NativeError = NativeError> = {
  readonly ok: false;
  readonly error: E;
  // Type guard methods
  isOk(): false;
  isErr(): true;
  // Methods for chaining - return the specific variant
  map<U>(_fn: (value: never) => U): Err<E>;
  flatMap<U>(_fn: (value: never) => Result<U, E>): Err<E>;
  mapErr<F extends NativeError>(fn: (error: E) => F): Err<F>;
  getOrElse<T>(defaultValue: T): T;
  getOrCompute<T, U>(fn: () => U): T | U;
  tap(_fn: (value: never) => void): Err<E>;
  tapErr(fn: (error: E) => void): Err<E>;
  match<U>(_ok: (value: never) => U, err: (error: E) => U): U;
  unwrap(): never;
};

/**
 * Result type - union of Ok and Err
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error (must extend Error)
 */
export type Result<T, E extends NativeError = NativeError> = Ok<T, E> | Err<E>;

/**
 * Success type - a Result that always succeeds (alias for Result<T, never>)
 * Use this when you want to explicitly indicate that a function cannot fail
 * @typeParam T - The type of the success value
 */
export type Success<T> = Result<T, never>;

/**
 * ExtractError - extracts the error type from a function that returns Result
 *
 * Usage:
 *   type MyError = ExtractError<typeof myFunction>; // Error type
 *   type ApiError = ExtractError<() => Result<User, ApiError>>; // ApiError
 *
 * @typeParam T - The function type to extract the error from
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractError<T> = T extends () => Result<unknown, infer E>
  ? E
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  : T extends (args: any) => Result<unknown, infer E>
    ? E
    : never;
