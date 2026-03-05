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
  none,
  fromNullable,
  isSome,
  isNone,
  map,
  flatMap,
  getOrElse,
  getOrCompute,
  tap,
  match,
  toNullable,
  toUndefined,
} from "./maybe.js";
