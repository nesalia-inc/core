/**
 * Serialization types for Result, Maybe, and Error types
 *
 * Provides JSON-compatible representations for cross-boundary transmission
 * (persistence, network transmission, inter-process communication)
 */

/**
 * JSON representation of Ok result
 * @typeParam T - The type of the value
 */
export interface OkJSON<T> {
  readonly _tag: "Ok";
  readonly value: T;
  readonly _version?: number;
}

/**
 * JSON representation of Err result
 * @typeParam E - The type of the error
 */
export interface ErrJSON<E> {
  readonly _tag: "Err";
  readonly error: E;
  readonly _version?: number;
}

/**
 * JSON representation of Result (union of Ok and Err)
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 */
export type ResultJSON<T, E> = OkJSON<T> | ErrJSON<E>;

/**
 * JSON representation of Some maybe
 * @typeParam T - The type of the value
 */
export interface SomeJSON<T> {
  readonly _tag: "Some";
  readonly value: T;
}

/**
 * JSON representation of None maybe
 */
export interface NoneJSON {
  readonly _tag: "None";
}

/**
 * JSON representation of Maybe (union of Some and None)
 * @typeParam T - The type of the value
 */
export type MaybeJSON<T> = SomeJSON<T> | NoneJSON;

/**
 * Error registry entry - can be an ErrorConstructor or a factory function
 *
 * Used for reconstructing domain errors during deserialization.
 * The ErrorBuilder signature matches: (args?: unknown) => Error<T>
 */
export type ErrorRegistryEntry = ErrorConstructor | ((args: unknown) => unknown);

/**
 * Error registry for reconstructing domain errors during deserialization
 *
 * Maps error tag names to their constructors or factory functions.
 *
 * @example
 * const errorRegistry: ErrorRegistry = {
 *   NotFoundError,
 *   ValidationError,
 *   NetworkError
 * };
 *
 * // Or with factory functions
 * const errorRegistry: ErrorRegistry = {
 *   NotFoundError: (args) => NotFoundError(args),
 *   CustomError: (args) => new CustomError(args)
 * };
 */
export interface ErrorRegistry {
  [tag: string]: ErrorRegistryEntry;
}

/**
 * Options for Result deserialization
 */
export interface ResultDeserializeOptions {
  /**
   * Migration functions for schema evolution
   * Key is the version number, value is the migration function
   */
  readonly migrations?: Readonly<Record<number, (value: unknown) => unknown>>;
}

/**
 * Result deserialization error data
 */
export interface ResultDeserializationErrorData {
  readonly reason: string;
  readonly input: unknown;
}
