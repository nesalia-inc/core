/**
 * Serialization module - Convert Result, Maybe, and Error to/from plain JSON
 *
 * ## Purpose
 *
 * Functional types like Result, Maybe, and Error need to cross boundaries
 * where only plain data exists: persistence, network transmission, IPC.
 *
 * ## Usage
 *
 * ```typescript
 * import { Result, Maybe, ok, err, some, none, error } from '@deessejs/fp';
 * import { serializeResult, serializeMaybe, errorReviver } from '@deessejs/fp';
 *
 * // Serialize
 * const serialized = Result.serialize(ok({ id: "123" }));
 * // { "_tag": "Ok", value: { id: "123" } }
 *
 * // Deserialize
 * const restored = Result.deserialize(errorRegistry, json);
 * ```
 */

// Types
export type {
  OkJSON,
  ErrJSON,
  ResultJSON,
  SomeJSON,
  NoneJSON,
  MaybeJSON,
  ErrorRegistry,
  ErrorRegistryEntry,
  ResultDeserializeOptions,
  ResultDeserializationErrorData,
} from "./types.js";

// Builder functions
export {
  serializeResult,
  deserializeResult,
  serializeMaybe,
  deserializeMaybe,
  ResultDeserializationError,
} from "./builder.js";

// Error reviver
export { errorReviver } from "./builder.js";

// ============================================================================
// RESULT SERIALIZATION CLASS (DEP-0008)
// ============================================================================

import {
  serializeResult,
  deserializeResult,
} from "./builder.js";

/**
 * Static-style serialization API for Result.
 */
export class Result {
  private constructor() {
    // Prevent instantiation - this class only provides static methods
  }

  static serialize<T, E extends Error>(result: { ok: true; value: T } | { ok: false; error: E }): {
    _tag: "Ok";
    value: T;
  } | {
    _tag: "Err";
    error: E;
  } {
    return serializeResult(result as any) as any;
  }

  static deserialize(errorRegistry: unknown, json: unknown) {
    return deserializeResult(errorRegistry as any, json);
  }
}

// ============================================================================
// MAYBE SERIALIZATION CLASS (DEP-0008)
// ============================================================================

import {
  serializeMaybe,
  deserializeMaybe,
} from "./builder.js";

/**
 * Static-style serialization API for Maybe.
 */
export class Maybe {
  private constructor() {
    // Prevent instantiation - this class only provides static methods
  }

  static serialize<T>(maybe: { ok: true; value: T } | { ok: false }): {
    _tag: "Some";
    value: T;
  } | {
    _tag: "None";
  } {
    return serializeMaybe(maybe as any) as any;
  }

  static deserialize<T>(json: unknown) {
    return deserializeMaybe<T>(json);
  }
}
