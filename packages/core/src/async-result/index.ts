/**
 * AsyncResult module - async version of Result
 * Thenable wrapper for async operations with proper error handling
 */

// Types (AsyncResult type is exported separately by users importing from types.ts)
export type {
  AbortError,
  FromPromiseOptions,
  AsyncOk,
  AsyncErr,
  AsyncResultInner,
  AsyncResultInstance,
  AsyncResultFactory,
} from "./types";

// Factory (the AsyncResult callable with static methods)
export { AsyncResult } from "./builder";

// Factory functions
export { okAsync, errAsync } from "./builder";

// Promise conversion
export { fromPromise, fromPromiseWithOptions } from "./builder";

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
