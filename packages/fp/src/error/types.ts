/**
 * Error types - Structured domain errors with enrichment and chaining
 *
 * ## Design Philosophy
 *
 * Error<T> is a plain error object with rich metadata for domain errors.
 * It does NOT carry Result methods - use err(Error<T>) to get a Result.
 *
 * ## Error vs Result
 *
 * Error<T> represents a domain error with:
 * - name: error type identifier
 * - args: typed error data
 * - notes: additional context
 * - cause: chain to previous error
 * - message, stack: standard Error properties
 *
 * Result<T, E> represents a computation that may fail and provides
 * methods for chaining (map, flatMap, getOrElse, match, etc.)
 *
 * ## Usage
 *
 * ```typescript
 * const SizeError = error({ name: "SizeError" });
 * const domainError = SizeError({ current: 3, wanted: 5 });
 *
 * // Use with Result
 * return err(domainError);
 * // result.ok === false
 * // result.error === domainError (reference, not self)
 * ```
 */

import type { Maybe } from "../maybe";
 
import type { ZodType } from "zod";

/**
 * Native JavaScript Error type alias
 * Uses globalThis.Error to avoid conflict with the library's own Error type
 */
export type NativeError = globalThis.Error;

/**
 * ErrorData - the pure data part of an Error
 * Represents a structured domain error with enrichment capabilities.
 */
export interface ErrorData<T> {
  readonly name: string;
  readonly args: T;
  readonly notes: readonly string[];
  readonly cause: Maybe<NativeError>;
  readonly stack?: string;
  readonly message: string;
}

/**
 * Error<T> - Base Error type with enrichment and chaining
 * Plain error object with domain-specific data.
 * Does NOT have Result methods - wrap with err() to get Result semantics.
 *
 * @typeParam T - The type of error arguments
 */
export type Error<T = unknown> = Readonly<ErrorData<T>> & NativeError & ErrorMethods<T>;

/**
 * Error-specific methods for enrichment and chaining
 */
export interface ErrorMethods<T> {
  addNotes(...notes: string[]): Error<T>;
  from(cause: Error | Maybe<Error>): Error<T>;
}

/**
 * ErrorGroup - wraps multiple errors
 * Implements ErrorData<readonly Error[]> to be compatible with Error interface
 */
export type ErrorGroup = Readonly<ErrorData<readonly Error[]> & NativeError> & ErrorMethods<readonly Error[]> & {
  readonly exceptions: readonly Error[];
};

/**
 * Options for creating an Error with Zod schema validation
 * @typeParam T - The type of error arguments (validated by the schema)
 */
export type ErrorOptions<T> = {
  readonly name: string;
  readonly schema?: ZodType<T>;
  readonly defaultDescription?: string;
  readonly message?: (args: T) => string;
};

/**
 * ErrorBuilder - creates Error<T> directly
 * Args are optional with object as default so errors can be called without arguments
 */
export type ErrorBuilder<T = object> = (args?: T) => Error<T>;

/**
 * ExtractError - extracts Error<T> from an ErrorBuilder<T>
 *
 * Usage:
 *   const SizeError = error({ name: "SizeError", schema: z.object({ current: z.number(), wanted: z.number() }) });
 *   type SizeErrorType = ExtractError<typeof SizeError>; // Error<{ current: number, wanted: number }>
 *
 * @typeParam T - The ErrorBuilder type to extract the error from
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractError<T extends ErrorBuilder<any>> = T extends ErrorBuilder<infer E> ? Error<E> : never;
