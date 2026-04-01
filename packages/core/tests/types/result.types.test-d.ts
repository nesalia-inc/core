/**
 * Type tests for Result types
 * These tests verify compile-time type relationships using @deessejs/type-testing
 */

import { check } from "@deessejs/type-testing";
import type { Ok, Err, Result, Success, ExtractResultError } from "../../src/result/types";
import type { Error } from "../../src/error/types";

// =============================================================================
// Result Type Definition
// =============================================================================

// Result<T, E> should be a union of Ok<T, E> and Err<E>
check<Result<number, Error>>().equals<Ok<number, Error> | Err<Error>>();

// =============================================================================
// Ok Type
// =============================================================================

// Ok should have ok: true
check<Ok<number, Error>["ok"]>().equals<true>();

// Ok should have value: T
check<Ok<number, Error>["value"]>().equals<number>();

// Ok.isOk() should return true
check<ReturnType<Ok<number, Error>["isOk"]>>().equals<true>();

// Ok.isErr() should return false
check<ReturnType<Ok<number, Error>["isErr"]>>().equals<false>();

// Ok.map should return Ok<U, E>
check<ReturnType<Ok<number, Error>["map"]>>().equals<Ok<string, Error>>();

// Ok.flatMap should return Result<U, E>
check<ReturnType<Ok<number, Error>["flatMap"]>>().equals<Result<string, Error>>();

// Ok.mapErr should return Ok<T, E> (error mapping on Ok is no-op)
check<ReturnType<Ok<number, Error>["mapErr"]>>().equals<Ok<number, Error>>();

// =============================================================================
// Err Type
// =============================================================================

// Err should have ok: false
check<Err<Error>["ok"]>().equals<false>();

// Err should have error: E
check<Err<Error>["error"]>().equals<Error>();

// Err.isOk() should return false
check<ReturnType<Err<Error>["isOk"]>>().equals<false>();

// Err.isErr() should return true
check<ReturnType<Err<Error>["isErr"]>>().equals<true>();

// Err.map should return Err<E> (value mapping on Err is no-op)
check<ReturnType<Err<Error>["map"]>>().equals<Err<Error>>();

// Err.flatMap should return Err<E> (chaining on Err is no-op)
check<ReturnType<Err<Error>["flatMap"]>>().equals<Err<Error>>();

// Err.mapErr should return Err<F>
check<ReturnType<Err<Error>["mapErr"]>>().equals<Err<Error>>();

// =============================================================================
// Success Type (alias for Result<T, never>)
// =============================================================================

// Success<T> should equal Result<T, never>
check<Success<number>>().equals<Result<number, never>>();

// =============================================================================
// ExtractResultError - conditional type
// =============================================================================

// ExtractResultError should extract error from () => Result<unknown, E>
check<ExtractResultError<() => Result<number, Error>>>().equals<Error>();

// ExtractResultError should extract error from (args: any) => Result<unknown, E>
check<ExtractResultError<(arg: string) => Result<number, Error>>>().equals<Error>();

// ExtractResultError should return never for non-Result return types
check<ExtractResultError<() => number>>().equals<never>();

// =============================================================================
// match method types
// =============================================================================

// Ok.match should work with function form
check<ReturnType<Ok<number, Error>["match"]>>().equals<number>();

// Err.match should work with function form
check<ReturnType<Err<Error>["match"]>>().equals<never>();
