/**
 * @deessejs/core - Functional programming patterns for TypeScript
 *
 * Types: Outcome, Result, Maybe
 * Constructs: Success, Cause, Exception, Unit
 * Utilities: retry, sleep, try, conversions
 */

// Re-export all types
export type { Unit } from "./unit.js";
export type { Success } from "./success.js";
export type { Cause, CauseOptions } from "./cause.js";
export type { Exception, ExceptionOptions } from "./exception.js";
export type { Outcome } from "./outcome.js";
export type { Maybe, Some, None } from "./maybe.js";
export type { Result, Ok, Err } from "./result.js";

// Unit
export { unit, isUnit } from "./unit.js";

// Success
export { success, successUnit, isSuccess } from "./success.js";

// Cause
export { cause, causeUnit, isCause } from "./cause.js";

// Exception
export { exception, exceptionWithStack, exceptionUnit, isException } from "./exception.js";

// Maybe
export {
  some,
  someUnit,
  none,
  fromNullable,
  isSome,
  isNone,
  map as mapMaybe,
  flatMap as flatMapMaybe,
  getOrElse as getOrElseMaybe,
  getOrCompute as getOrComputeMaybe,
  tap as tapMaybe,
  match as matchMaybe,
  toNullable as toNullableMaybe,
  toUndefined as toUndefinedMaybe,
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
  toNullable as toNullableResult,
  toUndefined as toUndefinedResult,
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
export type { AsyncResult, AsyncResultInner, AsyncOk, AsyncErr } from "./async-result.js";
export {
  okAsync,
  errAsync,
  fromPromise,
  isOk as isAsyncOk,
  isErr as isAsyncErr,
  mapAsync,
  flatMapAsync,
  map as mapAsyncResult,
  flatMap as flatMapAsyncResult,
  getOrElse as getOrElseAsyncResult,
  getOrCompute as getOrComputeAsyncResult,
  tap as tapAsyncResult,
  match as matchAsyncResult,
  race,
  all,
  traverse,
  toNullable as toNullableAsyncResult,
  toUndefined as toUndefinedAsyncResult,
} from "./async-result.js";
