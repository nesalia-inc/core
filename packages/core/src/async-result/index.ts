/**
 * AsyncResult module - async version of Result
 * Thenable wrapper for async operations with proper error handling
 */

// Types
export type {
  AbortError,
  FromPromiseOptions,
  AsyncOk,
  AsyncErr,
  AsyncResultInner,
  AsyncResultInstance,
} from "./types";

// Factory functions
export { ok, err, okAsync, errAsync } from "./builder";
export { fromPromise, fromPromiseWithOptions, from, fromValue, fromError } from "./builder";

// Type guards
export { isOk, isErr, isAbortError } from "./builder";

// Chainable functions
export { map, flatMap, mapErr } from "./builder";
export { mapAsync, flatMapAsync } from "./builder";

// Accessors
export { getOrElse, getOrCompute, unwrap, unwrapOr } from "./builder";

// Side effects
export { tap, tapErr } from "./builder";

// Pattern matching
export { match } from "./builder";

// Conversion
export { toNullable, toUndefined } from "./builder";

// Combinators
export { race, all, allSettled, traverse } from "./builder";

// Signal handling
export { withSignal } from "./builder";
