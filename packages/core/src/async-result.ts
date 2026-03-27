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
 * Inner type for AsyncResult
 */
export type AsyncResultInner<T, E> = AsyncOk<T> | AsyncErr<E>;

/**
 * Type for AsyncResult instance methods
 */
export interface AsyncResultInstance<T, E> {
  /** Check if AsyncOk (always undefined before resolution) */
  readonly ok: boolean | undefined;
  /** Get the value (throws before resolution) */
  readonly value: T;
  /** Get the error (throws before resolution) */
  readonly error: E;
  /** Thenable implementation - allows using await directly */
  then<TResult1 = AsyncResultInner<T, E>, TResult2 = never>(
    onfulfilled?: (value: AsyncResultInner<T, E>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: E) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2>;
  /** Catch handler */
  catch<U = AsyncResultInner<T, E>>(
    onrejected?: (error: E) => U | PromiseLike<U>
  ): Promise<AsyncResultInner<T, E> | U>;
  /** Finally handler */
  finally(onfinally?: () => void): Promise<AsyncResultInner<T, E>>;
  /** Maps the value if AsyncOk, returns AsyncErr otherwise */
  map<U>(fn: (value: T) => U | Promise<U>): AsyncResult<U, E>;
  /** Maps the error if AsyncErr, returns AsyncOk otherwise */
  mapErr<F>(fn: (error: E) => F): AsyncResult<T, F>;
  /** Chains AsyncResults - function returns AsyncResult if AsyncOk */
  flatMap<U>(fn: (value: T) => AsyncResult<U, E> | Promise<AsyncResultInner<U, E>>): AsyncResult<U, E>;
  /** Chains AsyncResults with async function */
  flatMapAsync<U>(fn: (value: T) => Promise<AsyncResultInner<U, E>>): AsyncResult<U, E>;
  /** Gets the value or a default */
  getOrElse(defaultValue: T): Promise<T>;
  /** Gets the value or computes a default */
  getOrCompute(fn: () => T | Promise<T>): Promise<T>;
  /** Performs a side effect without changing the value */
  tap(fn: (value: T) => void): AsyncResult<T, E>;
  /** Performs a side effect on error without changing the value */
  tapErr(fn: (error: E) => void): AsyncResult<T, E>;
  /** Matches both AsyncOk and AsyncErr cases */
  match<U>(ok: (value: T) => U, err: (error: E) => U): Promise<U>;
  /** Converts AsyncResult to a nullable value */
  toNullable(): Promise<T | null>;
  /** Converts AsyncResult to an undefined-able value */
  toUndefined(): Promise<T | undefined>;
  /** Unwraps the AsyncResult, throwing if error */
  unwrap(): Promise<T>;
  /** Unwraps the AsyncResult, returning default if error */
  unwrapOr(defaultValue: T): Promise<T>;
  /** Converts to the underlying Promise */
  toPromise(): Promise<AsyncResultInner<T, E>>;
}

/**
 * AsyncResult function type (callable factory)
 */
export interface AsyncResultFactory {
  <T, E = Error>(promise: Promise<AsyncResultInner<T, E>>): AsyncResult<T, E>;
  /** Creates an async Ok (success result) */
  ok<T>(value: T): AsyncResult<T, never>;
  /** Creates an async Err (error result) */
  err<E>(error: E): AsyncResult<never, E>;
  /** Creates an AsyncResult from a Promise */
  fromPromise<T>(promise: Promise<T>): AsyncResult<T, Error>;
  /** Creates AsyncResult from a Promise that may already have the Result shape */
  from<T, E>(promise: Promise<AsyncResultInner<T, E>>): AsyncResult<T, E>;
  /** Creates AsyncResult that resolves after delay */
  fromValue<T>(value: T, ms?: number): AsyncResult<T, never>;
  /** Creates AsyncResult that rejects after delay */
  fromError<E>(error: E, ms?: number): AsyncResult<never, E>;
}

/**
 * AsyncResult type - Thenable wrapper for async operations
 * Provides fluent chaining without intermediate await calls
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error
 */
export type AsyncResult<T, E = Error> = AsyncResultInstance<T, E> & {
  /** Internal promise for Thenable implementation */
  readonly [Symbol.toStringTag]: "AsyncResult";
};

/**
 * Creates a new AsyncResult from a promise
 * @param promise - The promise to wrap
 */
function createAsyncResult<T, E>(
  promise: Promise<AsyncResultInner<T, E>>
): AsyncResult<T, E> {
  const obj: AsyncResult<T, E> = {
    ok: undefined,
    get value(): T {
      throw new Error("Cannot synchronously access value - use await or .then()");
    },
    get error(): E {
      throw new Error("Cannot synchronously access error - use await or .then()");
    },
    [Symbol.toStringTag]: "AsyncResult",

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

    map<U>(fn: (value: T) => U | Promise<U>): AsyncResult<U, E> {
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

    mapErr<F>(fn: (error: E) => F): AsyncResult<T, F> {
      return createAsyncResult<T, F>(
        promise.then((result) =>
          result.ok ? result : { ok: false as const, error: fn(result.error) }
        )
      );
    },

    flatMap<U>(
      fn: (value: T) => AsyncResult<U, E> | Promise<AsyncResultInner<U, E>>
    ): AsyncResult<U, E> {
      return createAsyncResult<U, E>(
        promise.then(async (result) => {
          if (!result.ok) return result;
          const next = await Promise.resolve(fn(result.value));
          // If fn returned an AsyncResult (which is Thenable), await it
          if (next && typeof next === "object" && "ok" in next) {
            return next as AsyncResultInner<U, E>;
          }
          return next as AsyncResultInner<U, E>;
        })
      );
    },

    flatMapAsync<U>(fn: (value: T) => Promise<AsyncResultInner<U, E>>): AsyncResult<U, E> {
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

    tap(fn: (value: T) => void): AsyncResult<T, E> {
      return createAsyncResult<T, E>(
        promise.then((result) => {
          if (result.ok) {
            fn(result.value);
          }
          return result;
        })
      );
    },

    tapErr(fn: (error: E) => void): AsyncResult<T, E> {
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

  return obj;
}

/**
 * AsyncResult factory function with static methods
 */
const AsyncResultFn: AsyncResultFactory = Object.assign(createAsyncResult, {
  ok<T>(value: T): AsyncResult<T, never> {
    return createAsyncResult<T, never>(
      Promise.resolve({
        ok: true as const,
        value,
      })
    );
  },

  err<E>(error: E): AsyncResult<never, E> {
    return createAsyncResult<never, E>(
      Promise.resolve({
        ok: false as const,
        error,
      })
    );
  },

  fromPromise<T>(promise: Promise<T>): AsyncResult<T, Error> {
    return createAsyncResult<T, Error>(
      promise
        .then((value) => ({ ok: true as const, value }))
        .catch((error) => ({
          ok: false as const,
          error: error instanceof Error ? error : new Error(String(error)),
        }))
    );
  },

  from<T, E>(promise: Promise<AsyncResultInner<T, E>>): AsyncResult<T, E> {
    return createAsyncResult<T, E>(promise);
  },

  fromValue<T>(value: T, ms = 0): AsyncResult<T, never> {
    return createAsyncResult<T, never>(
      new Promise((resolve) => setTimeout(() => resolve({ ok: true as const, value }), ms))
    );
  },

  fromError<E>(error: E, ms = 0): AsyncResult<never, E> {
    return createAsyncResult<never, E>(
      new Promise((resolve) => setTimeout(() => resolve({ ok: false as const, error }), ms))
    );
  },
});

/**
 * AsyncResult - Thenable wrapper for async operations
 */
export const AsyncResult: AsyncResultFactory = AsyncResultFn;

/**
 * Creates an async Ok (success result)
 * @param value - The success value
 * @returns AsyncResult<T, never>
 */
export const okAsync = <T>(value: T): AsyncResult<T, never> => AsyncResult.ok(value);

/**
 * Creates an async Err (error result)
 * @param error - The error value
 * @returns AsyncResult<never, E>
 */
export const errAsync = <E>(error: E): AsyncResult<never, E> => AsyncResult.err(error);

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
    return AsyncResult(
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
    const error = new Error("Operation aborted") as AbortError;
    error.name = "AbortError";
    return AsyncResult(Promise.resolve({ ok: false as const, error: error as E }));
  }

  return AsyncResult(
    new Promise((resolve) => {
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
/**
 * Maps the value of AsyncResult if AsyncOk (handles both sync and async functions)
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the mapped value
 * @param result - The AsyncResult to map
 * @param fn - The mapping function (sync or async)
 * @returns AsyncResult<U, E>
 */
export const map = <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => U | Promise<U>
): AsyncResult<U, E> => {
  // Use class method for sync functions, wrap for async
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
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the chained value
 * @param result - The AsyncResult to chain
 * @param fn - The chaining function (sync or async)
 * @returns AsyncResult of the function if AsyncOk, AsyncErr otherwise
 */
export const flatMap = <T, E, U>(
  result: AsyncResult<T, E>,
  fn: (value: T) => AsyncResult<U, E> | Promise<AsyncResult<U, E>>
): AsyncResult<U, E> => result.flatMap(fn as (value: T) => AsyncResult<U, E>);

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
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam U - The type of the chained value
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

/**
 * Gets the value or a default
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult
 * @param defaultValue - The default value
 * @returns The value if AsyncOk, default otherwise
 */
export const getOrElse = <T, E>(result: AsyncResult<T, E>, defaultValue: T): Promise<T> =>
  result.getOrElse(defaultValue);

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
  result.tap(fn);

/**
 * Performs a side effect on error without changing the value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult to inspect
 * @param fn - The error side effect function
 * @returns The same AsyncResult
 */
export const tapErr = <T, E>(result: AsyncResult<T, E>, fn: (error: E) => void): AsyncResult<T, E> =>
  result.tapErr(fn);

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
): Promise<U> => result.match(ok, err);

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
  AsyncResult<T[], E>(
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
): Promise<AsyncResult<U[], E>> => {
  const results = await Promise.all(items.map(fn));
  const firstErr = results.find((r) => isErr(r)) as AsyncErr<E> | undefined;
  if (firstErr) {
    return AsyncResult<U[], E>(Promise.resolve({ ok: false as const, error: firstErr.error }));
  }
  return AsyncResult<U[], E>(Promise.resolve({ ok: true as const, value: results.map((r) => (r as AsyncOk<U>).value) }));
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
  AsyncResult<[T[], E[]], E[]>(
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

/**
 * Converts AsyncResult to a nullable value
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult to convert
 * @returns Promise<T | null>
 */
export const toNullable = <T, E>(result: AsyncResult<T, E>): Promise<T | null> =>
  result.toNullable();

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
    return AsyncResult(Promise.resolve({ ok: false as const, error }));
  }

  return AsyncResult(
    new Promise((resolve) => {
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
    })
  );
};

/**
 * Maps the error of AsyncResult if AsyncErr, returns AsyncOk otherwise
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @typeParam F - The type of the mapped error
 * @param result - The AsyncResult to map
 * @param fn - The error mapping function
 * @returns AsyncResult<T, F>
 */
export const mapErr = <T, E, F>(
  result: AsyncResult<T, E>,
  fn: (error: E) => F
): AsyncResult<T, F> => result.mapErr(fn);

/**
 * Unwraps the AsyncResult, throwing if error
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult to unwrap
 * @returns Promise resolving to the value
 */
export const unwrap = async <T, E>(result: AsyncResult<T, E>): Promise<T> => result.unwrap();

/**
 * Unwraps the AsyncResult, returning default if error
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param result - The AsyncResult to unwrap
 * @param defaultValue - The default value
 * @returns Promise resolving to the value or default
 */
export const unwrapOr = <T, E>(result: AsyncResult<T, E>, defaultValue: T): Promise<T> =>
  result.unwrapOr(defaultValue);
