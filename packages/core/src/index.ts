/**
 * @deessejs/core - Functional programming patterns for TypeScript
 *
 * Types: Result, Maybe
 * Constructs: Unit
 * Utilities: retry, sleep, try, conversions
 */

// Unit
export type { Unit } from "./unit";
export { unit, isUnit } from "./unit";

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
} from "./maybe";

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
} from "./result";

// Try
export type { Try, TrySuccess, TryFailure } from "./try";
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
} from "./try";

// AsyncResult
export type { AsyncResultInner, AsyncOk, AsyncErr, AbortError, FromPromiseOptions } from "./async-result";
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
} from "./async-result";

// Sleep
export { sleep, withTimeout, sleepWithSignal, addJitter } from "./sleep";
export type { TimeoutOptions, TimeoutError, SleepOptions, TimeoutCleanup, TimeoutResult } from "./sleep";

// Yield
export { yieldControl as yield, immediate } from "./yield";

// Retry
export { retryAsync, exponentialBackoff, linearBackoff, constantBackoff } from "./retry";
export type { RetryOptions, RetryAbortedError } from "./retry";

// Conversions
export {
  toResult,
  fromMaybe,
  toMaybeFromResult,
  fromResult,
  resultFromNullable,
  resultFromThrowable,
} from "./conversions";
export type { ToResultOptions } from "./conversions";

// Pipe & Flow
export { pipe, flow, pipeAsync, flowAsync, tap, tapAsync, tapSafe } from "./pipe";

// Error System
export type { Error, ErrorGroup, ErrorOptions } from "./error/index";
export {
  error,
  exceptionGroup,
  raise,
  isError,
  isErrorGroup,
  getErrorMessage,
  flattenErrorGroup,
  filterErrorsByName,
} from "./error/index";
