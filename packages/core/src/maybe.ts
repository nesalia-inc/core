/**
 * Maybe type - represents optional values (Some or None)
 * Used for values that may or may not be present
 */

/**
 * Maybe type - union of Some and None
 * @typeParam T - The type of the value if present
 */
export type Maybe<T> = Some<T> | None;

/**
 * Some type - represents a present value
 * @typeParam T - The type of the value
 */
export type Some<T> = {
  readonly ok: true;
  readonly value: T;
};

/**
 * None type - represents an absent value
 */
export type None = {
  readonly ok: false;
};

/**
 * Creates a Some (present value)
 * @param value - The value
 * @returns Some<T>
 */
export const some = <T>(value: T): Some<T> =>
  Object.freeze({
    ok: true,
    value,
  });

/**
 * Creates a None (absent value)
 * @returns None
 */
export const none: None = Object.freeze({
  ok: false,
});

/**
 * Creates a Maybe from a nullable value
 * @param value - The value to convert
 * @returns Some<T> if value is not null/undefined, None otherwise
 */
export const fromNullable = <T>(value: T | null | undefined): Maybe<T> =>
  value == null ? none : some(value);

/**
 * Type guard to check if Maybe is Some
 * @typeParam T - The type of the value
 * @param maybe - The Maybe to check
 * @returns true if Maybe is Some<T>
 */
export const isSome = <T>(maybe: Maybe<T>): maybe is Some<T> => maybe.ok === true;

/**
 * Type guard to check if Maybe is None
 * @typeParam T - The type of the value
 * @param maybe - The Maybe to check
 * @returns true if Maybe is None
 */
export const isNone = <T>(maybe: Maybe<T>): maybe is None => maybe.ok === false;

/**
 * Maps the value of Maybe if Some, returns None otherwise
 * @typeParam T - The type of the value
 * @typeParam U - The type of the mapped value
 * @param maybe - The Maybe to map
 * @param fn - The mapping function
 * @returns Some<U> if Some, None otherwise
 */
export const map = <T, U>(maybe: Maybe<T>, fn: (value: T) => U): Maybe<U> =>
  isSome(maybe) ? some(fn(maybe.value)) : none;

/**
 * Chains Maybes - function if Some, returns None otherwise
 * applies @typeParam T - The type of the value
 * @typeParam U - The type of the chained value
 * @param maybe - The Maybe to chain
 * @param fn - The chaining function
 * @returns Result of the function if Some, None otherwise
 */
export const flatMap = <T, U>(maybe: Maybe<T>, fn: (value: T) => Maybe<U>): Maybe<U> =>
  isSome(maybe) ? fn(maybe.value) : none;

/**
 * Gets the value or a default
 * @typeParam T - The type of the value
 * @param maybe - The Maybe
 * @param defaultValue - The default value
 * @returns The value if Some, default otherwise
 */
export const getOrElse = <T>(maybe: Maybe<T>, defaultValue: T): T =>
  isSome(maybe) ? maybe.value : defaultValue;

/**
 * Gets the value or computes a default
 * @typeParam T - The type of the value
 * @typeParam U - The type of the computed default
 * @param maybe - The Maybe
 * @param fn - The function to compute default
 * @returns The value if Some, result of fn otherwise
 */
export const getOrCompute = <T, U>(maybe: Maybe<T>, fn: () => U): T | U =>
  isSome(maybe) ? maybe.value : fn();
