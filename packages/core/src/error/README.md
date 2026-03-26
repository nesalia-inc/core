# Error System

A structured error handling system inspired by Python's exception classes. Provides domain-specific errors with rich metadata, enrichment capabilities, and Zod schema validation.

## Overview

The Error system complements the [Result type](../result/index.ts) by providing **rich error objects** with:
- Structured `args` for domain-specific error data
- `notes` for additional context
- `cause` chaining for error provenance
- Stack traces for debugging
- Zod validation of error arguments

## When to Use Error vs Result

| Use **Result** when: | Use **Error** when: |
|----------------------|---------------------|
| Chaining operations that may fail | Need rich error context for debugging |
| Railway-oriented programming | Building domain-specific errors |
| Simple success/failure propagation | Need error chaining (cause) |
| Pipeline transformations | Integrating with error tracking tools |

## Core Types

### Error\<T\>

The base error type with structured metadata and fluent methods:

```typescript
type Error<T = unknown> = Readonly<ErrorData<T>> & ErrorResult<T> & NativeError;
```

**ErrorData** provides the core properties:
```typescript
interface ErrorData<T> {
  readonly name: string;           // Error class name (e.g., "SizeError")
  readonly args: T;                // Domain-specific error data
  readonly notes: readonly string[]; // Additional context
  readonly cause: Maybe<Error>;   // Original error (Maybe<Error>)
  readonly stack?: string;         // Stack trace
  readonly message: string;         // Human-readable message
}
```

**ErrorResult** provides fluent methods for chaining and transformation:
```typescript
interface ErrorResult<T> {
  readonly ok: false;
  readonly error: Error<T>;       // Self-reference (e.error === e)
  isOk(): false;
  isErr(): true;
  map<U>(fn: (value: never) => U): Error<T>;
  flatMap<U>(fn: (value: never) => Error<U>): Error<T>;
  mapErr<F extends NativeError>(fn: (error: Error<T>) => F): Error<T>;
  getOrElse<T2>(defaultValue: T2): T2;
  getOrCompute<T2>(fn: () => T2): T2;
  tap(fn: (value: never) => void): Error<T>;
  tapErr(fn: (error: Error<T>) => void): Error<T>;
  match<U>(ok: (value: never) => U, err: (error: Error<T>) => U): U;
  unwrap(): never;
  addNotes(...notes: string[]): Error<T>;
  from(cause: Error | Maybe<Error>): Error<T>;
}
```

### ErrorBuilder\<T\>

A function that creates `Error<T>` with Zod validation:

```typescript
type ErrorBuilder<T> = (args: T) => Error<T>;
```

### ExtractError\<T\>

Extract the `Error<T>` type from an `ErrorBuilder<T>`:

```typescript
const SizeError = error({
  name: "SizeError",
  schema: z.object({
    current: z.number(),
    wanted: z.number(),
  }),
});

type SizeErrorType = ExtractError<typeof SizeError>;
// Error<{ current: number, wanted: number }>
```

### Self-Reference

Error has a unique property: `e.error === e`. This allows the error to be used both as a standalone error object and as a Result for chaining.

## Accessing cause

The `cause` field is `Maybe<Error>`. Use the Maybe API to safely access it:

```typescript
// Access cause name with default
error.cause.map(c => c.name).getOrElse('no cause');

// Check if cause exists
if (error.cause.isSome()) {
  console.log(error.cause.value.name);
}

// Chain through nested causes
error.cause
  .flatMap(c => c.cause)
  .map(c => c.name)
  .getOrElse('no cause');
```

## Usage

### Creating an Error Type

Use the `error()` factory to create domain-specific error classes:

```typescript
import { z } from "zod";
import { error } from "@deessejs/core";

// With schema - validates arguments
const SizeError = error({
  name: "SizeError",
  schema: z.object({
    current: z.number(),
    wanted: z.number(),
  }),
});

// Without schema - no validation
const SimpleError = error({
  name: "SimpleError",
});
```

### Creating Errors

Call the error builder:

```typescript
// With schema - validates arguments
const err = SizeError({ current: 3, wanted: 5 });

// err is Error<{ current: number, wanted: number }>
err.ok === false;              // true
err.name === "SizeError";      // true
err.args.current === 3;        // true
err.error === err;             // true (self-reference)

// Without schema - accepts any args
const simple = SimpleError({ message: "something went wrong" });
simple.args.message === "something went wrong";  // true
```

### Zod Validation

When a schema is provided, arguments are automatically validated. Invalid args return a validation error:

```typescript
SizeError({ current: "not a number" });
// Returns Error with name "SizeErrorValidationError"
```

### Custom Messages

Provide a custom message function:

```typescript
const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string() }),
  message: (args) => `Field "${args.field}" is invalid`,
});
```

## Enriching Errors

### addNotes()

Add contextual notes to an error after creation:

```typescript
const e = SizeError({ current: 3, wanted: 5 })
  .addNotes("Attempted to process file", "User: john");
```

### from()

Chain the cause of an error. Accepts `Error`, `Err<Error>`, or `Maybe<Error>`:

```typescript
const networkError = NetworkError({ host: "api.example.com" });
const e = SizeError({ current: 3, wanted: 5 })
  .from(networkError);  // Error object as cause
```

### Combining enrichments

```typescript
const e = SizeError({ current: 3, wanted: 5 })
  .addNotes("Processing file: data.json")
  .from(networkError)
  .addNotes("File processing failed");
```

## ErrorGroups

Group multiple errors together:

```typescript
import { exceptionGroup } from "@deessejs/core";

const errors = exceptionGroup([
  SizeError({ current: 3, wanted: 5 }),
  ValidationError({ field: "email" }),
]);
```

## Utilities

### Guards

Type guards for safe narrowing:

```typescript
import { isError, isErrorGroup, assertIsError } from "@deessejs/core";

isError(someValue);        // Type guard for Error
isErrorGroup(someValue);   // Type guard for ErrorGroup
```

### Assertion Functions

For control flow without conditional checks:

```typescript
import { assertIsError, assertIsErrorGroup } from "@deessejs/core";

// Throws if value is not an Error
assertIsError(value);
// value is Error here, TypeScript knows the type
```

### getErrorMessage()

Extract a human-readable message:

```typescript
import { getErrorMessage } from "@deessejs/core";

getErrorMessage(error);  // Returns error.message
getErrorMessage(group);  // Returns "ExceptionGroup: N error(s)"
```

### flattenErrorGroup()

Get all errors from a group:

```typescript
import { flattenErrorGroup } from "@deessejs/core";

flattenErrorGroup(group);  // Error[]
```

### filterErrorsByName()

Find errors by name in a group:

```typescript
import { filterErrorsByName } from "@deessejs/core";

filterErrorsByName(group, "SizeError");  // SizeError[]
```

## raise() - Functional Throw

Throw errors in a functional style for early exit:

```typescript
import { raise } from "@deessejs/core";

const decimal = (p: number, s: number): Result<Column, Error<...>> => {
  if (p < s) raise(DecimalError({ precision: p, scale: s }));
  return ok({ precision: p, scale: s });
};
```

`raise()` throws the error and returns `never`, making it suitable for early exit in Result-returning functions.

## API Reference

### error(options)

Creates an ErrorBuilder. Schema is optional.

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Error class name |
| `schema?` | `ZodSchema<T>` | Zod schema for args validation (optional) |
| `message?` | `(args: T) => string` | Custom message function |

### exceptionGroup(errors)

Creates an ErrorGroup from an array of errors.

### raise(error)

Throws the error and returns `never`.

### assertIsError(value)

Assertion function that throws if value is not an Error.

### assertIsErrorGroup(value)

Assertion function that throws if value is not an ErrorGroup.

## Type Compatibility

The `Error<T>` type is compatible with JavaScript's native `Error`:

```typescript
const e: Error = SizeError({ current: 3, wanted: 5 });
// Error is compatible with globalThis.Error
```

This allows integration with error tracking tools and standard error handling patterns.
