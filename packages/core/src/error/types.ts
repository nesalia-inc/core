/**
 * Error types - Base Error type with enrichment and chaining
 */

import type { Err } from "../result.js";
import type { Maybe } from "../maybe";
import type { ZodSchema } from "zod";

/**
 * Native JavaScript Error type alias
 * Uses globalThis.Error to avoid conflict with the library's own Error type
 */
type NativeError = globalThis.Error;

/**
 * Base Error type with enrichment and chaining
 * Compatible with JavaScript's Error type through structural typing
 * @typeParam T - The type of error arguments
 */
export type Error<T = unknown> = Readonly<ErrorBase<T>> & NativeError;

interface ErrorBase<T> {
  readonly name: string;
  readonly args: T;
  readonly notes: readonly string[];
  readonly cause: Maybe<NativeError>;
  readonly stack?: string;
  readonly message: string;
}

/**
 * ErrorGroup - wraps multiple errors
 */
export type ErrorGroup = Readonly<{
  readonly name: string;
  readonly exceptions: readonly Error[];
}>;

/**
 * Options for creating an Error with Zod schema validation
 * @typeParam T - The type of error arguments (validated by the schema)
 */
export type ErrorOptions<T> = {
  readonly name: string;
  readonly schema: ZodSchema<T>;
  readonly defaultDescription?: string;
  readonly message?: (args: T) => string;
};

/**
 * Err with error methods for fluent API
 */
export interface ErrWithMethods<T> extends Err<Error<T>> {
  addNotes(...notes: string[]): ErrWithMethods<T>;
  from(cause: Error | Err<Error> | Maybe<Error>): ErrWithMethods<T>;
}

/**
 * Internal ErrorBuilder for fluent API
 */
export type ErrorBuilder<T> = (args: T) => ErrWithMethods<T>;
