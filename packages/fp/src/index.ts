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

export type { Error, ErrorGroup, ErrorOptions } from "./error/index.js";
export {
  error,
  exceptionGroup,
  raise,
  isError,
  isErrorGroup,
  getErrorMessage,
  flattenErrorGroup,
  filterErrorsByName,
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
export { swap, unwrap, mapErr } from "./result/index.js";
export { getOrElse as getOrElseResult, getOrCompute as getOrComputeResult } from "./result/index.js";
export { toNullable as toNullableResult, toUndefined as toUndefinedResult } from "./result/index.js";
export { all as allResult, traverse as traverseResult } from "./result/index.js";

// ============================================================================
// ASYNC RESULT (type exports - functions provided by unified API below)
// ============================================================================

export type { AsyncResultInner, AsyncOk, AsyncErr, AbortError, FromPromiseOptions } from "./async-result/index.js";
export { okAsync, errAsync } from "./async-result/index.js";
export { fromPromise, fromPromiseWithOptions, from, fromValue, fromError } from "./async-result/index.js";
export { isAbortError } from "./async-result/index.js";
export { unwrap as unwrapAsyncResult, unwrapOr as unwrapOrAsyncResult } from "./async-result/index.js";
export { getOrElse as getOrElseAsyncResult, getOrCompute as getOrComputeAsyncResult } from "./async-result/index.js";
export { mapErr as mapErrAsyncResult } from "./async-result/index.js";
export { toNullable as toNullableAsyncResult, toUndefined as toUndefinedAsyncResult } from "./async-result/index.js";
export { race, all as allAsync, allSettled, traverse as traverseAsync } from "./async-result/index.js";
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
import type { Result, Ok, Err } from "./result/index.js";
import type { AsyncResult } from "./async-result/index.js";
import type { Error } from "./error/types.js";

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
export type { TimeoutOptions, TimeoutError, SleepOptions, TimeoutCleanup, TimeoutResult } from "./sleep.js";

// ============================================================================
// YIELD
// ============================================================================

export { yieldControl as yield, immediate } from "./yield.js";

// ============================================================================
// RETRY
// ============================================================================

export { retryAsync, exponentialBackoff, linearBackoff, constantBackoff } from "./retry.js";
export type { RetryOptions, RetryAbortedError } from "./retry.js";

// ============================================================================
// PIPE & FLOW
// ============================================================================

export { pipe, flow, pipeAsync, flowAsync, tapAsync, tapSafe, reduce } from "./pipe.js";
