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
