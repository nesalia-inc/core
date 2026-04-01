/**
 * Type tests for Try types
 * These tests verify compile-time type relationships using @deessejs/type-testing
 */

import { check } from "@deessejs/type-testing";
import type { Try, TrySuccess, TryFailure } from "../../src/try/types";

// =============================================================================
// Try Type Definition
// =============================================================================

// Try<T, E> should be a union of TrySuccess<T> and TryFailure<E>
check<Try<number, Error>>().equals<TrySuccess<number> | TryFailure<Error>>();

// =============================================================================
// TrySuccess Type
// =============================================================================

// TrySuccess should have ok: true
check<TrySuccess<number>["ok"]>().equals<true>();

// TrySuccess should have value: T
check<TrySuccess<number>["value"]>().equals<number>();

// TrySuccess.map should return TrySuccess<U>
check<ReturnType<TrySuccess<number>["map"]>>().equals<TrySuccess<string>>();

// TrySuccess.flatMap should return Try<U, E>
check<ReturnType<TrySuccess<number>["flatMap"]>>().equals<Try<string, Error>>();

// TrySuccess.getOrElse should return T
check<ReturnType<TrySuccess<number>["getOrElse"]>>().equals<number>();

// TrySuccess.getOrCompute should return T | U
check<ReturnType<TrySuccess<number>["getOrCompute"]>>().equals<number | string>();

// TrySuccess.tap should return TrySuccess<T>
check<ReturnType<TrySuccess<number>["tap"]>>().equals<TrySuccess<number>>();

// TrySuccess.tapErr should return TrySuccess<T> (error tap on success is no-op)
check<ReturnType<TrySuccess<number>["tapErr"]>>().equals<TrySuccess<number>>();

// TrySuccess.match should call ok handler
check<ReturnType<TrySuccess<number>["match"]>>().equals<string>();

// =============================================================================
// TryFailure Type
// =============================================================================

// TryFailure should have ok: false
check<TryFailure<Error>["ok"]>().equals<false>();

// TryFailure should have error: E
check<TryFailure<Error>["error"]>().equals<Error>();

// TryFailure.map should return TryFailure<E> (value mapping on failure is no-op)
check<ReturnType<TryFailure<Error>["map"]>>().equals<TryFailure<Error>>();

// TryFailure.flatMap should return TryFailure<E> (chaining on failure is no-op)
check<ReturnType<TryFailure<Error>["flatMap"]>>().equals<TryFailure<Error>>();

// TryFailure.getOrElse should return T (takes default)
check<TryFailure<Error>["getOrElse"]>().equals<<T>(defaultValue: T) => T>();

// TryFailure.getOrCompute should return T | U (computes default)
check<TryFailure<Error>["getOrCompute"]>().equals<<T, U>(_fn: () => U) => T | U>();

// TryFailure.tap should return TryFailure<E> (tap on failure is no-op)
check<ReturnType<TryFailure<Error>["tap"]>>().equals<TryFailure<Error>>();

// TryFailure.tapErr should return TryFailure<E>
check<ReturnType<TryFailure<Error>["tapErr"]>>().equals<TryFailure<Error>>();

// TryFailure.match should call err handler
check<ReturnType<TryFailure<Error>["match"]>>().equals<string>();

// =============================================================================
// Default Error Type
// =============================================================================

// Try should default to Error type
type TryNumber = Try<number>;
type TryNumberWithError = Try<number, Error>;
check<TryNumber>().equals<TryNumberWithError>();
