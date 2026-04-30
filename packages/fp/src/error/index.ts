/**
 * Error system - Inspired by Python's exception handling
 * Provides structured errors with enrichment, chaining, and grouping
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

// Types
export type {
  Error,
  ErrorGroup,
  ErrorOptions,
  ErrorBuilder,
  ExtractError,
} from "./types";

// Guards
export { isError, isErrorGroup, assertIsError, assertIsErrorGroup } from "./guards.js";

// Utilities
export { getErrorMessage, flattenErrorGroup, filterErrorsByName } from "./utils.js";

// Builder
export { error, exceptionGroup } from "./builder.js";

// Functional throw
export { raise } from "./raise.js";
