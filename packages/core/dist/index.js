/**
 * @deessejs/core - Functional programming patterns for TypeScript
 *
 * Types: Outcome, Result, Maybe
 * Constructs: Success, Cause, Exception, Unit
 * Utilities: retry, sleep, try, conversions
 */
// Unit
export { unit, isUnit } from "./unit.js";
// Success
export { success, successUnit, isSuccess } from "./success.js";
// Cause
export { cause, causeUnit, isCause } from "./cause.js";
// Exception
export { exception, exceptionWithStack, exceptionUnit, isException } from "./exception.js";
