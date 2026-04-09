/**
 * Try type - wraps try/catch in a type-safe way
 * Used for explicit error handling in synchronous and asynchronous operations
 */

/**
 * TrySuccess type - represents a successful try with methods
 * @typeParam T - The type of the value
 */
export type TrySuccess<T> = {
  readonly ok: true;
  readonly value: T;
  // Methods for chaining - return the specific variant
  map<U>(fn: (value: T) => U): TrySuccess<U>;
  flatMap<U, E>(fn: (value: T) => Try<U, E>): Try<U, E>;
  getOrElse(defaultValue: T): T;
  getOrCompute<U>(fn: () => U): T | U;
  tap(fn: (value: T) => void): TrySuccess<T>;
  tapErr(fn: (error: never) => void): TrySuccess<T>;
  match<U>(ok: (value: T) => U, _err: (error: never) => U): U;
};

/**
 * TryFailure type - represents a failed try with methods
 * @typeParam E - The type of the error
 */
export type TryFailure<E> = {
  readonly ok: false;
  readonly error: E;
  // Methods for chaining - return the specific variant
  map<U>(_fn: (value: never) => U): TryFailure<E>;
  flatMap<U>(_fn: (value: never) => Try<U, E>): TryFailure<E>;
  getOrElse<T>(defaultValue: T): T;
  getOrCompute<T, U>(fn: () => U): T | U;
  tap(_fn: (value: never) => void): TryFailure<E>;
  tapErr(fn: (error: E) => void): TryFailure<E>;
  match<U>(_ok: (value: never) => U, err: (error: E) => U): U;
};

/**
 * Try type - union of Success and Failure
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error
 */
export type Try<T, E = Error> = TrySuccess<T> | TryFailure<E>;
