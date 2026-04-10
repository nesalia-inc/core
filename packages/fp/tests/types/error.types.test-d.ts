/**
 * Type tests for Error types
 * These tests verify compile-time type relationships using @deessejs/type-testing
 */

import { check, HasProperty, PropertyType } from "@deessejs/type-testing";
import type { Error, ErrorData, ErrorMethods, ErrorBuilder, ExtractError, NativeError, ErrorGroup, ErrorOptions } from "../../src/error/types";
import type { Maybe } from "../../src/maybe/types";

// =============================================================================
// NativeError Type
// =============================================================================

// NativeError should be an alias for globalThis.Error
check<NativeError>().equals<globalThis.Error>();

// =============================================================================
// ErrorData Type
// =============================================================================

// ErrorData should have name: string
check<HasProperty<ErrorData<unknown>, "name">>().equals<true>();
check<PropertyType<ErrorData<unknown>, "name">>().equals<string>();

// ErrorData should have args: T
check<HasProperty<ErrorData<{ code: string }>, "args">>().equals<true>();
check<PropertyType<ErrorData<{ code: string }>, "args">>().equals<{ readonly code: string }>();

// ErrorData should have notes: readonly string[]
check<HasProperty<ErrorData<unknown>, "notes">>().equals<true>();
check<PropertyType<ErrorData<unknown>, "notes">>().equals<readonly string[]>();

// ErrorData should have cause: Maybe<NativeError>
check<HasProperty<ErrorData<unknown>, "cause">>().equals<true>();
check<PropertyType<ErrorData<unknown>, "cause">>().equals<Maybe<NativeError>>();

// ErrorData should have message: string
check<HasProperty<ErrorData<unknown>, "message">>().equals<true>();

// ErrorData should have optional stack
check<HasProperty<ErrorData<unknown>, "stack">>().equals<true>();

// =============================================================================
// Error Type (intersection)
// =============================================================================

// Error<T> = Readonly<ErrorData<T>> & NativeError & ErrorMethods<T>
type ErrorTypeForCheck = Error<{ code: string }>;
type ExpectedErrorIntersection = Readonly<ErrorData<{ code: string }>> & globalThis.Error & ErrorMethods<{ code: string }>;
check<ErrorTypeForCheck>().equals<ExpectedErrorIntersection>();

// Error should have all ErrorData properties
check<HasProperty<Error<unknown>, "name">>().equals<true>();
check<HasProperty<Error<unknown>, "args">>().equals<true>();
check<HasProperty<Error<unknown>, "notes">>().equals<true>();
check<HasProperty<Error<unknown>, "cause">>().equals<true>();
check<HasProperty<Error<unknown>, "message">>().equals<true>();

// =============================================================================
// ErrorMethods Type
// =============================================================================

// ErrorMethods should have addNotes that returns Error<T>
type AddNotesFn = (...notes: string[]) => Error<unknown>;
check<ErrorMethods<unknown>["addNotes"]>().equals<AddNotesFn>();

// ErrorMethods should have from that accepts Error or Maybe<Error>
type FromFn = (cause: Error | Maybe<Error>) => Error<unknown>;
check<ErrorMethods<unknown>["from"]>().equals<FromFn>();

// =============================================================================
// ErrorBuilder Type
// =============================================================================

// ErrorBuilder<T> = (args?: T) => Error<T>
type ErrorBuilderFn = (_: { code: string }) => Error<{ code: string }>;
check<ErrorBuilder<{ code: string }>>().equals<ErrorBuilderFn>();

// =============================================================================
// ExtractError Type (conditional type)
// =============================================================================

// ExtractError should extract Error<E> from ErrorBuilder<E>
check<ExtractError<ErrorBuilder<{ code: string }>>>().equals<Error<{ code: string }>>();

// =============================================================================
// ErrorGroup Type
// =============================================================================

// ErrorGroup should have exceptions property
check<HasProperty<ErrorGroup, "exceptions">>().equals<true>();
check<PropertyType<ErrorGroup, "exceptions">>().equals<readonly Error[]>();

// =============================================================================
// ErrorOptions Type (for error factory)
// =============================================================================

// ErrorOptions should have name
check<HasProperty<ErrorOptions<unknown>, "name">>().equals<true>();

// ErrorOptions should have optional schema
check<HasProperty<ErrorOptions<unknown>, "schema">>().equals<true>();

// ErrorOptions should have optional message
check<HasProperty<ErrorOptions<unknown>, "message">>().equals<true>();
