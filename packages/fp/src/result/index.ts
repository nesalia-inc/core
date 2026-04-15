/**
 * Result module - represents success or failure
 */

// Types
export type {
  Ok,
  Err,
  Result,
  Success,
  ExtractResultError,
} from "./types.js";

// Builder functions
export { ok, err } from "./builder.js";

// Type guards
export { isOk, isErr } from "./builder.js";

// Chainable functions
export { map, flatMap, mapErr } from "./builder.js";

// Accessors
export { getOrElse, getOrCompute, unwrap } from "./builder.js";

// Side effects
export { tap, tapErr } from "./builder.js";

// Pattern matching
export { match } from "./builder.js";

// Conversion
export { toNullable, toUndefined, swap } from "./builder.js";

// Combinators
export { all } from "./builder.js";
