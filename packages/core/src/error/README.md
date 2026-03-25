# Error System

A structured error handling system inspired by Python's exception classes. Provides domain-specific errors with rich metadata, enrichment capabilities, and Zod schema validation.

## Overview

The Error system complements the [Result type](../result.ts) by providing **rich error objects** with:
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

The base error type with structured metadata:

```typescript
type Error<T = unknown> = Readonly<ErrorBase<T>> & NativeError;

interface ErrorBase<T> {
  readonly name: string;           // Error class name (e.g., "SizeError")
  readonly args: T;                 // Domain-specific error data
  readonly notes: readonly string[]; // Additional context
  readonly cause: NativeError | null; // Original error that caused this one
  readonly stack?: string;          // Stack trace
  readonly message: string;         // Human-readable message
}
```

### ErrorBuilder\<T\>

A function that creates `Err<Error<T>>` with Zod validation:

```typescript
type ErrorBuilder<T> = (args: T) => ErrWithMethods<T>;
```

### ErrWithMethods\<T\>

The result of calling an ErrorBuilder, extending `Err<Error<T>>` with fluent methods:

```typescript
interface ErrWithMethods<T> extends Err<Error<T>> {
  addNotes(...notes: string[]): ErrWithMethods<T>;
  from(cause: Error | Err<Error>): ErrWithMethods<T>;
}
```

## Usage

### Creating an Error Type

Use the `error()` factory to create domain-specific error classes:

```typescript
import { z } from "zod";
import { error } from "@deessejs/core";

const SizeError = error({
  name: "SizeError",
  schema: z.object({
    current: z.number(),
    wanted: z.number(),
  }),
});
```

### Creating Errors

Call the error builder with validated arguments:

```typescript
const result = SizeError({ current: 3, wanted: 5 });

// result is Err<Error<{ current: number, wanted: number }>>
result.ok === false;           // true
result.error.name === "SizeError";  // true
result.error.args.current === 3;     // true
```

### Zod Validation

Arguments are automatically validated. Invalid args return a validation error:

```typescript
SizeError({ current: "not a number" });
// Returns ErrWithMethods with name "SizeErrorValidationError"
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

Chain the cause of an error:

```typescript
const networkError = NetworkError({ host: "api.example.com" });
const e = SizeError({ current: 3, wanted: 5 })
  .from(networkError);  // networkError is the cause
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

Type guards for safe narrowing with exhaustive validation:

```typescript
import { isError, isErrorGroup, assertIsError } from "@deessejs/core";

isError(someValue);        // Type guard for Error (validates primitive types)
isErrorGroup(someValue);   // Type guard for ErrorGroup (uses .every())
```

#### Assertion Functions

For control flow without conditional checks:

```typescript
import { assertIsError, assertIsErrorGroup } from "@deessejs/core";

// Throws if value is not an Error
assertIsError(value);
// value is Error here, TypeScript knows the type

// With try/catch for handling invalid input
try {
  assertIsError(userInput);
  processError(userInput);
} catch {
  console.log("Not a valid error");
}
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

Throw errors in a functional style:

```typescript
import { raise } from "@deessejs/core";

const decimal = (p: number, s: number) => {
  if (p < s) raise(DecimalError({ precision: p, scale: s }));
  return ok({ precision: p, scale: s });
};
```

`raise()` throws the error and returns `never`, making it suitable for early exit in Result-returning functions.

## API Reference

### error(options)

Creates an ErrorBuilder with Zod schema validation.

| Option | Type | Description |
|--------|------|-------------|
| `name` | `string` | Error class name |
| `schema` | `ZodSchema<T>` | Zod schema for args validation |
| `message?` | `(args: T) => string` | Custom message function |

### exceptionGroup(errors)

Creates an ErrorGroup from an array of errors.

### raise(error)

Throws the error and returns `never`.

### assertIsError(value)

Assertion function that throws if value is not an Error:

```typescript
assertIsError(value);  // Throws TypeError if not an Error
```

### assertIsErrorGroup(value)

Assertion function that throws if value is not an ErrorGroup:

## Migration from Result\<T, E\>

Previously, `Result<string, string>` was valid. Now `E extends Error`:

```typescript
// Before (no longer works)
const result: Result<string, string> = err("error message");

// After
const result: Result<string, Error> = err(new Error("error message"));
const result = err(customError({ reason: "validation" }).error);
```

## Type Compatibility

The `Error<T>` type is compatible with JavaScript's native `Error`:

```typescript
const e: Error = SizeError({ current: 3, wanted: 5 }).error;
// Error is compatible with globalThis.Error
```

This allows integration with error tracking tools and standard error handling patterns.
