/**
 * Type tests for Maybe types
 * These tests verify compile-time type relationships using @deessejs/type-testing
 */

import { check } from "@deessejs/type-testing";
import type { Maybe, Some, None } from "../../src/maybe/types";
import type { Result } from "../../src/result/types";
import type { Error } from "../../src/error/types";

// =============================================================================
// Maybe Type Definition
// =============================================================================

// Maybe<T> should be a union of Some<T> and None
check<Maybe<number>>().equals<Some<number> | None>();

// =============================================================================
// Some Type
// =============================================================================

// Some should have ok: true
check<Some<number>["ok"]>().equals<true>();

// Some should have value: T
check<Some<number>["value"]>().equals<number>();

// Some.isSome() should return true
check<ReturnType<Some<number>["isSome"]>>().equals<true>();

// Some.isNone() should return false
check<ReturnType<Some<number>["isNone"]>>().equals<false>();

// Some.equals should accept Maybe<T>
type SomeEqualsFn = (other: Maybe<number>) => boolean;
check<Some<number>["equals"]>().equals<SomeEqualsFn>();

// Some.equals with comparator should work
type SomeEqualsWithComparatorFn = (other: Maybe<number>, comparator: (a: number, b: number) => boolean) => boolean;
check<Some<number>["equals"]>().equals<SomeEqualsWithComparatorFn>();

// Some.filter should return Maybe<T>
check<ReturnType<Some<number>["filter"]>>().equals<Maybe<number>>();

// Some.map should return Maybe<U>
check<ReturnType<Some<number>["map"]>>().equals<Maybe<string>>();

// Some.flatMap should return Maybe<U>
check<ReturnType<Some<number>["flatMap"]>>().equals<Maybe<string>>();

// Some.getOrElse should return T
check<ReturnType<Some<number>["getOrElse"]>>().equals<number>();

// Some.getOrCompute should return T
check<ReturnType<Some<number>["getOrCompute"]>>().equals<number>();

// Some.tap should return Maybe<T>
check<ReturnType<Some<number>["tap"]>>().equals<Maybe<number>>();

// Some.toResult should return Result<T, Error<unknown>>
check<ReturnType<Some<number>["toResult"]>>().equals<Result<number, Error<unknown>>>();

// =============================================================================
// None Type
// =============================================================================

// None should have ok: false
check<None["ok"]>().equals<false>();

// None.isSome() should return false
check<ReturnType<None["isSome"]>>().equals<false>();

// None.isNone() should return true
check<ReturnType<None["isNone"]>>().equals<true>();

// None.equals uses Maybe<unknown> - deliberate design choice since None has no value type T
check<None["equals"]>().equals<(other: Maybe<unknown>) => boolean>();

// None.equals with comparator uses Maybe<unknown>
type NoneEqualsWithComparatorFn = (other: Maybe<unknown>, comparator: (a: unknown, b: unknown) => boolean) => boolean;
check<None["equals"]>().equals<NoneEqualsWithComparatorFn>();

// None.filter should return None
check<ReturnType<None["filter"]>>().equals<None>();

// None.map should return None (never input)
check<ReturnType<None["map"]>>().equals<None>();

// None.flatMap should return None (never input)
check<ReturnType<None["flatMap"]>>().equals<None>();

// None.getOrElse should return T (takes default)
check<None["getOrElse"]>().equals<<T>(defaultValue: T) => T>();

// None.getOrCompute should return T (computes default)
check<None["getOrCompute"]>().equals<<T>(_fn: () => T) => T>();

// None.tap should return None (never input)
check<ReturnType<None["tap"]>>().equals<None>();

// None.toResult should return Result<never, Error<unknown>>
check<ReturnType<None["toResult"]>>().equals<Result<never, Error<unknown>>>();
