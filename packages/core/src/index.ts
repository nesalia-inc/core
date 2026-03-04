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
export type { Cause } from "./cause.js";
export type { Exception } from "./exception.js";
export type { Outcome } from "./outcome.js";

// Unit
export { unit, isUnit } from "./unit.js";

// Success
export { success, successUnit, isSuccess } from "./success.js";

// Cause
export { cause, causeUnit, isCause } from "./cause.js";

// Exception
export { exception, exceptionUnit, isException } from "./exception.js";

// Outcome (combines all)
export { success, cause, exception, causeUnit, exceptionUnit } from "./outcome.js";
export { isSuccess, isCause, isException } from "./outcome.js";
export type { Outcome } from "./outcome.js";
