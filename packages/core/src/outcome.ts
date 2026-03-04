/**
 * Outcome type - Union of Success, Cause, and Exception
 * Used for functions that can succeed, fail with domain error, or crash
 */

import { Success, success as createSuccess } from "./success.js";
import { Cause, cause as createCause, causeUnit as createCauseUnit } from "./cause.js";
import { Exception, exception as createException, exceptionUnit as createExceptionUnit } from "./exception.js";
import { Unit } from "./unit.js";

/**
 * Outcome union type
 * @typeParam T - The type of the success value
 * @typeParam C - The type of the cause data (default: unknown)
 * @typeParam E - The type of the exception data (default: Unit)
 */
export type Outcome<
  T,
  C = Cause<unknown>,
  E = Exception<Unit>
> = Success<T> | Cause<C> | Exception<E>;

/**
 * Creates a Success outcome
 * @typeParam T - The type of the success value
 * @param value - The success value
 * @returns Success<T>
 */
export const success = <T>(value: T): Success<T> => createSuccess(value);

/**
 * Creates a Cause outcome (domain error)
 * @typeParam T - The type of the cause data
 * @param options - The cause options
 * @returns Cause<T>
 */
export const cause = <T = unknown>(options: {
  readonly name: string;
  readonly message: string;
  readonly data: T;
}): Cause<T> => createCause(options);

/**
 * Creates a Cause with Unit data
 * @param options - The cause options without data
 * @returns Cause<Unit>
 */
export const causeUnit = (options: {
  readonly name: string;
  readonly message: string;
}): Cause<Unit> => createCauseUnit(options);

/**
 * Creates an Exception outcome (system error)
 * @typeParam T - The type of the exception data
 * @param options - The exception options
 * @returns Exception<T>
 */
export const exception = <T = Unit>(options: {
  readonly name: string;
  readonly message: string;
  readonly data?: T;
  readonly stack?: string;
}): Exception<T> => createException(options);

/**
 * Creates an Exception with Unit data
 * @param options - The exception options without data
 * @returns Exception<Unit>
 */
export const exceptionUnit = (options: {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
}): Exception<Unit> => createExceptionUnit(options);

// Re-export type guards
export { isSuccess } from "./success.js";
export { isCause } from "./cause.js";
export { isException } from "./exception.js";

// Re-export types
export type { Success } from "./success.js";
export type { Cause } from "./cause.js";
export type { Exception } from "./exception.js";
export type { Unit } from "./unit.js";
