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
  ResultTapBothHandlers,
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
export { tap, tapErr, tapBoth } from "./builder.js";

// Pattern matching
export { match } from "./builder.js";

// Conversion
export { toNullable, toUndefined, swap } from "./builder.js";

// Combinators
export { all, traverse } from "./builder.js";

// ============================================================================
// RESULT CLASS - Static-style API (DEP-0001)
// ============================================================================

import {
  map,
  flatMap,
  mapErr,
  tap,
  tapErr,
  tapBoth,
  getOrElse,
  getOrCompute,
  unwrap,
  match,
  toNullable,
  toUndefined,
  swap,
  all,
  traverse,
} from "./builder.js";
import { attempt, attemptAsync } from "../try/builder.js";
import { fromPromise } from "../async-result/builder.js";
import { toMaybeFromResult } from "../conversions.js";
import type { Result as ResultType } from "./types.js";
import type { Error } from "../error/types.js";
import type { AsyncResult } from "../async-result/index.js";

/**
 * Static-style API for Result operations.
 *
 * Provides curried functions for point-free style composition:
 *
 * @example
 * import { Result, ok } from '@deessejs/fp';
 *
 * const result = ok(5);
 * const doubled = Result.map((x: number) => x * 2)(result);
 *
 * const serialized = Result.serialize(ok({ id: "123" }));
 */
export class ResultTools {
  private constructor() {
    // Prevent instantiation - this class only provides static methods
  }

  static map<T, E extends Error, U>(fn: (value: T) => U) {
    return (result: ResultType<T, E>): ResultType<U, E> => map(result, fn);
  }

  static flatMap<T, E extends Error, U>(fn: (value: T) => ResultType<U, E>) {
    return (result: ResultType<T, E>): ResultType<U, E> => flatMap(result, fn);
  }

  static mapErr<T, E extends Error, F extends Error>(fn: (error: E) => F) {
    return (result: ResultType<T, E>): ResultType<T, F> => mapErr(result, fn);
  }

  static tap<T, E extends Error>(fn: (value: T) => void) {
    return (result: ResultType<T, E>): ResultType<T, E> => tap(result, fn);
  }

  static tapErr<T, E extends Error>(fn: (error: E) => void) {
    return (result: ResultType<T, E>): ResultType<T, E> => tapErr(result, fn);
  }

  static tapBoth<T, E extends Error>(handlers: { ok: (value: T) => void; err: (error: E) => void }) {
    return (result: ResultType<T, E>): ResultType<T, E> => tapBoth(result, handlers);
  }

  static getOrElse<T, E extends Error>(defaultValue: T) {
    return (result: ResultType<T, E>): T => getOrElse(result, defaultValue);
  }

  static getOrCompute<T, E extends Error, U>(fn: () => U) {
    return (result: ResultType<T, E>): T | U => getOrCompute(result, fn);
  }

  static unwrap<T, E extends Error>(result: ResultType<T, E>): T {
    return unwrap(result);
  }

  static unwrapOr<T, E extends Error>(result: ResultType<T, E>, defaultValue: T): T {
    return getOrElse(result, defaultValue);
  }

  static unwrapOrCompute<T, E extends Error>(result: ResultType<T, E>, fn: () => T): T {
    return getOrCompute(result, fn);
  }

  static match<T, E extends Error, U>(onOk: (value: T) => U, onErr: (error: E) => U) {
    return (result: ResultType<T, E>): U => match(result, onOk, onErr);
  }

  static swap<T, E extends Error>(result: ResultType<T, E>): unknown {
    return swap(result);
  }

  static toNullable<T, E extends Error>(result: ResultType<T, E>): T | null {
    return toNullable(result);
  }

  static toUndefined<T, E extends Error>(result: ResultType<T, E>): T | undefined {
    return toUndefined(result);
  }

  static toMaybe<T, E extends Error>(result: ResultType<T, E>) {
    return toMaybeFromResult(result);
  }

  static all<T, E extends Error>(...results: Array<ResultType<T, E>>): ResultType<T[], E> {
    return all(...results);
  }

  static traverse<T, U, E extends Error>(
    items: readonly T[],
    fn: (item: T) => ResultType<U, E>
  ): ResultType<U[], E> {
    return traverse(items, fn);
  }

  static fromPromise<T, E = Error>(
    promise: Promise<T>,
    onErrorOrOptions?: ((error: unknown) => E) | { signal?: AbortSignal },
    options?: { signal?: AbortSignal }
  ): AsyncResult<T, E> {
    return fromPromise(promise, onErrorOrOptions, options);
  }

  static attempt = attempt;

  static attemptAsync = attemptAsync;
}
