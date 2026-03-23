/**
 * @deessejs/core - Functional programming patterns for TypeScript
 *
 * Types: Result, Maybe
 * Constructs: Unit (used internally)
 * Utilities: retry, sleep, try, conversions
 */

// Re-export all types
export type { Maybe, Some, None } from "./maybe.js";
export type { Result, Ok, Err } from "./result.js";

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
} from "./maybe.js";

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
} from "./result.js";

// Try
export type { Try, TrySuccess, TryFailure } from "./try.js";
export {
  attempt,
  attemptAsync,
  isOk as isTryOk,
  isErr as isTryErr,
  map as mapTry,
  flatMap as flatMapTry,
  getOrElse as getOrElseTry,
  getOrCompute as getOrComputeTry,
  tap as tapTry,
  match as matchTry,
  toNullable as toNullableTry,
  toUndefined as toUndefinedTry,
} from "./try.js";

// AsyncResult
export type { AsyncResultInner, AsyncOk, AsyncErr, AbortError, FromPromiseOptions } from "./async-result.js";
export { AsyncResult } from "./async-result.js";
export {
  okAsync,
  errAsync,
  fromPromise,
  fromPromiseWithOptions,
  isOk as isAsyncOk,
  isErr as isAsyncErr,
  isAbortError,
  mapAsync,
  flatMapAsync,
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
} from "./async-result.js";

// Sleep
export { sleep, withTimeout, sleepWithSignal, addJitter } from "./sleep.js";
export type { TimeoutOptions, TimeoutError, SleepOptions, TimeoutCleanup, TimeoutResult } from "./sleep.js";

// Yield
export { yieldControl as yield, immediate } from "./yield.js";

// Retry
export { retry, retryAsync, exponentialBackoff, linearBackoff, constantBackoff } from "./retry.js";
export type { RetryOptions, RetryAbortedError } from "./retry.js";

// Conversions
export {
  toResult,
  toMaybeFromResult,
  fromUndefinedable,
} from "./conversions.js";
export type { ToResultOptions } from "./conversions.js";

// Pipe & Flow
export { pipe, flow } from "./pipe.js";

// Error System
export type { Error, ErrorGroup, ErrorOptions } from "./error.js";
export {
  error,
  exceptionGroup,
  raise,
  isError,
  isErrorGroup,
  isErrWithError,
  isErrTryWithError,
  getErrorMessage,
  flattenErrorGroup,
  filterErrorsByName,
} from "./error.js";
