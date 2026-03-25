/**
 * Error system - Inspired by Python's exception handling
 * Provides structured errors with enrichment, chaining, and grouping
 *
 * ## Error vs Result Semantics
 *
 * The Error system and Result type serve different purposes:
 *
 * ### Result<T, E>
 * - Represents a computation that may fail
 * - Use for: Expected failures, validation, fallible operations
 * - Fluent API with map(), flatMap(), getOrElse(), etc.
 * - Best for: Railway-oriented programming
 *
 * ### Error<T>
 * - Represents a structured error with rich metadata
 * - Use for: Domain errors, error enrichment, error chains
 * - Features: name, args, notes, cause, message, stack
 * - Best for: Logging, error tracking, debugging
 *
 * ### When to use which?
 *
 * Use Result when:
 * - You need to chain operations that may fail
 * - You want to propagate failures without detailed context
 * - You're building a pipeline of fallible operations
 *
 * Use Error when:
 * - You need rich error context for debugging
 * - You're building domain-specific errors
 * - You need error chaining (cause)
 * - You're integrating with error tracking tools
 *
 * ### Converting between them
 *
 * The error() factory returns an Err<Error<T>> - a Result containing your Error:
 *
 * ```typescript
 * const SizeError = error({ name: 'SizeError', ... });
 * const result = SizeError({ current: 3, wanted: 5 });
 *
 * // result is Err<Error<{current: number, wanted: number}>>
 * result.ok === false; // true
 * result.error.name === 'SizeError'; // true
 *
 * // Access the raw Error object if needed
 * const err = result.error;
 * ```
 *
 * This design allows Error to be used both as:
 * 1. A standalone error object (via result.error)
 * 2. A Result for chaining (the full result)
 */

// Types
export type {
  Error,
  ErrorGroup,
  ErrorOptions,
  ErrWithMethods,
  ErrorBuilder,
} from "./types";

// Guards
export { isError, isErrorGroup, isErrWithError, isErrTryWithError, assertIsError, assertIsErrorGroup } from "./guards";

// Utilities
export { getErrorMessage, flattenErrorGroup, filterErrorsByName } from "./utils";

// Builder
export { error, exceptionGroup } from "./builder";

// Functional throw
export { raise } from "./raise";
