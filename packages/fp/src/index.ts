/**
 * @deessejs/fp - Functional programming patterns for TypeScript
 *
 * Types: Result, Maybe
 * Constructs: Unit
 * Utilities: retry, sleep, try, conversions
 */

// Unit
export type { Unit } from "./unit.js";
export { unit, isUnit } from "./unit.js";

// Re-export all types
export type { Maybe, Some, None } from "./maybe";
export type { Result, Ok, Err, Success, ExtractResultError } from "./result";
export type { ExtractError, ErrorBuilder } from "./error";

// Maybe
export {
  some,
  none,
  fromNullable,
  isSome,
  isNone,
  map as mapMaybe,
  flatMap as flatMapMaybe,
  flatten as flattenMaybe,
  getOrElse as getOrElseMaybe,
  getOrCompute as getOrComputeMaybe,
  tap as tapMaybe,
  match as matchMaybe,
  toNullable as toNullableMaybe,
  toUndefined as toUndefinedMaybe,
  equals as equalsMaybe,
  equalsWith as equalsWithMaybe,
  all as allMaybe,
  filter as filterMaybe,
  toResult as toResultMaybe,
  traverse as traverseMaybe,
} from "./maybe/index.js";

// Result
export {
  ok,
  err,
  isOk,
  isErr,
  map as mapResult,
  flatMap as flatMapResult,
  mapErr,
  getOrElse as getOrElseResult,
  getOrCompute as getOrComputeResult,
  tap as tapResult,
  match as matchResult,
  swap as swapResult,
  toNullable as toNullableResult,
  toUndefined as toUndefinedResult,
  all as allResult,
  unwrap as unwrapResult,
  traverse as traverseResult,
} from "./result/index.js";

// Try
export type { Try, TrySuccess, TryFailure } from "./try/index.js";
export {
  attempt,
  attemptAsync,
  isOk as isTryOk,
  isErr as isTryErr,
  map as mapTry,
  flatMap as flatMapTry,
  tap as tapTry,
  tapErr as tapErrTry,
  getOrElse as getOrElseTry,
  getOrCompute as getOrComputeTry,
  match as matchTry,
  toNullable as toNullableTry,
  toUndefined as toUndefinedTry,
} from "./try/index.js";

// AsyncResult
export type { AsyncResultInner, AsyncOk, AsyncErr, AbortError, FromPromiseOptions } from "./async-result/index.js";
export {
  ok as okAsync,
  err as errAsync,
  fromPromise,
  fromPromiseWithOptions,
  from,
  fromValue,
  fromError,
  isOk as isAsyncOk,
  isErr as isAsyncErr,
  isAbortError,
  map as mapAsyncResult,
  flatMap as flatMapAsyncResult,
  mapErr as mapErrAsyncResult,
  getOrElse as getOrElseAsyncResult,
  getOrCompute as getOrComputeAsyncResult,
  tap as tapAsyncResult,
  tapErr as tapErrAsyncResult,
  match as matchAsyncResult,
  unwrap as unwrapAsyncResult,
  unwrapOr as unwrapOrAsyncResult,
  race,
  all,
  allSettled,
  traverse,
  toNullable as toNullableAsyncResult,
  toUndefined as toUndefinedAsyncResult,
  withSignal,
} from "./async-result/index.js";

// Success/Error aliases (alternative to ok/err)
export { ok as success } from "./result/index.js";
export { err as failure } from "./result/index.js";
export { ok as successAsync } from "./async-result/index.js";
export { err as failureAsync } from "./async-result/index.js";

// Sleep
export { sleep, withTimeout, sleepWithSignal, addJitter } from "./sleep.js";
export type { TimeoutOptions, TimeoutError, SleepOptions, TimeoutCleanup, TimeoutResult } from "./sleep.js";

// Yield
export { yieldControl as yield, immediate } from "./yield.js";

// Retry
export { retryAsync, exponentialBackoff, linearBackoff, constantBackoff } from "./retry.js";
export type { RetryOptions, RetryAbortedError } from "./retry.js";

// Conversions
export {
  toResult,
  fromMaybe,
  toMaybeFromResult,
  fromResult,
  resultFromNullable,
  resultFromThrowable,
} from "./conversions.js";
export type { ToResultOptions } from "./conversions.js";

// Pipe & Flow
export { pipe, flow, pipeAsync, flowAsync, tap, tapAsync, tapSafe, reduce } from "./pipe.js";

// Error System
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
