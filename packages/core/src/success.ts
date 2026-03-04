/**
 * Success type - represents a successful result with a value
 */

import { Unit, unit } from "./unit.js";

/**
 * Success type representing a successful operation with a value
 * @typeParam T - The type of the success value
 */
export interface Success<T> {
  readonly ok: true;
  readonly value: T;
}

/**
 * Creates a Success type
 * @param value - The success value
 * @returns Success<T>
 */
export function success<T>(value: T): Success<T> {
  return Object.freeze({
    ok: true,
    value,
  });
}

/**
 * Creates a Success with Unit value (no meaningful return)
 * @returns Success<Unit>
 */
export function successUnit(): Success<Unit> {
  return success(unit);
}

/**
 * Type guard to check if a result is Success
 * @typeParam T - The type of the success value
 * @param result - The result to check
 * @returns true if result is Success<T>
 */
export function isSuccess<T, C, E>(
  result: { ok: boolean } & (C | E | { value?: T })
): result is Success<T> {
  return result.ok === true;
}
