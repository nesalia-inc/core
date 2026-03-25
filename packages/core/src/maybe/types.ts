/**
 * Maybe type - represents optional values (Some or None)
 * Used for values that may or may not be present
 */

import type { Result } from "../result.js";

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
  equals(other: Maybe<T>): boolean;
  equals(other: Maybe<T>, comparator: (a: T, b: T) => boolean): boolean;
  filter<E extends globalThis.Error>(predicate: (value: T) => boolean, onNone?: () => E): Maybe<T> | Result<T, E>;
  map<U>(fn: (value: T) => U): Maybe<U>;
  flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U>;
  getOrElse(defaultValue: T): T;
  getOrCompute(fn: () => T): T;
  tap(fn: (value: T) => void): Maybe<T>;
}

/**
 * None type - represents an absent value
 */
export interface None {
  readonly ok: false;
  isSome(): false;
  isNone(): true;
  equals(other: Maybe<unknown>): boolean;
  equals(other: Maybe<unknown>, comparator: (a: unknown, b: unknown) => boolean): boolean;
  filter<T, E extends globalThis.Error>(predicate: (value: T) => boolean, onNone?: () => E): None | Result<T, E>;
  map<U>(fn: (value: never) => U): None;
  flatMap<U>(fn: (value: never) => Maybe<U>): None;
  getOrElse<T>(defaultValue: T): T;
  getOrCompute<T>(fn: () => T): T;
  tap(fn: (value: never) => void): None;
}