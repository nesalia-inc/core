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
  AsyncResult,
} from "./types";

// Factory functions
export { ok, err, okAsync, errAsync } from "./builder.js";
export { fromPromise, fromPromiseWithOptions, from, fromValue, fromError } from "./builder.js";

// Type guards
export { isOk, isErr, isAbortError } from "./builder.js";

// Chainable functions
export { map, flatMap, mapErr } from "./builder.js";
export { mapAsync, flatMapAsync } from "./builder.js";

// Accessors
export { getOrElse, getOrCompute, unwrap, unwrapOr } from "./builder.js";

// Side effects
export { tap, tapErr } from "./builder.js";

// Pattern matching
export { match } from "./builder.js";

// Conversion
export { toNullable, toUndefined } from "./builder.js";

// Combinators
export { race, all, allSettled, traverse } from "./builder.js";

// Signal handling
export { withSignal } from "./builder.js";
