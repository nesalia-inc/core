/**
 * Exception type - represents system errors (unexpected failures)
 * Unlike Causes, these are unexpected and typically unrecoverable
 */

import { Unit, unit } from "./unit.js";

/**
 * Exception data structure
 * @typeParam T - The type of the exception data
 */
export interface Exception<T = Unit> {
  readonly name: string;
  readonly message: string;
  readonly data: T;
  readonly stack?: string;
}

/**
 * Exception options for creating an Exception
 * @typeParam T - The type of the exception data
 */
export interface ExceptionOptions<T = Unit> {
  readonly name: string;
  readonly message: string;
  readonly data?: T;
  readonly stack?: string;
}

/**
 * Creates an Exception (system error)
 * @param options - The exception options
 * @returns Exception<T>
 */
export function exception<T = Unit>(options: ExceptionOptions<T>): Exception<T> {
  return Object.freeze({
    name: options.name,
    message: options.message,
    data: options.data ?? unit,
    stack: options.stack ?? new Error().stack,
  });
}

/**
 * Creates an Exception with current stack trace
 * @param options - The exception options (stack will be auto-generated)
 * @returns Exception<T>
 */
export function exceptionWithStack<T = Unit>(
  options: Omit<ExceptionOptions<T>, "stack">
): Exception<T> {
  return exception({
    ...options,
    stack: new Error().stack,
  });
}

/**
 * Creates an Exception with Unit data
 * @param options - The exception options without data
 * @returns Exception<Unit>
 */
export function exceptionUnit(options: {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
}): Exception<Unit> {
  return exception({
    name: options.name,
    message: options.message,
    data: unit,
    stack: options.stack,
  });
}

/**
 * Type guard to check if a value is an Exception
 * @typeParam T - The type of the exception data
 * @param value - The value to check
 * @returns true if value is Exception<T>
 */
export function isException<T = Unit>(value: unknown): value is Exception<T> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.name === "string" &&
    typeof obj.message === "string" &&
    "data" in obj &&
    "stack" in obj
  );
}
