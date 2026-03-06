/**
 * Try type - wraps try/catch in a type-safe way
 * Used for explicit error handling in synchronous and asynchronous operations
 */

/**
 * Try type - union of Success and Failure
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error
 */
export type Try<T, E = Error> = TrySuccess<T> | TryFailure<E>;

/**
 * TrySuccess type - represents a successful try
 * @typeParam T - The type of the value
 */
export type TrySuccess<T> = {
  readonly ok: true;
  readonly value: T;
};

/**
 * TryFailure type - represents a failed try
 * @typeParam E - The type of the error
 */
export type TryFailure<E> = {
  readonly ok: false;
  readonly error: E;
};

/**
 * Wraps a synchronous function in a try/catch
 * @param fn - The function to try
 * @returns Try<T, Error>
 */
export const attempt = <T>(fn: () => T): Try<T, Error> => {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
};

/**
 * Wraps an async function in a try/catch
 * @param fn - The async function to try
 * @returns Promise<Try<T, Error>>
 */
export const attemptAsync = async <T>(fn: () => Promise<T>): Promise<Try<T, Error>> => {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
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
  isOk(t) ? { ok: true, value: fn(t.value) } : t;

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
): Try<U, E> => (isOk(t) ? fn(t.value) : t);

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
