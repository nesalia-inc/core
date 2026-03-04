/**
 * Outcome type - Union of Success, Cause, and Exception
 * Used for functions that can succeed, fail with domain error, or crash
 */
import { success as createSuccess } from "./success.js";
import { cause as createCause, causeUnit as createCauseUnit } from "./cause.js";
import { exception as createException, exceptionUnit as createExceptionUnit } from "./exception.js";
/**
 * Creates a Success outcome
 * @typeParam T - The type of the success value
 * @param value - The success value
 * @returns Success<T>
 */
export const success = (value) => createSuccess(value);
/**
 * Creates a Cause outcome (domain error)
 * @typeParam T - The type of the cause data
 * @param options - The cause options
 * @returns Cause<T>
 */
export const cause = (options) => createCause(options);
/**
 * Creates a Cause with Unit data
 * @param options - The cause options without data
 * @returns Cause<Unit>
 */
export const causeUnit = (options) => createCauseUnit(options);
/**
 * Creates an Exception outcome (system error)
 * @typeParam T - The type of the exception data
 * @param options - The exception options
 * @returns Exception<T>
 */
export const exception = (options) => createException(options);
/**
 * Creates an Exception with Unit data
 * @param options - The exception options without data
 * @returns Exception<Unit>
 */
export const exceptionUnit = (options) => createExceptionUnit(options);
// Re-export type guards
export { isSuccess } from "./success.js";
export { isCause } from "./cause.js";
export { isException } from "./exception.js";
