/**
 * Try module - wraps try/catch in a type-safe way
 */

// Types
export type { Try, TrySuccess, TryFailure } from "./types.js";

// Builder functions
export { createTrySuccess, createTryFailure, attempt, attemptAsync } from "./builder.js";

// Type guards
export { isOk, isErr } from "./builder.js";

// Chainable functions
export { map, flatMap } from "./builder.js";

// Accessors
export { getOrElse, getOrCompute } from "./builder.js";

// Side effects
export { tap, tapErr } from "./builder.js";

// Pattern matching
export { match } from "./builder.js";

// Conversion
export { toNullable, toUndefined } from "./builder.js";
