/**
 * Maybe type - represents optional values (Some or None)
 * Used for values that may or may not be present
 */

import { type Result } from "../result/index.js";
import { type Error } from "../error/types.js";

/**
 * Maybe type - union of Some and None
 * @typeParam T - The type of the value if present
 */
export type Maybe<T> = Some<T> | None;

/**
 * Some type - represents a present value
 * @typeParam T - The type of the value
 */
export interface Some<T> {
  readonly ok: true;
  readonly value: T;
  isSome(): true;
  isNone(): false;
  equals(other: Maybe<T>, comparator?: (a: T, b: T) => boolean): boolean;
  filter(predicate: (value: T) => boolean): Maybe<T>;
  map<U>(fn: (value: T) => U): Maybe<U>;
  flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U>;
  getOrElse(defaultValue: T): T;
  getOrCompute(fn: () => T): T;
  tap(fn: (value: T) => void): Maybe<T>;
  toResult(onNone: () => Error<unknown>): Result<T, Error<unknown>>;
}

/**
 * None type - represents an absent value
 * Note: equals uses Maybe<unknown> because None has no value type T.
 * This is a deliberate design choice - None.equals only checks if other is also None.
 */
export interface None {
  readonly ok: false;
  isSome(): false;
  isNone(): true;
  equals(other: Maybe<unknown>, comparator?: (a: unknown, b: unknown) => boolean): boolean;
  filter(predicate: (value: unknown) => boolean): None;
  map<U>(fn: (value: never) => U): None;
  flatMap<U>(fn: (value: never) => Maybe<U>): None;
  getOrElse<T>(defaultValue: T): T;
  getOrCompute<T>(fn: () => T): T;
  tap(fn: (value: never) => void): None;
  toResult(onNone: () => Error<unknown>): Result<never, Error<unknown>>;
}