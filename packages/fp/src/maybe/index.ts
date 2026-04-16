/**
 * Maybe module - optional values
 */

// Types
export type { Maybe, Some, None } from "./types.js";

// Builder functions
export { some, none, fromNullable } from "./builder.js";

// Type guards
export { isSome, isNone } from "./builder.js";

// Chainable functions
export { map, flatMap, flatten, tap, match } from "./builder.js";

// Conversion functions
export { toNullable, toUndefined, getOrElse, getOrCompute, toResult } from "./builder.js";

// Comparison
export { equals, equalsWith } from "./builder.js";

// Combinators
export { all, filter, traverse } from "./builder.js";