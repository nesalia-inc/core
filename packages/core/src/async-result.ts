/**
 * AsyncResult type - async version of Result
 * Used for chaining asynchronous operations with proper error handling
 */

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
 * AsyncResult class - Thenable wrapper for async operations
 * Provides fluent chaining without intermediate await calls
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error
 */
export class AsyncResult<T, E = Error> {
  private readonly promise: Promise<AsyncResultInner<T, E>>;

  /**
   * Creates a new AsyncResult from a promise
   * @param promise - The promise to wrap
   */
  constructor(promise: Promise<AsyncResultInner<T, E>>) {
    this.promise = promise;
  }

  /**
   * Check if the AsyncResult is an Ok (synchronous check)
   * Note: This returns undefined if the promise hasn't resolved yet
   */
  get ok(): boolean | undefined {
    return undefined;
  }

  /**
   * Get the value if Ok (synchronous check)
   * Note: This throws if the promise hasn't resolved yet or if Err
   */
  get value(): T {
    throw new Error("Cannot synchronously access value - use await or .then()");
  }

  /**
   * Get the error if Err (synchronous check)
   * Note: This throws if the promise hasn't resolved yet or if Ok
   */
  get error(): E {
    throw new Error("Cannot synchronously access error - use await or .then()");
  }

  /**
   * Thenable implementation - allows using await directly
   * When awaited, resolves to the inner result (never throws)
   */
  then<TResult1 = AsyncResultInner<T, E>, TResult2 = never>(
    onfulfilled?: (value: AsyncResultInner<T, E>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: E) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(
      (result) => {
        // Always resolve (never reject) - treat errors as values
        if (onfulfilled) {
          return onfulfilled(result);
        }
        return result as unknown as TResult1;
      },
      (reason) => {
        // Handle promise rejection - resolve with error as value
        if (onrejected) {
          return onrejected(reason);
        }
        // If no onrejected handler, resolve with the reason as a value
        return reason as unknown as TResult2;
      }
    );
  }

  /**
   * Catch handler - catches errors from the inner promise
   */
  catch<U = AsyncResultInner<T, E>>(
    onrejected?: (error: E) => U | PromiseLike<U>
  ): Promise<AsyncResultInner<T, E> | U> {
    return this.promise.catch((error) => {
      if (onrejected) {
        return onrejected(error as E);
      }
      throw error;
    });
  }

  /**
   * Finally handler
   */
  finally(onfinally?: () => void): Promise<AsyncResultInner<T, E>> {
    return this.promise.finally(onfinally);
  }

  /**
   * Maps the value if AsyncOk, returns AsyncErr otherwise
   * @param fn - The mapping function
   * @returns New AsyncResult with mapped value
   */
  map<U>(fn: (value: T) => U): AsyncResult<U, E> {
    return new AsyncResult<U, E>(
      this.promise.then((result) =>
        result.ok ? { ok: true as const, value: fn(result.value) } : result
      )
    );
  }

  /**
   * Maps the error if AsyncErr, returns AsyncOk otherwise
   * @param fn - The error mapping function
   * @returns New AsyncResult with mapped error
   */
  mapErr<F>(fn: (error: E) => F): AsyncResult<T, F> {
    return new AsyncResult<T, F>(
      this.promise.then((result) =>
        result.ok ? result : { ok: false as const, error: fn(result.error) }
      )
    );
  }

  /**
   * Chains AsyncResults - function returns AsyncResult if AsyncOk
   * @param fn - The chaining function
   * @returns Chained AsyncResult
   */
  flatMap<U>(fn: (value: T) => AsyncResult<U, E>): AsyncResult<U, E> {
    return new AsyncResult<U, E>(
      this.promise.then((result) => (result.ok ? fn(result.value) : result))
    );
  }

  /**
   * Chains AsyncResults with async function
   * @param fn - The async chaining function
   * @returns Chained AsyncResult
   */
  flatMapAsync<U>(fn: (value: T) => Promise<AsyncResultInner<U, E>>): AsyncResult<U, E> {
    return new AsyncResult<U, E>(
      this.promise.then(async (result) =>
        result.ok ? await fn(result.value) : result
      )
    );
  }

  /**
   * Gets the value or a default
   * @param defaultValue - The default value
   * @returns Promise resolving to value or default
   */
  getOrElse(defaultValue: T): Promise<T> {
    return this.promise.then((result) => (result.ok ? result.value : defaultValue));
  }

  /**
   * Gets the value or computes a default
   * @param fn - The function to compute default
   * @returns Promise resolving to value or computed default
   */
  getOrCompute(fn: () => T | Promise<T>): Promise<T> {
    return this.promise.then((result) => (result.ok ? result.value : fn()));
  }

  /**
   * Performs a side effect without changing the value
   * @param fn - The side effect function
   * @returns Same AsyncResult for chaining
   */
  tap(fn: (value: T) => void): AsyncResult<T, E> {
    return new AsyncResult<T, E>(
      this.promise.then((result) => {
        if (result.ok) {
          fn(result.value);
        }
        return result;
      })
    );
  }

  /**
   * Performs a side effect on error without changing the value
   * @param fn - The error side effect function
   * @returns Same AsyncResult for chaining
   */
  tapErr(fn: (error: E) => void): AsyncResult<T, E> {
    return new AsyncResult<T, E>(
      this.promise.then((result) => {
        if (!result.ok) {
          fn(result.error);
        }
        return result;
      })
    );
  }

  /**
   * Matches both AsyncOk and AsyncErr cases
   * @param ok - Function to handle AsyncOk
   * @param err - Function to handle AsyncErr
   * @returns Promise resolving to result of the handler
   */
  match<U>(ok: (value: T) => U, err: (error: E) => U): Promise<U> {
    return this.promise.then((result) => (result.ok ? ok(result.value) : err(result.error)));
  }

  /**
   * Converts AsyncResult to a nullable value
   * @returns Promise resolving to value or null
   */
  toNullable(): Promise<T | null> {
    return this.promise.then((result) => (result.ok ? result.value : null));
  }

  /**
   * Converts AsyncResult to an undefined-able value
   * @returns Promise resolving to value or undefined
   */
  toUndefined(): Promise<T | undefined> {
    return this.promise.then((result) => (result.ok ? result.value : undefined));
  }

  /**
   * Unwraps the AsyncResult, throwing if error
   * @returns Promise resolving to the value
   */
  async unwrap(): Promise<T> {
    const result = await this.promise;
    if (result.ok) {
      return result.value;
    }
    throw result.error;
  }

  /**
   * Unwraps the AsyncResult, returning default if error
   * @param defaultValue - The default value
   * @returns Promise resolving to the value or default
   */
  unwrapOr(defaultValue: T): Promise<T> {
    return this.getOrElse(defaultValue);
  }

  /**
   * Converts to the underlying Promise for PromiseLike behavior
   * Use this when you need to await the AsyncResult
   * @returns Promise<AsyncResultInner<T, E>>
   */
  toPromise(): Promise<AsyncResultInner<T, E>> {
    return this.promise;
  }

  // Make the class iterable by returning the promise when spread
  // This allows: const [ok, value] = await asyncResult

  /**
   * Creates an async Ok (success result)
   * @param value - The success value
   * @returns AsyncResult<T, never>
   */
  static ok<T>(value: T): AsyncResult<T, never> {
    return new AsyncResult<T, never>(
      Promise.resolve({
        ok: true as const,
        value,
      })
    );
  }

  /**
   * Creates an async Err (error result)
   * @param error - The error value
   * @returns AsyncResult<never, E>
   */
  static err<E>(error: E): AsyncResult<never, E> {
    return new AsyncResult<never, E>(
      Promise.resolve({
        ok: false as const,
        error,
      })
    );
  }

  /**
   * Creates an AsyncResult from a Promise
   * @param promise - The promise to convert
   * @returns AsyncResult<T, Error>
   */
  static fromPromise<T>(promise: Promise<T>): AsyncResult<T, Error> {
    return new AsyncResult<T, Error>(
      promise
        .then((value) => ({ ok: true as const, value }))
        .catch((error) => ({
          ok: false as const,
          error: error instanceof Error ? error : new Error(String(error)),
        }))
    );
  }

  /**
   * Creates AsyncResult from a Promise that may already have the Result shape
   * @param promise - The promise to convert
   * @returns AsyncResult<T, E>
   */
  static from<T, E>(promise: Promise<AsyncResultInner<T, E>>): AsyncResult<T, E> {
    return new AsyncResult<T, E>(promise);
  }

  /**
   * Creates AsyncResult that resolves after delay
   * @param value - The value to resolve with
   * @param ms - Delay in milliseconds
   * @returns AsyncResult<T, never>
   */
  static fromValue<T>(value: T, ms = 0): AsyncResult<T, never> {
    return new AsyncResult<T, never>(
      new Promise((resolve) => setTimeout(() => resolve({ ok: true as const, value }), ms))
    );
  }

  /**
   * Creates AsyncResult that rejects after delay
   * @param error - The error to reject with
   * @param ms - Delay in milliseconds
   * @returns AsyncResult<never, E>
   */
  static fromError<E>(error: E, ms = 0): AsyncResult<never, E> {
    return new AsyncResult<never, E>(
      new Promise((resolve) => setTimeout(() => resolve({ ok: false as const, error }), ms))
    );
  }
}

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
 * @returns AsyncResult<T, Error>
 */
export const fromPromise = <T>(promise: Promise<T>): AsyncResult<T, Error> =>
  AsyncResult.fromPromise(promise);

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
): AsyncResult<U, E> => result.map(fn);

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
): AsyncResult<U, E> => result.flatMap(fn);

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
  new AsyncResult<T[], E>(
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
    return new AsyncResult<U[], E>(Promise.resolve({ ok: false as const, error: firstErr.error }));
  }
  return new AsyncResult<U[], E>(Promise.resolve({ ok: true as const, value: results.map((r) => (r as AsyncOk<U>).value) }));
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
  new AsyncResult<[T[], E[]], E[]>(
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
  result.toUndefined();

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
