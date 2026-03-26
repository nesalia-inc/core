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
} from "./types";

// Builder functions
export { ok, err } from "./builder";

// Type guards
export { isOk, isErr } from "./builder";

// Chainable functions
export { map, flatMap, mapErr } from "./builder";

// Accessors
export { getOrElse, getOrCompute, unwrap } from "./builder";

// Side effects
export { tap, tapErr } from "./builder";

// Pattern matching
export { match } from "./builder";

// Conversion
export { toNullable, toUndefined, swap } from "./builder";

// Combinators
export { all } from "./builder";
