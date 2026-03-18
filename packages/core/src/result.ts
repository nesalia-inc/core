/**
 * Result type - represents success or failure
 * Used for simple error handling without domain richness
 */

/**
 * Ok type - represents a successful result with methods
 * @typeParam T - The type of the value
 */
export type Ok<T> = {
  readonly ok: true;
  readonly value: T;
  // Type guard methods
  isOk(): true;
  isErr(): false;
  // Methods for chaining - return the specific variant
  map<U>(fn: (value: T) => U): Ok<U>;
  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E>;
  mapErr<F>(fn: (error: never) => F): Ok<T>;
  getOrElse(defaultValue: T): T;
  getOrCompute<U>(fn: () => U): T | U;
  tap(fn: (value: T) => void): Ok<T>;
  tapErr(fn: (error: never) => void): Ok<T>;
  match<U>(ok: (value: T) => U, _err: (error: never) => U): U;
};

/**
 * Err type - represents a failed result with methods
 * @typeParam E - The type of the error
 */
export type Err<E> = {
  readonly ok: false;
  readonly error: E;
  // Type guard methods
  isOk(): false;
  isErr(): true;
  // Methods for chaining - return the specific variant
  map<U>(_fn: (value: never) => U): Err<E>;
  flatMap<U>(_fn: (value: never) => Result<U, E>): Err<E>;
  mapErr<F>(fn: (error: E) => F): Err<F>;
  getOrElse<T>(defaultValue: T): T;
  getOrCompute<T, U>(fn: () => U): T | U;
  tap(_fn: (value: never) => void): Err<E>;
  tapErr(fn: (error: E) => void): Err<E>;
  match<U>(_ok: (value: never) => U, err: (error: E) => U): U;
};

/**
 * Result type - union of Ok and Err
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Creates an Ok with methods
 * @typeParam T - The type of the value
 * @param value - The success value
 * @returns Ok<T>
 */
const createOk = <T>(value: T): Ok<T> =>
  Object.freeze({
    ok: true as const,
    value,
    isOk() { return true; },
    isErr() { return false; },
    map(fn) { return createOk(fn(value)); },
    flatMap(fn) { return fn(value); },
    mapErr() { return this as Ok<T>; },
    getOrElse() { return value; },
    getOrCompute() { return value; },
    tap(fn) { fn(value); return this; },
    tapErr() { return this; },
    match(ok) { return ok(value); },
  });

/**
 * Creates an Err with methods
 * @typeParam E - The type of the error
 * @param error - The error value
 * @returns Err<E>
 */
const createErr = <E>(error: E): Err<E> =>
  Object.freeze({
    ok: false as const,
    error,
    isOk() { return false; },
    isErr() { return true; },
    map() { return this as Err<E>; },
    flatMap() { return this as Err<E>; },
    mapErr(fn) { return createErr(fn(error)); },
    getOrElse(defaultValue) { return defaultValue; },
    getOrCompute(fn) { return fn(); },
    tap() { return this as Err<E>; },
    tapErr(fn) { fn(error); return this; },
    match(_, err) { return err(error); },
  });

/**
 * Creates an Ok (success result)
 * @param value - The success value
 * @returns Ok<T>
 */
export const ok = <T>(value: T): Ok<T> => createOk(value);

/**
 * Creates an Err (error result)
 * @param error - The error value
 * @returns Err<E>
 */
export const err = <E>(error: E): Err<E> => createErr(error);

/**
 * Type guard to check if Result is Ok
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to check
 * @returns true if Result is Ok<T>
 */
export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> => result.ok === true;

/**
 * Type guard to check if Result is Err
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to check
 * @returns true if Result is Err<E>
 */
export const isErr = <T, E>(result: Result<T, E>): result is Err<E> => result.ok === false;

/**
 * Maps the value of Result if Ok, returns Err otherwise
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the mapped value
 * @param result - The Result to map
 * @param fn - The mapping function
 * @returns Result<U, E>
 */
export const map = <T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
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
export const flatMap = <T, E, U>(
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
export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> =>
  isErr(result) ? createErr(fn(result.error)) : createOk(result.value);

/**
 * Gets the value or a default
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result
 * @param defaultValue - The default value
 * @returns The value if Ok, default otherwise
 */
export const getOrElse = <T, E>(result: Result<T, E>, defaultValue: T): T =>
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
export const getOrCompute = <T, E, U>(result: Result<T, E>, fn: () => U): T | U =>
  isOk(result) ? result.value : fn();

/**
 * Performs a side effect without changing the value if Ok
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to inspect
 * @param fn - The side effect function
 * @returns The same Result
 */
export const tap = <T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> => {
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
export const tapErr = <T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> => {
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
export const match = <T, E, U>(
  result: Result<T, E>,
  ok: (value: T) => U,
  err: (error: E) => U
): U => (isOk(result) ? ok(result.value) : err(result.error));

/**
 * Converts Result to a nullable value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to convert
 * @returns The value if Ok, null otherwise
 */
export const toNullable = <T, E>(result: Result<T, E>): T | null =>
  isOk(result) ? result.value : null;

/**
 * Converts Result to an undefined-able value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The Result to convert
 * @returns The value if Ok, undefined otherwise
 */
export const toUndefined = <T, E>(result: Result<T, E>): T | undefined =>
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
export const all = <T, E>(...results: Array<Result<T, E>>): Result<T[], E> => {
  const firstErr = results.find(isErr);
  if (firstErr) {
    return createErr(firstErr.error);
  }
  return createOk(results.map((r) => (r as Ok<T>).value));
};
