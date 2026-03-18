/**
 * AsyncResult type - async version of Result
 * Used for chaining asynchronous operations with proper error handling
 */

/**
 * AsyncResult type - represents async success or failure
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error
 */
export type AsyncResult<T, E = Error> = Promise<AsyncResultInner<T, E>>;

/**
 * Inner type for AsyncResult
 */
export type AsyncResultInner<T, E> = AsyncOk<T> | AsyncErr<E>;

/**
 * AsyncOk type - represents a successful async result
 * @typeParam T - The type of the value
 */
export type AsyncOk<T> = {
  readonly ok: true;
  readonly value: T;
};

/**
 * AsyncErr type - represents a failed async result
 * @typeParam E - The type of the error
 */
export type AsyncErr<E> = {
  readonly ok: false;
  readonly error: E;
};

/**
 * Creates an async Ok (success result)
 * @param value - The success value
 * @returns Promise<AsyncOk<T>>
 */
export const okAsync = <T>(value: T): AsyncResult<T, never> =>
  Promise.resolve({
    ok: true,
    value,
  });

/**
 * Creates an async Err (error result)
 * @param error - The error value
 * @returns Promise<AsyncErr<E>>
 */
export const errAsync = <E>(error: E): AsyncResult<never, E> =>
  Promise.resolve({
    ok: false,
    error,
  });

/**
 * Creates an AsyncResult from a Promise
 * @param promise - The promise to convert
 * @returns AsyncResult<T, Error>
 */
export const fromPromise = <T>(promise: Promise<T>): AsyncResult<T, Error> =>
  promise
    .then((value) => ({ ok: true as const, value }))
    .catch((error) => ({
      ok: false as const,
      error: error instanceof Error ? error : new Error(String(error)),
    }));

/**
 * Type guard to check if AsyncResult is AsyncOk
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult to check
 * @returns true if AsyncResult is AsyncOk<T>
 */
export const isOk = <T, E>(result: AsyncResultInner<T, E>): result is AsyncOk<T> =>
  result.ok === true;

/**
 * Type guard to check if AsyncResult is AsyncErr
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult to check
 * @returns true if AsyncResult is AsyncErr<E>
 */
export const isErr = <T, E>(result: AsyncResultInner<T, E>): result is AsyncErr<E> =>
  result.ok === false;

/**
 * Maps the value of AsyncResult if AsyncOk, returns AsyncErr otherwise
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the mapped value
 * @param result - The AsyncResult to map
 * @param fn - The async mapping function
 * @returns AsyncResult<U, E>
 */
export const mapAsync = async <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => Promise<U>
): AsyncResult<U, E> => {
  const r = await result;
  return isOk(r) ? { ok: true, value: await fn(r.value) } : r;
};

/**
 * Chains AsyncResults - function if AsyncOk, returns AsyncErr otherwise
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the chained value
 * @param result - The AsyncResult to chain
 * @param fn - The async chaining function
 * @returns AsyncResult of the function if AsyncOk, AsyncErr otherwise
 */
export const flatMapAsync = async <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => AsyncResult<U, E>
): AsyncResult<U, E> => {
  const r = await result;
  return isOk(r) ? fn(r.value) : r;
};

/**
 * Maps the value of AsyncResult if AsyncOk (sync version)
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the mapped value
 * @param result - The AsyncResult to map
 * @param fn - The mapping function
 * @returns AsyncResult<U, E>
 */
export const map = <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => U
): AsyncResult<U, E> =>
  result.then((r) => (isOk(r) ? { ok: true, value: fn(r.value) } : r));

/**
 * Chains AsyncResults (sync version)
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the chained value
 * @param result - The AsyncResult to chain
 * @param fn - The chaining function
 * @returns AsyncResult of the function if AsyncOk, AsyncErr otherwise
 */
export const flatMap = <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => AsyncResult<U, E>
): AsyncResult<U, E> => result.then((r) => (isOk(r) ? fn(r.value) : r));

/**
 * Gets the value or a default
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult
 * @param defaultValue - The default value
 * @returns The value if AsyncOk, default otherwise
 */
export const getOrElse = <T, E>(result: AsyncResult<T, E>, defaultValue: T): Promise<T> =>
  result.then((r) => (isOk(r) ? r.value : defaultValue));

/**
 * Gets the value or computes a default
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the computed default
 * @param result - The AsyncResult
 * @param fn - The function to compute default
 * @returns The value if AsyncOk, result of fn otherwise
 */
export const getOrCompute = async <T, E, U>(
  result: AsyncResult<T, E>,
  fn: () => Promise<U>
): Promise<T | U> => {
  const r = await result;
  return isOk(r) ? r.value : await fn();
};

/**
 * Performs a side effect without changing the value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult to inspect
 * @param fn - The side effect function
 * @returns The same AsyncResult
 */
export const tap = <T, E>(result: AsyncResult<T, E>, fn: (value: T) => void): AsyncResult<T, E> =>
  result.then((r) => {
    if (isOk(r)) {
      fn(r.value);
    }
    return r;
  });

/**
 * Matches both AsyncOk and AsyncErr cases
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the result
 * @param result - The AsyncResult to match
 * @param ok - Function to handle AsyncOk
 * @param err - Function to handle AsyncErr
 * @returns Promise of result of the handler function
 */
export const match = async <T, E, U>(
  result: AsyncResult<T, E>,
  ok: (value: T) => U,
  err: (error: E) => U
): Promise<U> => {
  const r = await result;
  return isOk(r) ? ok(r.value) : err(r.error);
};

/**
 * Race - resolves to the first result to complete
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param results - The AsyncResults to race
 * @returns Promise<T> - The value of the first resolved
 */
export const race = <T, E>(...results: Array<AsyncResult<T, E>>): Promise<T> =>
  Promise.race(results).then((r) => {
    if (isOk(r)) {
      return r.value;
    }
    // For race, we return the value or throw
    // The first error would cause rejection
    throw r.error;
  });

/**
 * All - runs all async results in parallel
 * @typeParam T - The type of the values
 * @typeParam E - The type of the error
 * @param results - The AsyncResults to run in parallel
 * @returns AsyncResult<T[], E> - Array of values or first error
 */
export const all = <T, E>(...results: Array<AsyncResult<T, E>>): AsyncResult<T[], E> =>
  Promise.all(results).then((rs) => {
    // Check for errors
    const firstErr = rs.find((r) => isErr(r)) as AsyncErr<E> | undefined;
    if (firstErr) {
      return { ok: false, error: firstErr.error } as AsyncResultInner<T[], E>;
    }
    return { ok: true, value: rs.map((r) => (r as AsyncOk<T>).value) } as AsyncResultInner<T[], E>;
  });

/**
 * Traverse - runs async function for each item in parallel
 * @typeParam T - The type of the input items
 * @typeParam U - The type of the output items
 * @typeParam E - The type of the error
 * @param items - The items to traverse
 * @param fn - The async function to run for each item
 * @returns AsyncResult<U[], E> - Array of results or first error
 */
export const traverse = async <T, U, E>(
  items: T[],
  fn: (item: T) => AsyncResult<U, E>
): AsyncResult<U[], E> => {
  const results = await Promise.all(items.map(fn));
  const firstErr = results.find((r) => isErr(r)) as AsyncErr<E> | undefined;
  if (firstErr) {
    return { ok: false, error: firstErr.error };
  }
  return { ok: true, value: results.map((r) => (r as AsyncOk<U>).value) };
};

/**
 * AllSettled - runs all async results in parallel, collecting all errors
 * @typeParam T - The type of the values
 * @typeParam E - The type of the error
 * @param results - The AsyncResults to run in parallel
 * @returns AsyncResult<[T[], E[]], E[]> - Tuple of [values, errors]
 */
export const allSettled = <T, E>(
  ...results: Array<AsyncResult<T, E>>
): AsyncResult<[T[], E[]], E[]> =>
  Promise.all(results).then((rs) => {
    const values: T[] = [];
    const errors: E[] = [];

    for (const r of rs) {
      if (isOk(r)) {
        values.push(r.value);
      } else {
        errors.push(r.error);
      }
    }

    // Always return Ok with [values, errors] tuple
    return { ok: true, value: [values, errors] };
  });

/**
 * Converts AsyncResult to a nullable value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult to convert
 * @returns Promise<T | null>
 */
export const toNullable = <T, E>(result: AsyncResult<T, E>): Promise<T | null> =>
  result.then((r) => (isOk(r) ? r.value : null));

/**
 * Converts AsyncResult to an undefined-able value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult to convert
 * @returns Promise<T | undefined>
 */
export const toUndefined = <T, E>(result: AsyncResult<T, E>): Promise<T | undefined> =>
  result.then((r) => (isOk(r) ? r.value : undefined));
