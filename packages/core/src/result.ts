/**
 * Result type - represents success or failure
 * Used for simple error handling without domain richness
 */

/**
 * Result type - union of Ok and Err
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Ok type - represents a successful result
 * @typeParam T - The type of the value
 */
export type Ok<T> = {
  readonly ok: true;
  readonly value: T;
  isOk(): true;
  isErr(): false;
};

/**
 * Err type - represents a failed result
 * @typeParam E - The type of the error
 */
export type Err<E> = {
  readonly ok: false;
  readonly error: E;
  isOk(): false;
  isErr(): true;
};

/**
 * Creates an Ok (success result)
 * @param value - The success value
 * @returns Ok<T>
 */
export const ok = <T>(value: T): Ok<T> =>
  Object.freeze({
    ok: true,
    value,
    isOk() {
      return true;
    },
    isErr() {
      return false;
    },
  });

/**
 * Creates an Err (error result)
 * @param error - The error value
 * @returns Err<E>
 */
export const err = <E>(error: E): Err<E> =>
  Object.freeze({
    ok: false,
    error,
    isOk() {
      return false;
    },
    isErr() {
      return true;
    },
  });

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
  isOk(result) ? ok(fn(result.value)) : result;

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
): Result<U, E> => (isOk(result) ? fn(result.value) : result);

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
  isErr(result) ? err(fn(result.error)) : result;

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
 * Performs a side effect without changing the value
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
