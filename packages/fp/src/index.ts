/**
 * @deessejs/fp - Functional programming patterns for TypeScript
 *
 * Types: Result, AsyncResult, Maybe
 * Constructs: Unit
 * Utilities: retry, sleep, attempt, attemptAsync, conversions
 *
 * Breaking Change (v3.x): Try type has been removed. Use:
 * - Result<T, E> instead of Try<T, E> for sync operations
 * - AsyncResult<T, E> instead of Promise<Try<T, E>> for async operations
 * - attempt() now returns Result<T, Error> (was Try<T, Error>)
 * - attemptAsync() now returns AsyncResult<T, Error> (was Promise<Try<T, Error>>)
 *
 * Unified API: Functions like map, flatMap, tap, etc. now work with both
 * Result and AsyncResult through TypeScript overloads
 */

// ============================================================================
// UNIT
// ============================================================================

export type { Unit } from "./unit.js";
export { unit, isUnit } from "./unit.js";

// ============================================================================
// ERROR SYSTEM
// ============================================================================

export type { Error, ErrorGroup, ErrorOptions, Panic } from "./error/index.js";
export {
  error,
  exceptionGroup,
  raise,
  isError,
  isErrorGroup,
  isPanic,
  getErrorMessage,
  flattenErrorGroup,
  filterErrorsByName,
  matchErrorPartial,
  panic,
} from "./error/index.js";

// ============================================================================
// MAYBE (separate API - doesn't share unified functions)
// ============================================================================

export type { Maybe, Some, None } from "./maybe/index.js";
export { some, none, fromNullable, isSome, isNone } from "./maybe/index.js";
export { map as mapMaybe, flatMap as flatMapMaybe, flatten as flattenMaybe } from "./maybe/index.js";
export { getOrElse as getOrElseMaybe, getOrCompute as getOrComputeMaybe } from "./maybe/index.js";
export { tap as tapMaybe, match as matchMaybe } from "./maybe/index.js";
export { toNullable as toNullableMaybe, toUndefined as toUndefinedMaybe } from "./maybe/index.js";
export { equals as equalsMaybe, equalsWith as equalsWithMaybe } from "./maybe/index.js";
export { all as allMaybe, filter as filterMaybe, traverse as traverseMaybe } from "./maybe/index.js";

// ============================================================================
// RESULT (type exports - functions provided by unified API below)
// ============================================================================

export type { Result, Ok, Err, Success, ExtractResultError } from "./result/index.js";
export { ok, err } from "./result/index.js";
export { getOrElse as getOrElseResult, getOrCompute as getOrComputeResult } from "./result/index.js";
export { toNullable as toNullableResult, toUndefined as toUndefinedResult } from "./result/index.js";
export { all as allResult, traverse as traverseResult } from "./result/index.js";

// ============================================================================
// ASYNC RESULT (type exports - functions provided by unified API below)
// ============================================================================

export type { AsyncResultInner, AsyncOk, AsyncErr, FromPromiseOptions } from "./async-result/index.js";
export { okAsync, errAsync } from "./async-result/index.js";
export { fromPromise, fromPromiseWithOptions, from, fromValue, fromError } from "./async-result/index.js";
export { isAbortError } from "./async-result/index.js";
export { unwrap as unwrapAsyncResult, unwrapOr as unwrapOrAsyncResult } from "./async-result/index.js";
export { getOrElse as getOrElseAsyncResult, getOrCompute as getOrComputeAsyncResult } from "./async-result/index.js";
export { mapErr as mapErrAsyncResult } from "./async-result/index.js";
export { toNullable as toNullableAsyncResult, toUndefined as toUndefinedAsyncResult } from "./async-result/index.js";
export { all as allAsync, traverse as traverseAsync } from "./async-result/index.js";
export { withSignal } from "./async-result/index.js";

// ============================================================================
// SUCCESS/ERROR ALIASES
// ============================================================================

export { ok as success } from "./result/index.js";
export { err as failure } from "./result/index.js";
export { ok as successAsync } from "./async-result/index.js";
export { err as failureAsync } from "./async-result/index.js";

// ============================================================================
// UNIFIED API - Functions with overloads for Result and AsyncResult
// ============================================================================

import * as ResultModule from "./result/index.js";
import * as AsyncResultModule from "./async-result/index.js";
import { some, none } from "./maybe/index.js";
import { toMaybeFromResult } from "./conversions.js";
import { type Result, type Ok, type Err } from "./result/index.js";
import { type AsyncResult, type AsyncResultInner } from "./async-result/index.js";
import { type Maybe } from "./maybe/index.js";
import { type Error } from "./error/types.js";

// Internal helper to check if value is AsyncResult (uses Thenable pattern)
const isAsyncResultValue = <T, E>(val: unknown): val is AsyncResult<T, E> =>
  typeof val === "object" && val !== null && "then" in val && "catch" in val;

/**
 * Unified map function - works with both Result and AsyncResult
 */
export function map<T, U, E extends Error>(res: Result<T, E>, fn: (val: T) => U): Result<U, E>;
export function map<T, U, E extends Error>(res: AsyncResult<T, E>, fn: (val: T) => U | Promise<U>): AsyncResult<U, E>;
export function map<T, U, E extends Error>(res: Result<T, E> | AsyncResult<T, E>, fn: (val: T) => U | Promise<U>): Result<U, E> | AsyncResult<U, E> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.map(res, fn) as AsyncResult<U, E>;
  }
  return ResultModule.map(res, fn) as Result<U, E>;
}

/**
 * Unified flatMap function - works with both Result and AsyncResult
 */
export function flatMap<T, U, E extends Error>(res: Result<T, E>, fn: (val: T) => Result<U, E>): Result<U, E>;
export function flatMap<T, U, E extends Error>(res: AsyncResult<T, E>, fn: (val: T) => AsyncResult<U, E>): AsyncResult<U, E>;
export function flatMap<T, U, E extends Error>(res: Result<T, E> | AsyncResult<T, E>, fn: (val: T) => Result<U, E> | AsyncResult<U, E>): Result<U, E> | AsyncResult<U, E> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.flatMap(res, fn as (val: T) => AsyncResult<U, E>) as AsyncResult<U, E>;
  }
  return ResultModule.flatMap(res, fn as (val: T) => Result<U, E>) as Result<U, E>;
}

/**
 * Unified tap function - works with both Result and AsyncResult
 */
export function tap<T, E extends Error>(res: Result<T, E>, fn: (val: T) => void): Result<T, E>;
export function tap<T, E extends Error>(res: AsyncResult<T, E>, fn: (val: T) => void): AsyncResult<T, E>;
export function tap<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>, fn: (val: T) => void): Result<T, E> | AsyncResult<T, E> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.tap(res, fn);
  }
  return ResultModule.tap(res, fn);
}

/**
 * Unified tapErr function - works with both Result and AsyncResult
 */
export function tapErr<T, E extends Error>(res: Result<T, E>, fn: (err: E) => void): Result<T, E>;
export function tapErr<T, E extends Error>(res: AsyncResult<T, E>, fn: (err: E) => void): AsyncResult<T, E>;
export function tapErr<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>, fn: (err: E) => void): Result<T, E> | AsyncResult<T, E> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.tapErr(res, fn);
  }
  return ResultModule.tapErr(res, fn);
}

/**
 * Unified getOrElse function - works with both Result and AsyncResult
 */
export function getOrElse<T, E extends Error>(res: Result<T, E>, defaultValue: T): T;
export function getOrElse<T, E extends Error>(res: AsyncResult<T, E>, defaultValue: T): Promise<T>;
// eslint-disable-next-line sonarjs/function-return-type -- Unified API intentionally returns different types based on input
export function getOrElse<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>, defaultValue: T): T | Promise<T> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.getOrElse(res, defaultValue);
  }
  return ResultModule.getOrElse(res, defaultValue);
}

/**
 * Unified match function - works with both Result and AsyncResult
 */
export function match<T, U, E extends Error>(res: Result<T, E>, onOk: (val: T) => U, onErr: (err: E) => U): U;
export function match<T, U, E extends Error>(res: AsyncResult<T, E>, onOk: (val: T) => U, onErr: (err: E) => U): Promise<U>;
// eslint-disable-next-line sonarjs/function-return-type -- Unified API intentionally returns different types based on input
export function match<T, U, E extends Error>(res: Result<T, E> | AsyncResult<T, E>, onOk: (val: T) => U, onErr: (err: E) => U): U | Promise<U> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.match(res, onOk, onErr);
  }
  return ResultModule.match(res, onOk, onErr);
}

/**
 * Unified isOk type guard - works with both Result and AsyncResult
 */
export function isOk<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>): res is Ok<T, E> {
  if (isAsyncResultValue<T, E>(res)) {
    return false;
  }
  return res.ok === true;
}

/**
 * Unified isErr type guard - works with both Result and AsyncResult
 */
export function isErr<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>): res is Err<E> {
  if (isAsyncResultValue<T, E>(res)) {
    return false;
  }
  return res.ok === false;
}

/**
 * Type guard to check if value is AsyncResult
 */
export function isAsyncResult<T, E extends Error>(val: unknown): val is AsyncResult<T, E> {
  return isAsyncResultValue<T, E>(val);
}

/**
 * Unified mapErr function - works with both Result and AsyncResult
 */
export function mapErr<T, E extends Error, F extends Error>(res: Result<T, E>, fn: (error: E) => F): Result<T, F>;
export function mapErr<T, E extends Error, F extends Error>(res: AsyncResult<T, E>, fn: (error: E) => F): AsyncResult<T, F>;
export function mapErr<T, E extends Error, F extends Error>(res: Result<T, E> | AsyncResult<T, E>, fn: (error: E) => F): Result<T, F> | AsyncResult<T, F> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.mapErr(res, fn);
  }
  return ResultModule.mapErr(res, fn);
}

/**
 * Unified tapBoth function - works with both Result and AsyncResult
 */
export function tapBoth<T, E extends Error>(res: Result<T, E>, handlers: { ok: (value: T) => void; err: (error: E) => void }): Result<T, E>;
export function tapBoth<T, E extends Error>(res: AsyncResult<T, E>, handlers: { ok: (value: T) => void; err: (error: E) => void }): AsyncResult<T, E>;
export function tapBoth<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>, handlers: { ok: (value: T) => void; err: (error: E) => void }): Result<T, E> | AsyncResult<T, E> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.tapBoth(res, handlers);
  }
  return ResultModule.tapBoth(res, handlers);
}

/**
 * Unified getOrCompute function - works with both Result and AsyncResult
 */
export function getOrCompute<T, E extends Error, U>(res: Result<T, E>, fn: () => U): T | U;
export function getOrCompute<T, E extends Error, U>(res: AsyncResult<T, E>, fn: () => U | Promise<U>): Promise<T | U>;
// eslint-disable-next-line sonarjs/function-return-type -- Unified API intentionally returns different types based on input
export function getOrCompute<T, E extends Error, U>(res: Result<T, E> | AsyncResult<T, E>, fn: () => U | Promise<U>): T | U | Promise<T | U> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.getOrCompute(res, fn);
  }
  return ResultModule.getOrCompute(res, fn);
}

/**
 * Unified unwrap function - works with both Result and AsyncResult
 */
export function unwrap<T, E extends Error>(res: Result<T, E>): T;
export function unwrap<T, E extends Error>(res: AsyncResult<T, E>): Promise<T>;
// eslint-disable-next-line sonarjs/function-return-type -- Unified API intentionally returns different types based on input
export function unwrap<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>): T | Promise<T> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.unwrap(res);
  }
  return ResultModule.unwrap(res);
}

/**
 * Unified unwrapOr function - works with both Result and AsyncResult
 */
export function unwrapOr<T, E extends Error>(res: Result<T, E>, defaultValue: T): T;
export function unwrapOr<T, E extends Error>(res: AsyncResult<T, E>, defaultValue: T): Promise<T>;
// eslint-disable-next-line sonarjs/function-return-type -- Unified API intentionally returns different types based on input
export function unwrapOr<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>, defaultValue: T): T | Promise<T> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.unwrapOr(res, defaultValue);
  }
  return ResultModule.getOrElse(res, defaultValue);
}

/**
 * Unified unwrapOrCompute function - works with both Result and AsyncResult
 */
export function unwrapOrCompute<T, E extends Error>(res: Result<T, E>, fn: () => T): T;
export function unwrapOrCompute<T, E extends Error>(res: AsyncResult<T, E>, fn: () => T | Promise<T>): Promise<T>;
// eslint-disable-next-line sonarjs/function-return-type -- Unified API intentionally returns different types based on input
export function unwrapOrCompute<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>, fn: () => T): T | Promise<T> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.unwrapOrCompute(res as AsyncResult<T, E>, fn);
  }
  return ResultModule.getOrCompute(res as Result<T, E>, fn);
}

/**
 * Unified orElse function - works with both Result and AsyncResult
 * Transforms the error to a new result when the result is Err
 */
export function orElse<T, E extends Error, U>(res: Result<T, E>, fn: (error: E) => Result<U, E>): Result<U, E>;
export function orElse<T, E extends Error, U>(res: AsyncResult<T, E>, fn: (error: E) => AsyncResult<U, E>): AsyncResult<U, E>;
export function orElse<T, E extends Error, U>(res: Result<T, E> | AsyncResult<T, E>, fn: (error: E) => Result<U, E> | AsyncResult<U, E>): Result<U, E> | AsyncResult<U, E> {
  if (isAsyncResultValue<T, E>(res)) {
    return (res as AsyncResult<T, E>).then(
      (r) => (r.ok ? r : fn(r.error)) as unknown as AsyncResultInner<U, E>,
      (error) => { throw error; }
    ) as unknown as AsyncResult<U, E>;
  }
  // For sync Result, pass through if Ok, apply fn if Err
  if (res.ok) {
    return res as unknown as Result<U, E>;
  }
  return fn(res.error);
}

/**
 * Unified swap function - works with both Result and AsyncResult
 */
export function swap<T, E extends Error>(res: Result<T, E>): unknown;
export function swap<T, E extends Error>(res: AsyncResult<T, E>): AsyncResult<E, T>;
export function swap<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>): unknown {
  if (isAsyncResultValue<T, E>(res)) {
    // For AsyncResult, swap creates an AsyncResult with swapped types
    return createAsyncResultFromSwap(res);
  }
  return ResultModule.swap(res);
}

/**
 * Helper to create swapped AsyncResult
 */
const createAsyncResultFromSwap = <T, E>(res: AsyncResult<T, E>): AsyncResult<E, T> => {
  return res.then((r) => {
    if (r.ok) {
      return { ok: false as const, error: r.value as T };
    }
    return { ok: true as const, value: r.error as E };
  }) as unknown as AsyncResult<E, T>;
};

/**
 * Unified toNullable function - works with both Result and AsyncResult
 */
export function toNullable<T, E extends Error>(res: Result<T, E>): T | null;
export function toNullable<T, E extends Error>(res: AsyncResult<T, E>): Promise<T | null>;
// eslint-disable-next-line sonarjs/function-return-type -- Unified API intentionally returns different types based on input
export function toNullable<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>): T | null | Promise<T | null> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.toNullable(res);
  }
  return ResultModule.toNullable(res);
}

/**
 * Unified toUndefined function - works with both Result and AsyncResult
 */
export function toUndefined<T, E extends Error>(res: Result<T, E>): T | undefined;
export function toUndefined<T, E extends Error>(res: AsyncResult<T, E>): Promise<T | undefined>;
// eslint-disable-next-line sonarjs/function-return-type -- Unified API intentionally returns different types based on input
export function toUndefined<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>): T | undefined | Promise<T | undefined> {
  if (isAsyncResultValue<T, E>(res)) {
    return AsyncResultModule.toUndefined(res);
  }
  return ResultModule.toUndefined(res);
}

/**
 * Unified toMaybe function - works with both Result and AsyncResult
 */
export function toMaybe<T, E extends Error>(res: Result<T, E>): Maybe<T>;
export function toMaybe<T, E extends Error>(res: AsyncResult<T, E>): Promise<Maybe<T>>;
// eslint-disable-next-line sonarjs/function-return-type -- Unified API intentionally returns different types based on input
export function toMaybe<T, E extends Error>(res: Result<T, E> | AsyncResult<T, E>): Maybe<T> | Promise<Maybe<T>> {
  if (isAsyncResultValue<T, E>(res)) {
    return (res as AsyncResult<T, E>).then((r: AsyncResultInner<T, E>) =>
      r.ok ? some(r.value as NonNullable<T>) : none()
    );
  }
  return toMaybeFromResult(res);
}

/**
 * Unified all function - works with both Result and AsyncResult
 */
export function all<T, E extends Error>(...results: Array<Result<T, E>>): Result<T[], E>;
export function all<T, E extends Error>(...results: Array<AsyncResult<T, E>>): AsyncResult<T[], E>;
export function all<T, E extends Error>(...results: Array<Result<T, E> | AsyncResult<T, E>>): Result<T[], E> | AsyncResult<T[], E> {
  if (results.length === 0) {
    return ResultModule.all();
  }
  if (isAsyncResultValue<T, E>(results[0])) {
    return AsyncResultModule.all(...results as Array<AsyncResult<T, E>>);
  }
  return ResultModule.all(...results as Array<Result<T, E>>);
}

/**
 * Unified race function - works with AsyncResult only (sync Result has no race)
 */
export function race<T, E extends Error>(...results: Array<AsyncResult<T, E>>): Promise<T> {
  return AsyncResultModule.race(...results);
}

/**
 * Unified traverse function - works with both Result and AsyncResult
 */
export function traverse<T, U, E extends Error>(items: readonly T[], fn: (item: T) => Result<U, E>): Result<U[], E>;
export function traverse<T, U, E extends Error>(items: readonly T[], fn: (item: T) => AsyncResult<U, E>): Promise<AsyncResult<U[], E>>;
export function traverse<T, U, E extends Error>(items: readonly T[], fn: (item: T) => Result<U, E> | AsyncResult<U, E>): Result<U[], E> | Promise<AsyncResult<U[], E>> {
  const firstResult = items.length > 0 ? fn(items[0]) : null;
  if (firstResult === null) {
    return ResultModule.traverse(items, fn as (item: T) => Result<U, E>);
  }
  if (isAsyncResultValue<U, E>(firstResult)) {
    return AsyncResultModule.traverse([...items], fn as (item: T) => AsyncResult<U, E>);
  }
  return ResultModule.traverse(items, fn as (item: T) => Result<U, E>);
}

/**
 * Unified allSettled function - works with AsyncResult only (sync Result uses all)
 */
export function allSettled<T, E extends Error>(...results: Array<AsyncResult<T, E>>): AsyncResult<[T[], E[]], E[]> {
  return AsyncResultModule.allSettled(...results);
}

// ============================================================================
// ATTEMPT (formerly Try)
// ============================================================================

export { attempt, attemptAsync } from "./try/index.js";

// ============================================================================
// CONVERSIONS
// ============================================================================

export {
  toResult,
  fromMaybe,
  toMaybeFromResult,
  fromResult,
  resultFromNullable,
  resultFromThrowable,
} from "./conversions.js";
export type { ToResultOptions } from "./conversions.js";

// ============================================================================
// SLEEP
// ============================================================================

export { sleep, withTimeout, sleepWithSignal, addJitter } from "./sleep.js";
export type { SleepOptions, TimeoutCleanup, TimeoutResult } from "./sleep.js";

// ============================================================================
// TIMEOUT
// ============================================================================

export { timeout, TimeoutError, AbortError } from "./timeout.js";
export type { TimeoutOptions, TimeoutInfo } from "./timeout.js";

// ============================================================================
// YIELD
// ============================================================================

export { yieldControl as yield, immediate } from "./yield.js";

// ============================================================================
// RETRY
// ============================================================================

export { retryPolicy, retry, retryAsyncPolicy, retryAsync, exponentialBackoff, linearBackoff, constantBackoff } from "./retry.js";
export type { RetryOptions, RetryPolicy, RetryPolicyOptions, RetryHooks, JitterConfig } from "./retry.js";
export { RetryAbortedError, RetryTimeoutError } from "./retry.js";

// ============================================================================
// PIPE & FLOW
// ============================================================================

export { pipe, flow, pipeAsync, flowAsync, tapAsync, tapSafe, reduce } from "./pipe.js";
export { dual, debounce, throttle, memoize } from "./pipe.js";
export type { DebounceOptions, ThrottleOptions, MemoizeOptions } from "./pipe.js";
