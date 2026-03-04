/**
 * Cause type - represents domain errors (business logic failures)
 * Unlike Exceptions, Causes are expected and recoverable errors
 */

import { Unit, unit } from "./unit.js";

/**
 * Cause data structure
 * @typeParam T - The type of the cause data
 */
export interface Cause<T = unknown> {
  readonly name: string;
  readonly message: string;
  readonly data: T;
}

/**
 * Cause options for creating a Cause
 * @typeParam T - The type of the cause data
 */
export interface CauseOptions<T = unknown> {
  readonly name: string;
  readonly message: string;
  readonly data: T;
}

/**
 * Creates a Cause (domain error)
 * @param options - The cause options
 * @returns Cause<T>
 */
export function cause<T = unknown>(options: CauseOptions<T>): Cause<T> {
  return Object.freeze({
    name: options.name,
    message: options.message,
    data: options.data,
  });
}

/**
 * Creates a Cause with Unit data (no data needed)
 * @param options - The cause options without data
 * @returns Cause<Unit>
 */
export function causeUnit(options: Omit<CauseOptions<Unit>, "data">): Cause<Unit> {
  return cause({
    ...options,
    data: unit,
  });
}

/**
 * Type guard to check if a value is a Cause
 * @typeParam T - The type of the cause data
 * @param value - The value to check
 * @returns true if value is Cause<T>
 */
export function isCause<T = unknown>(value: unknown): value is Cause<T> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.name === "string" &&
    typeof obj.message === "string" &&
    "data" in obj &&
    !("stack" in obj) // Exclude Exception
  );
}
