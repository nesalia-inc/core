/**
 * AsyncResult builder - factory functions and standalone utilities
 * Async version of Result with Thenable implementation for async operations
 */

import type {
  AsyncResultInner,
  AsyncOk,
  AsyncErr,
  AbortError,
  FromPromiseOptions,
  AsyncResult,
} from "./types";

import { error, type Error, isError } from "../error";

// Re-export types
export type {
  AsyncResultInner,
  AsyncOk,
  AsyncErr,
  AbortError,
  FromPromiseOptions,
} from "./types";

/**
 * PanicError - wraps unexpected exceptions from rejected promises
 * Used by fromPromise to convert native errors into the Error system
 */
const PanicError = error({
  name: "PanicError",
  message: (args: { message: string }) => args.message,
});

/**
 * AbortError - structured error for aborted operations
 * Uses the Error system for consistency with addNotes(), from(), etc.
 */
const AbortError = error({
  name: "AbortError",
  message: () => "Operation aborted",
});

/**
 * Creates a new AsyncResult from a promise
 * Internal function - exposed through ok(), err(), fromPromise(), etc.
 */
function createAsyncResult<T, E>(promise: Promise<AsyncResultInner<T, E>>): AsyncResult<T, E> {
  const obj = {
    ok: undefined as boolean | undefined,
    get value(): T {
      throw new Error("Cannot synchronously access value - use await or .then()");
    },
    get error(): E {
      throw new Error("Cannot synchronously access error - use await or .then()");
    },
    [Symbol.toStringTag]: "AsyncResult" as const,

    then<TResult1 = AsyncResultInner<T, E>, TResult2 = never>(
      onfulfilled?: (value: AsyncResultInner<T, E>) => TResult1 | PromiseLike<TResult1>,
      onrejected?: (reason: E) => TResult2 | PromiseLike<TResult2>
    ): Promise<TResult1 | TResult2> {
      return promise.then(
        (result) => {
          if (onfulfilled) {
            return onfulfilled(result);
          }
          return result as unknown as TResult1;
        },
        (reason) => {
          if (onrejected) {
            return onrejected(reason);
          }
          return reason as unknown as TResult2;
        }
      );
    },

    catch<U = AsyncResultInner<T, E>>(
      onrejected?: (error: E) => U | PromiseLike<U>
    ): Promise<AsyncResultInner<T, E> | U> {
      return promise.catch((error) => {
        if (onrejected) {
          return onrejected(error as E);
        }
        throw error;
      });
    },

    finally(onfinally?: () => void): Promise<AsyncResultInner<T, E>> {
      return promise.finally(onfinally);
    },

    map<U>(fn: (value: T) => U | Promise<U>) {
      const isAsync =
        fn.length > 0 || (fn.constructor && fn.constructor.name === "AsyncFunction");
      if (!isAsync) {
        return createAsyncResult<U, E>(
          promise.then((result) =>
            result.ok ? { ok: true as const, value: fn(result.value) as U } : result
          )
        );
      }
      return createAsyncResult<U, E>(
        promise.then(async (result) => {
          if (!result.ok) return result;
          const mapped = await Promise.resolve(fn(result.value));
          return { ok: true as const, value: mapped };
        })
      );
    },

    mapErr<F>(fn: (error: E) => F) {
      return createAsyncResult<T, F>(
        promise.then((result) =>
          result.ok ? result : { ok: false as const, error: fn(result.error) }
        )
      );
    },

    flatMap<U>(
      fn: (value: T) => unknown
    ) {
      return createAsyncResult<U, E>(
        promise.then(async (result) => {
          if (!result.ok) return result;
          const next = await Promise.resolve(fn(result.value));
          if (next && typeof next === "object" && "ok" in next) {
            return next as AsyncResultInner<U, E>;
          }
          return next as AsyncResultInner<U, E>;
        })
      );
    },

    flatMapAsync<U>(fn: (value: T) => Promise<AsyncResultInner<U, E>>) {
      return createAsyncResult<U, E>(
        promise.then(async (result) =>
          result.ok ? await fn(result.value) : result
        )
      );
    },

    getOrElse(defaultValue: T): Promise<T> {
      return promise.then((result) => (result.ok ? result.value : defaultValue));
    },

    getOrCompute(fn: () => T | Promise<T>): Promise<T> {
      return promise.then(async (result) =>
        result.ok ? result.value : await Promise.resolve(fn())
      );
    },

    tap(fn: (value: T) => void) {
      return createAsyncResult<T, E>(
        promise.then((result) => {
          if (result.ok) {
            fn(result.value);
          }
          return result;
        })
      );
    },

    tapErr(fn: (error: E) => void) {
      return createAsyncResult<T, E>(
        promise.then((result) => {
          if (!result.ok) {
            fn(result.error);
          }
          return result;
        })
      );
    },

    match<U>(ok: (value: T) => U, err: (error: E) => U): Promise<U> {
      return promise.then((result) => (result.ok ? ok(result.value) : err(result.error)));
    },

    toNullable(): Promise<T | null> {
      return promise.then((result) => (result.ok ? result.value : null));
    },

    toUndefined(): Promise<T | undefined> {
      return promise.then((result) => (result.ok ? result.value : undefined));
    },

    async unwrap(): Promise<T> {
      const result = await promise;
      if (result.ok) {
        return result.value;
      }
      throw result.error;
    },

    unwrapOr(defaultValue: T): Promise<T> {
      return this.getOrElse(defaultValue);
    },

    toPromise(): Promise<AsyncResultInner<T, E>> {
      return promise;
    },
  };

  return obj as AsyncResult<T, E>;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Creates an async Ok (success result)
 * @param value - The success value
 * @returns AsyncResult<T, never>
 */
export const ok = <T>(value: T): AsyncResult<T, never> =>
  createAsyncResult<T, never>(
    Promise.resolve({
      ok: true as const,
      value,
    })
  );

/**
 * Creates an async Err (error result)
 * @param error - The error value
 * @returns AsyncResult<never, E>
 */
export const err = <E>(error: E): AsyncResult<never, E> =>
  createAsyncResult<never, E>(
    Promise.resolve({
      ok: false as const,
      error,
    })
  );

/**
 * Alias for ok - creates an async Ok (success result)
 */
export const okAsync = ok;

/**
 * Alias for err - creates an async Err (error result)
 */
export const errAsync = err;

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
    return createAsyncResult<T, E>(
      promise
        .then((value) => ({ ok: true as const, value }))
        .catch((error) => {
          return { ok: false as const, error: onError(error) } as AsyncResultInner<T, E>;
        })
    );
  }

  // Handle options overload: fromPromise(promise, options) or fromPromise(promise, options, signal)
  const signal = onErrorOrOptions?.signal ?? options?.signal;

  // If already aborted, return immediately with AbortError
  if (signal?.aborted) {
    return createAsyncResult<T, E>(Promise.resolve({ ok: false as const, error: AbortError() as E as E }));
  }

  return createAsyncResult<T, E>(
    new Promise((resolve) => {
      if (signal) {
        const abortHandler = () => {
          resolve({ ok: false as const, error: AbortError() as E });
        };

        signal.addEventListener("abort", abortHandler, { once: true });
      }

      promise
        .then((value) => resolve({ ok: true as const, value }))
        .catch((rawError) =>
          resolve({
            ok: false as const,
            error: isError(rawError)
              ? PanicError({ message: rawError.message }).from(rawError) as E
              : PanicError({ message: String(rawError) }) as E,
          })
        );
    })
  );
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
 * Creates an AsyncResult from a Promise<AsyncResultInner>
 * @param promise - The promise to convert
 * @returns AsyncResult<T, E>
 */
export const from = <T, E>(promise: Promise<AsyncResultInner<T, E>>): AsyncResult<T, E> =>
  createAsyncResult<T, E>(promise);

/**
 * Creates an AsyncResult that resolves after a delay
 * @param value - The value to resolve with
 * @param ms - Delay in milliseconds
 * @returns AsyncResult<T, never>
 */
export const fromValue = <T>(value: T, ms = 0): AsyncResult<T, never> =>
  createAsyncResult<T, never>(
    new Promise((resolve) => setTimeout(() => resolve({ ok: true as const, value }), ms))
  );

/**
 * Creates an AsyncResult that rejects after a delay
 * @param error - The error to reject with
 * @param ms - Delay in milliseconds
 * @returns AsyncResult<never, E>
 */
export const fromError = <E>(error: E, ms = 0): AsyncResult<never, E> =>
  createAsyncResult<never, E>(
    new Promise((resolve) => setTimeout(() => resolve({ ok: false as const, error }), ms))
  );

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Checks if an error is an AbortError
 * @param error - The error to check
 * @returns true if error is an AbortError
 */
export const isAbortError = (error: unknown): error is AbortError =>
  isError(error) && error.name === "AbortError";

/**
 * Type guard to check if AsyncResult is AsyncOk
 * @param result - The AsyncResult to check
 * @returns true if AsyncResult is AsyncOk<T>
 */
export const isOk = <T, E>(result: AsyncResultInner<T, E>): result is AsyncOk<T> =>
  result.ok === true;

/**
 * Type guard to check if AsyncResult is AsyncErr
 * @param result - The AsyncResult to check
 * @returns true if AsyncResult is AsyncErr<E>
 */
export const isErr = <T, E>(result: AsyncResultInner<T, E>): result is AsyncErr<E> =>
  result.ok === false;

// =============================================================================
// TRANSFORMATIONS
// =============================================================================

/**
 * Maps the value of AsyncResult if AsyncOk (handles both sync and async functions)
 * @param result - The AsyncResult to map
 * @param fn - The mapping function (sync or async)
 * @returns AsyncResult<U, E>
 */
export const map = <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => U | Promise<U>
): AsyncResult<U, E> => {
  // Use instance method for sync functions, wrap for async
  const isAsync = fn.length > 0 || fn.constructor.name === "AsyncFunction";
  if (!isAsync) {
    return result.map(fn as (value: T) => U);
  }
  // For async functions, use then
  return result.then(async (r) => {
    if (!isOk(r)) return r;
    const mapped = await Promise.resolve(fn(r.value));
    return { ok: true as const, value: mapped };
  }) as unknown as AsyncResult<U, E>;
};

/**
 * Chains AsyncResults (handles both sync and async functions)
 * @param result - The AsyncResult to chain
 * @param fn - The chaining function (sync or async)
 * @returns AsyncResult of the function if AsyncOk, AsyncErr otherwise
 */
export const flatMap = <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => AsyncResult<U, E> | Promise<AsyncResultInner<U, E>>
): AsyncResult<U, E> =>
  result.flatMap(fn as (value: T) => AsyncResult<U, E>);

/**
 * Maps the error of AsyncResult if AsyncErr, returns AsyncOk otherwise
 * @param result - The AsyncResult to map
 * @param fn - The error mapping function
 * @returns AsyncResult<T, F>
 */
export const mapErr = <T, E, F>(
  result: AsyncResult<T, E>,
  fn: (error: E) => F
): AsyncResult<T, F> => result.mapErr(fn);

/**
 * @deprecated Use `map` instead. `map` now handles both sync and async functions automatically.
 * Maps the value of AsyncResult if AsyncOk, returns AsyncErr otherwise
 * @param result - The AsyncResult to map
 * @param fn - The async mapping function
 * @returns AsyncResult<U, E>
 */
export const mapAsync = <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => Promise<U>
): AsyncResult<U, E> => {
  return result.then(async (r) => {
    if (isOk(r)) {
      return { ok: true as const, value: await fn(r.value) };
    }
    return r;
  }) as unknown as AsyncResult<U, E>;
};

/**
 * @deprecated Use `flatMap` instead. `flatMap` now handles both sync and async functions automatically.
 * Chains AsyncResults - function if AsyncOk, returns AsyncErr otherwise
 * @param result - The AsyncResult to chain
 * @param fn - The async chaining function
 * @returns AsyncResult of the function if AsyncOk, AsyncErr otherwise
 */
export const flatMapAsync = <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => AsyncResult<U, E>
): AsyncResult<U, E> => {
  return result.then((r) => {
    return isOk(r) ? fn(r.value) : r;
  }) as unknown as AsyncResult<U, E>;
};

// =============================================================================
// SIDE EFFECTS
// =============================================================================

/**
 * Performs a side effect without changing the value
 * @param result - The AsyncResult to inspect
 * @param fn - The side effect function
 * @returns The same AsyncResult
 */
export const tap = <T, E>(result: AsyncResult<T, E>, fn: (value: T) => void): AsyncResult<T, E> =>
  result.tap(fn);

/**
 * Performs a side effect on error without changing the value
 * @param result - The AsyncResult to inspect
 * @param fn - The error side effect function
 * @returns The same AsyncResult
 */
export const tapErr = <T, E>(result: AsyncResult<T, E>, fn: (error: E) => void): AsyncResult<T, E> =>
  result.tapErr(fn);

// =============================================================================
// EXTRACTION
// =============================================================================

/**
 * Gets the value or a default
 * @param result - The AsyncResult
 * @param defaultValue - The default value
 * @returns The value if AsyncOk, default otherwise
 */
export const getOrElse = <T, E>(result: AsyncResult<T, E>, defaultValue: T): Promise<T> =>
  result.getOrElse(defaultValue);

/**
 * Gets the value or computes a default
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
 * Unwraps the AsyncResult, throwing if error
 * @param result - The AsyncResult to unwrap
 * @returns Promise resolving to the value
 */
export const unwrap = async <T, E>(result: AsyncResult<T, E>): Promise<T> => result.unwrap();

/**
 * Unwraps the AsyncResult, returning default if error
 * @param result - The AsyncResult to unwrap
 * @param defaultValue - The default value
 * @returns Promise resolving to the value or default
 */
export const unwrapOr = <T, E>(result: AsyncResult<T, E>, defaultValue: T): Promise<T> =>
  result.unwrapOr(defaultValue);

// =============================================================================
// PATTERN MATCHING
// =============================================================================

/**
 * Matches both AsyncOk and AsyncErr cases
 * @param result - The AsyncResult to match
 * @param ok - Function to handle AsyncOk
 * @param err - Function to handle AsyncErr
 * @returns Promise of result of the handler function
 */
export const match = async <T, E, U>(
  result: AsyncResult<T, E>,
  ok: (value: T) => U,
  err: (error: E) => U
): Promise<U> => result.match(ok, err);

// =============================================================================
// CONVERSION
// =============================================================================

/**
 * Converts AsyncResult to a nullable value
 * @param result - The AsyncResult to convert
 * @returns Promise<T | null>
 */
export const toNullable = <T, E>(result: AsyncResult<T, E>): Promise<T | null> =>
  result.toNullable();

/**
 * Converts AsyncResult to an undefined-able value
 * @param result - The AsyncResult to convert
 * @returns Promise<T | undefined>
 */
export const toUndefined = <T, E>(result: AsyncResult<T, E>): Promise<T | undefined> =>
  result.then((r) => (isOk(r) ? r.value : undefined));

// =============================================================================
// COMBINATORS
// =============================================================================

/**
 * Race - resolves to the first result to complete
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
 * @param results - The AsyncResults to run in parallel
 * @returns AsyncResult<T[], E> - Array of values or first error
 */
export const all = <T, E>(...results: Array<AsyncResult<T, E>>): AsyncResult<T[], E> =>
  createAsyncResult<T[], E>(
    Promise.all(results).then((rs) => {
      // Check for errors
      const firstErr = rs.find((r) => isErr(r)) as AsyncErr<E> | undefined;
      if (firstErr) {
        return { ok: false as const, error: firstErr.error };
      }
      return { ok: true as const, value: rs.map((r) => (r as AsyncOk<T>).value) };
    })
  );

/**
 * Traverse - runs async function for each item in parallel
 * @param items - The items to traverse
 * @param fn - The async function to run for each item
 * @returns AsyncResult<U[], E> - Array of results or first error
 */
export const traverse = async <T, U, E>(
  items: T[],
  fn: (item: T) => AsyncResult<U, E>
): Promise<AsyncResult<U[], E>> => {
  const results = await Promise.all(items.map(fn));
  const firstErr = results.find((r) => isErr(r)) as AsyncErr<E> | undefined;
  if (firstErr) {
    return createAsyncResult<U[], E>(Promise.resolve({ ok: false as const, error: firstErr.error }));
  }
  return createAsyncResult<U[], E>(Promise.resolve({ ok: true as const, value: results.map((r) => (r as AsyncOk<U>).value) }));
};

/**
 * AllSettled - runs all async results in parallel, collecting all errors
 * @param results - The AsyncResults to run in parallel
 * @returns AsyncResult<[T[], E[]], E[]> - Tuple of [values, errors]
 */
export const allSettled = <T, E>(
  ...results: Array<AsyncResult<T, E>>
): AsyncResult<[T[], E[]], E[]> =>
  createAsyncResult<[T[], E[]], E[]>(
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
      return { ok: true as const, value: [values, errors] };
    })
  );

// =============================================================================
// SIGNAL HANDLING
// =============================================================================

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
    return createAsyncResult<T, E | AbortError>(Promise.resolve({ ok: false as const, error: AbortError() as E | AbortError }));
  }

  return createAsyncResult<T, E | AbortError>(
    new Promise((resolve) => {
      const abortHandler = () => {
        resolve({ ok: false as const, error: AbortError() as E | AbortError });
      };

      signal.addEventListener("abort", abortHandler, { once: true });

      result.then((r) => {
        // Remove the listener since the operation completed
        signal.removeEventListener("abort", abortHandler);
        resolve(r);
      });
    })
  );
};