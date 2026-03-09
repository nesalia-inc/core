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
 * @param fn - The function to try
 * @returns Try<T, Error>
 */
export const attempt = <T>(fn: () => T): Try<T, Error> => {
  try {
    return createTrySuccess(fn());
  } catch (e) {
    return createTryFailure(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Wraps an async function in a try/catch
 * @param fn - The async function to try
 * @returns Promise<Try<T, Error>>
 */
export const attemptAsync = async <T>(fn: () => Promise<T>): Promise<Try<T, Error>> => {
  try {
    return createTrySuccess(await fn());
  } catch (e) {
    return createTryFailure(e instanceof Error ? e : new Error(String(e)));
  }
};

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
