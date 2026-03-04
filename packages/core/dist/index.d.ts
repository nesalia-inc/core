/**
 * @deessejs/core - Functional programming patterns for TypeScript
 *
 * Types: Outcome, Result, Maybe
 * Constructs: Success, Cause, Exception, Unit
 * Utilities: retry, sleep, try, conversions
 */
export type { Unit } from "./unit.js";
export type { Success } from "./success.js";
export type { Cause, CauseOptions } from "./cause.js";
export type { Exception, ExceptionOptions } from "./exception.js";
export type { Outcome } from "./outcome.js";
export { unit, isUnit } from "./unit.js";
export { success, successUnit, isSuccess } from "./success.js";
export { cause, causeUnit, isCause } from "./cause.js";
export { exception, exceptionWithStack, exceptionUnit, isException } from "./exception.js";
//# sourceMappingURL=index.d.ts.map