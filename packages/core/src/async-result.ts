/**
 * AsyncResult type - async version of Result
 * Used for chaining asynchronous operations with proper error handling
 */

/**
 * Abort error type for AsyncResult operations
 */
export type AbortError = Error & {
  name: "AbortError";
};

/**
 * Options for fromPromise
 */
export interface FromPromiseOptions {
  /** AbortSignal to cancel the operation */
  signal?: AbortSignal;
}

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
 * @param onError - Optional function to transform the error
 * @returns AsyncResult<T, E> (E defaults to Error when onError is not provided)
 */
export const fromPromise = <T, E = Error>(
  promise: Promise<T>,
  onErrorOrOptions?: ((error: unknown) => E) | FromPromiseOptions,
  options?: FromPromiseOptions
): AsyncResult<T, E> => {
  // Handle function overload: fromPromise(promise, onError)
  if (typeof onErrorOrOptions === "function") {
    const onError = onErrorOrOptions;
    return promise
      .then((value) => ({ ok: true as const, value }))
      .catch((error) => {
        return { ok: false as const, error: onError(error) } as AsyncResultInner<T, E>;
      });
  }

  // Handle options overload: fromPromise(promise, options) or fromPromise(promise, options, signal)
  const signal = onErrorOrOptions?.signal ?? options?.signal;

  // If already aborted, return immediately with AbortError
  if (signal?.aborted) {
    const error = new Error("Operation aborted") as AbortError;
    error.name = "AbortError";
    return Promise.resolve({ ok: false as const, error: error as E });
  }

  return new Promise((resolve) => {
    if (signal) {
      const abortHandler = () => {
        const error = new Error("Operation aborted") as AbortError;
        error.name = "AbortError";
        resolve({ ok: false as const, error: error as E });
      };

      signal.addEventListener("abort", abortHandler, { once: true });
    }

    promise
      .then((value) => resolve({ ok: true as const, value }))
      .catch((error) =>
        resolve({
          ok: false as const,
          error: (error instanceof Error ? error : new Error(String(error))) as E,
        })
      );
  });
};

/**
 * Creates an AsyncResult from a Promise with options (alias for fromPromise with options)
 * @param promise - The promise to convert
 * @param options - Options including AbortSignal
 * @returns AsyncResult<T, Error>
 */
export const fromPromiseWithOptions = <T>(
  promise: Promise<T>,
  options: FromPromiseOptions = {}
): AsyncResult<T, Error> => fromPromise(promise, options);

/**
 * Checks if an error is an AbortError
 * @param error - The error to check
 * @returns true if error is an AbortError
 */
export const isAbortError = (error: unknown): error is AbortError =>
  error instanceof Error && error.name === "AbortError";

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
 * Maps the value of AsyncResult if AsyncOk (handles both sync and async functions)
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the mapped value
 * @param result - The AsyncResult to map
 * @param fn - The mapping function (sync or async)
 * @returns AsyncResult<U, E>
 */
export const map = async <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => U | Promise<U>
): AsyncResult<U, E> => {
  const r = await result;
  if (!isOk(r)) return r;
  const mapped = await Promise.resolve(fn(r.value));
  return { ok: true, value: mapped };
};

/**
 * Chains AsyncResults (handles both sync and async functions)
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the chained value
 * @param result - The AsyncResult to chain
 * @param fn - The chaining function (sync or async)
 * @returns AsyncResult of the function if AsyncOk, AsyncErr otherwise
 */
export const flatMap = async <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => AsyncResult<U, E> | Promise<AsyncResult<U, E>>
): AsyncResult<U, E> => {
  const r = await result;
  if (!isOk(r)) return r;
  return await Promise.resolve(fn(r.value));
};

/**
 * @deprecated Use `map` instead. `map` now handles both sync and async functions automatically.
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
 * @deprecated Use `flatMap` instead. `flatMap` now handles both sync and async functions automatically.
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
      return { ok: false, error: firstErr.error };
    }
    return { ok: true, value: rs.map((r) => (r as AsyncOk<T>).value) };
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

/**
 * Wraps an AsyncResult chain to abort when signal is triggered
 * @param result - The AsyncResult to wrap
 * @param signal - The AbortSignal to monitor
 * @returns AsyncResult that will abort when signal is triggered
 */
export const withSignal = <T, E = Error>(
  result: AsyncResult<T, E>,
  signal: AbortSignal
): AsyncResult<T, E | AbortError> => {
  // If already aborted, return immediately with AbortError
  if (signal.aborted) {
    const error = new Error("Operation aborted") as AbortError;
    error.name = "AbortError";
    return Promise.resolve({ ok: false as const, error });
  }

  return new Promise((resolve) => {
    const abortHandler = () => {
      const error = new Error("Operation aborted") as AbortError;
      error.name = "AbortError";
      resolve({ ok: false as const, error });
    };

    signal.addEventListener("abort", abortHandler, { once: true });

    result.then((r) => {
      // Remove the listener since the operation completed
      signal.removeEventListener("abort", abortHandler);
      resolve(r);
    });
  });
};
