/**
 * AsyncResult types - async version of Result
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
 * AsyncResult factory type (callable with static methods)
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
