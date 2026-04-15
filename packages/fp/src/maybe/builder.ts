/**
 * Maybe builder functions
 */

import { ok, err, type Result } from "../result/index.js";
import { type Error } from "../error/types.js";
import { type Some, type None, type Maybe } from "./types.js";

/**
 * Creates a Some (present value)
 * @param value - The value (must be non-null/non-undefined)
 * @returns Some<T>
 */
export const some = <T,>(value: NonNullable<T>): Some<NonNullable<T>> => {
  const someValue: Some<NonNullable<T>> = {
    ok: true,
    value: value as NonNullable<T>,
    isSome() {
      return true;
    },
    isNone() {
      return false;
    },
    equals(other: Maybe<NonNullable<T>>, comparator?: (a: NonNullable<T>, b: NonNullable<T>) => boolean): boolean {
      if (isSome(other)) {
        if (comparator !== undefined) {
          return comparator(this.value, other.value);
        }
        return this.value === other.value;
      }
      return false;
    },
    filter(predicate: (value: NonNullable<T>) => boolean): Maybe<NonNullable<T>> {
      if (!predicate(this.value)) {
        return none();
      }
      return this;
    },
    map<U>(fn: (value: NonNullable<T>) => U): Maybe<U> {
      return fromNullable(fn(this.value));
    },
    flatMap<U>(fn: (value: NonNullable<T>) => Maybe<U>): Maybe<U> {
      return fn(this.value);
    },
    getOrElse(_defaultValue: NonNullable<T>): NonNullable<T> {
      return this.value;
    },
    getOrCompute(_fn: () => NonNullable<T>): NonNullable<T> {
      return this.value;
    },
    tap(fn: (value: NonNullable<T>) => void): Maybe<NonNullable<T>> {
      fn(this.value);
      return this;
    },
    toResult(_onNone: () => Error<unknown>): Result<NonNullable<T>, Error<unknown>> {
      return ok(this.value);
    },
  };
  return Object.freeze(someValue);
};

/**
 * Creates a None (absent value)
 * @returns None
 */
const NONE: None = Object.freeze({
  ok: false,
  isSome() {
    return false;
  },
  isNone() {
    return true;
  },
  equals(_other: Maybe<unknown>, _comparator?: (a: unknown, b: unknown) => boolean): boolean {
    return isNone(_other);
  },
  filter(_predicate: (value: unknown) => boolean): None {
    return NONE;
  },
  map<U>(_fn: (value: never) => U): None {
    return NONE;
  },
  flatMap<U>(_fn: (value: never) => Maybe<U>): None {
    return NONE;
  },
  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  },
  getOrCompute<T>(_fn: () => T): T {
    return _fn();
  },
  tap(_fn: (value: never) => void): None {
    return NONE;
  },
  toResult(onNone: () => Error<unknown>): Result<never, Error<unknown>> {
    // Error<T> is now separate from Result, so we wrap it with err()
    return err(onNone());
  },
});

/**
 * Creates a None (absent value)
 * @returns None
 */
export const none = (): None => NONE;

/**
 * Creates a Maybe from a nullable value
 * @param value - The value to convert
 * @returns Some<T> if value is not null/undefined, None otherwise
 */
export const fromNullable = <T>(value: T | null | undefined): Maybe<T> =>
  value == null ? none() : some(value);

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
  isSome(maybe) ? fromNullable(fn(maybe.value)) : none();

/**
 * Chains Maybes - function if Some, returns None otherwise
 * @typeParam T - The type of the value
 * @typeParam U - The type of the chained value
 * @param maybe - The Maybe to chain
 * @param fn - The chaining function
 * @returns Result of the function if Some, None otherwise
 */
export const flatMap = <T, U>(maybe: Maybe<T>, fn: (value: T) => Maybe<U>): Maybe<U> =>
  isSome(maybe) ? fn(maybe.value) : none();

/**
 * Flattens a nested Maybe (Maybe<Maybe<T>> -> Maybe<T>)
 * @typeParam T - The type of the inner value
 * @param maybe - The nested Maybe to flatten
 * @returns The flattened Maybe
 */
export const flatten = <T>(maybe: Maybe<Maybe<T>>): Maybe<T> =>
  isSome(maybe) ? maybe.value : none();

/**
 * Performs a side effect without changing the value
 * @typeParam T - The type of the value
 * @param maybe - The Maybe to inspect
 * @param fn - The side effect function
 * @returns The same Maybe
 */
export const tap = <T>(maybe: Maybe<T>, fn: (value: T) => void): Maybe<T> => {
  if (isSome(maybe)) {
    fn(maybe.value);
  }
  return maybe;
};

/**
 * Matches both Some and None cases
 * @typeParam T - The type of the value
 * @typeParam U - The type of the result
 * @param maybe - The Maybe to match
 * @param some - Function to handle Some
 * @param none - Function to handle None
 * @returns Result of the handler function
 */
export const match = <T, U>(
  maybe: Maybe<T>,
  some: (value: T) => U,
  none: () => U
): U => (isSome(maybe) ? some(maybe.value) : none());

/**
 * Converts Maybe to a nullable value
 * @typeParam T - The type of the value
 * @param maybe - The Maybe to convert
 * @returns The value if Some, null otherwise
 */
export const toNullable = <T>(maybe: Maybe<T>): T | null =>
  isSome(maybe) ? maybe.value : null;

/**
 * Converts Maybe to an undefined-able value
 * @typeParam T - The type of the value
 * @param maybe - The Maybe to convert
 * @returns The value if Some, undefined otherwise
 */
export const toUndefined = <T>(maybe: Maybe<T>): T | undefined =>
  isSome(maybe) ? maybe.value : undefined;

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

/**
 * Compares two Maybe values for equality
 * @typeParam T - The type of the value
 * @param a - The first Maybe
 * @param b - The second Maybe
 * @param comparator - Optional custom comparator function
 * @returns true if both are Some with equal values, or both are None
 */
export const equals = <T>(a: Maybe<T>, b: Maybe<T>): boolean =>
  a.equals(b);

/**
 * Compares two Maybe values using a custom comparator
 * @typeParam T - The type of the value
 * @param a - The first Maybe
 * @param b - The second Maybe
 * @param comparator - Custom comparator function
 * @returns true if both are Some with equal values according to comparator, or both are None
 */
export const equalsWith = <T>(
  a: Maybe<T>,
  b: Maybe<T>,
  comparator: (a: T, b: T) => boolean
): boolean => {
  if (!a.ok) return !b.ok;
  if (!b.ok) return false;
  return comparator(a.value, b.value);
};

/**
 * Combines multiple Maybes into one
 * @typeParam T - The types of the values
 * @param maybes - The Maybes to combine
 * @returns Some<[T1, T2, ...]> if all are Some, None otherwise
 */
 
export function all<T extends readonly []>(...maybes: T): Some<[]>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function all<T extends [Maybe<any>, ...Maybe<any>[]]>(...maybes: T): Maybe<{ [K in keyof T]: T[K] extends Maybe<infer U> ? U : never }>;
export function all<T>(maybes: readonly Maybe<T>[]): Maybe<T[]>;
export function all<T>(first: Maybe<T> | readonly Maybe<T>[], ...rest: Maybe<T>[]): Maybe<T[]> {
  const maybes: Maybe<T>[] = Array.isArray(first) ? first : [first, ...rest];
  const values: T[] = [];
  for (const maybe of maybes) {
    if (isNone(maybe)) {
      return none();
    }
    values.push(maybe.value);
  }
  return some(values);
}

/**
 * Filters a Maybe based on a predicate
 * @typeParam T - The type of the value
 * @param maybe - The Maybe to filter
 * @param predicate - The predicate function
 * @returns Some<T> if predicate passes and maybe is Some, None otherwise
 */
export const filter = <T>(
  maybe: Maybe<T>,
  predicate: (value: T) => boolean
): Maybe<T> => {
  if (isSome(maybe) && !predicate(maybe.value)) {
    return none();
  }
  return maybe;
};

/**
 * Converts a Maybe to a Result
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error
 * @param maybe - The Maybe to convert
 * @param onNone - Function to create the error when maybe is None
 * @returns Ok<T> if Some, Err<E> if None
 */
export const toResult = <T>(
  maybe: Maybe<T>,
  onNone: () => Error<unknown>
): Result<T, Error<unknown>> =>
  isSome(maybe) ? ok(maybe.value) : err(onNone());