/**
 * Error types - Base Error type with enrichment, chaining, and Result methods
 */

import type { Maybe } from "../maybe";
import type { ZodSchema } from "zod";

/**
 * Native JavaScript Error type alias
 * Uses globalThis.Error to avoid conflict with the library's own Error type
 */
export type NativeError = globalThis.Error;

/**
 * ErrorData - the pure data part of an Error
 */
interface ErrorData<T> {
  readonly name: string;
  readonly args: T;
  readonly notes: readonly string[];
  readonly cause: Maybe<NativeError>;
  readonly stack?: string;
  readonly message: string;
}

/**
 * ErrorResult<T> - Result interface for Error that is self-referential
 * Error<T> has ok: false and error: Error<T> (self-reference: e.error === e)
 */
interface ErrorResult<T> {
  readonly ok: false;
  readonly error: Error<T>;
  isOk(): false;
  isErr(): true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  map(_fn: (value: never) => unknown): Error<T>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  flatMap(_fn: (value: never) => Error<T>): Error<T>;
  mapErr<F extends NativeError>(_fn: (error: Error<T>) => F): Error<T>;
  getOrElse<T2>(defaultValue: T2): T2;
  getOrCompute<T2>(_fn: () => T2): T2;
  tap(_fn: (value: never) => void): Error<T>;
  tapErr(_fn: (error: Error<T>) => void): Error<T>;
  match<U>(_ok: (value: never) => U, err: (error: Error<T>) => U): U;
  unwrap(): never;
  addNotes(...notes: string[]): Error<T>;
  from(cause: Error | Maybe<Error>): Error<T>;
}

/**
 * Error<T> - Base Error type with enrichment, chaining, and Result methods built-in
 * Self-referential: e.error === e
 * Compatible with JavaScript's Error type through structural typing
 * @typeParam T - The type of error arguments
 */
export type Error<T = unknown> = Readonly<ErrorData<T>> & ErrorResult<T> & NativeError;

/**
 * ErrorGroup - wraps multiple errors
 * Implements ErrorData<readonly Error[]> to be compatible with Error interface
 */
export type ErrorGroup = Readonly<ErrorData<readonly Error[]> & ErrorResult<readonly Error[]> & NativeError> & {
  readonly exceptions: readonly Error[];
};

/**
 * Options for creating an Error with Zod schema validation
 * @typeParam T - The type of error arguments (validated by the schema)
 */
export type ErrorOptions<T> = {
  readonly name: string;
  readonly schema?: ZodSchema<T>;
  readonly defaultDescription?: string;
  readonly message?: (args: T) => string;
};

/**
 * ErrorBuilder - creates Error<T> directly
 */
export type ErrorBuilder<T> = (args: T) => Error<T>;
