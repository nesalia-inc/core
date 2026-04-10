/**
 * Type tests for AsyncResult types
 * These tests verify compile-time type relationships using @deessejs/type-testing
 */

import { check, HasProperty } from "@deessejs/type-testing";
import type { AsyncResult, AsyncOk, AsyncErr, AsyncResultInner, AbortError } from "../../src/async-result/types";
import type { Error } from "../../src/error/types";

// =============================================================================
// AsyncOk Type
// =============================================================================

// AsyncOk should have ok: true
check<AsyncOk<number>["ok"]>().equals<true>();

// AsyncOk should have value: T
check<AsyncOk<number>["value"]>().equals<number>();

// =============================================================================
// AsyncErr Type
// =============================================================================

// AsyncErr should have ok: false
check<AsyncErr<Error>["ok"]>().equals<false>();

// AsyncErr should have error: E
check<AsyncErr<Error>["error"]>().equals<Error>();

// =============================================================================
// AsyncResultInner Type (union)
// =============================================================================

// AsyncResultInner<T, E> should be a union of AsyncOk<T> and AsyncErr<E>
check<AsyncResultInner<number, Error>>().equals<AsyncOk<number> | AsyncErr<Error>>();

// =============================================================================
// AsyncResult Interface
// =============================================================================

// AsyncResult should have ok: boolean | undefined (before resolution it's undefined)
check<AsyncResult<number, Error>["ok"]>().equals<boolean | undefined>();

// AsyncResult should have value: T
check<HasProperty<AsyncResult<number, Error>, "value">>().equals<true>();

// AsyncResult should have error: E
check<HasProperty<AsyncResult<number, Error>, "error">>().equals<true>();

// =============================================================================
// AsyncResult.then method
// =============================================================================

// AsyncResult.then should have correct signature
type ThenFn = (onfulfilled?: (value: AsyncResultInner<number, Error>) => unknown, onrejected?: (reason: Error) => unknown) => Promise<unknown>;
check<AsyncResult<number, Error>["then"]>().equals<ThenFn>();

// =============================================================================
// AsyncResult.map method
// =============================================================================

// AsyncResult.map should return AsyncResult<U, E>
check<ReturnType<AsyncResult<number, Error>["map"]>>().equals<AsyncResult<string, Error>>();

// =============================================================================
// AsyncResult.mapErr method
// =============================================================================

// AsyncResult.mapErr should return AsyncResult<T, F>
check<ReturnType<AsyncResult<number, Error>["mapErr"]>>().equals<AsyncResult<number, Error>>();

// =============================================================================
// AsyncResult.flatMap method
// =============================================================================

// AsyncResult.flatMap should return AsyncResult<U, E>
check<ReturnType<AsyncResult<number, Error>["flatMap"]>>().equals<AsyncResult<string, Error>>();

// =============================================================================
// AsyncResult.getOrElse method
// =============================================================================

// AsyncResult.getOrElse should return Promise<T>
check<ReturnType<AsyncResult<number, Error>["getOrElse"]>>().equals<Promise<number>>();

// =============================================================================
// AsyncResult.match method
// =============================================================================

// AsyncResult.match should return Promise<U>
check<ReturnType<AsyncResult<number, Error>["match"]>>().equals<Promise<string>>();

// =============================================================================
// AsyncResult.toNullable method
// =============================================================================

// AsyncResult.toNullable should return Promise<T | null>
check<ReturnType<AsyncResult<number, Error>["toNullable"]>>().equals<Promise<number | null>>();

// =============================================================================
// AsyncResult.toUndefined method
// =============================================================================

// AsyncResult.toUndefined should return Promise<T | undefined>
check<ReturnType<AsyncResult<number, Error>["toUndefined"]>>().equals<Promise<number | undefined>>();

// =============================================================================
// AsyncResult.unwrap method
// =============================================================================

// AsyncResult.unwrap should return Promise<T>
check<ReturnType<AsyncResult<number, Error>["unwrap"]>>().equals<Promise<number>>();

// =============================================================================
// AsyncResult.unwrapOr method
// =============================================================================

// AsyncResult.unwrapOr should return Promise<T>
check<ReturnType<AsyncResult<number, Error>["unwrapOr"]>>().equals<Promise<number>>();

// =============================================================================
// AsyncResult.toPromise method
// =============================================================================

// AsyncResult.toPromise should return Promise<AsyncResultInner<T, E>>
check<ReturnType<AsyncResult<number, Error>["toPromise"]>>().equals<Promise<AsyncResultInner<number, Error>>>();

// =============================================================================
// AbortError Type
// =============================================================================

// AbortError should extend Error
type AbortErrorExtendsError = AbortError extends Error ? true : false;
check<AbortErrorExtendsError>().equals<true>();

// AbortError should have name: "AbortError"
check<AbortError["name"]>().equals<"AbortError">;
