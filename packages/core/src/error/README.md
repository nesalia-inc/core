# Error System

A structured error handling system inspired by Python's exception classes. Provides domain-specific errors with rich metadata, enrichment capabilities, and Zod schema validation.

## Overview

The Error system complements the [Result type](../result/index.ts) by providing **rich error objects** with:
- Structured `args` for domain-specific error data
- `notes` for additional context
- `cause` chaining for error provenance
- Stack traces for debugging
- Zod validation of error arguments

## Design Philosophy

**Error<T>** is a plain error object. It does NOT carry Result methods. This separation of concerns makes Error a pure domain error container, while Result provides the chaining/railway-oriented programming.

```typescript
// Error<T> is just an error object
const domainError = SizeError({ current: 3, wanted: 5 });
domainError.name;     // "SizeError"
domainError.args;     // { current: 3, wanted: 5 }
domainError.addNotes("context");  // Error method
domainError.from(cause);         // Error method

// Wrap with err() to get Result methods
const result = err(domainError);
result.ok === false;           // Result methods from err()
result.error === domainError;  // reference to original error
```

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
type Error<T = unknown> = Readonly<ErrorData<T>> & ErrorMethods<T> & NativeError;
```

**ErrorData** provides the core properties:
```typescript
interface ErrorData<T> {
  readonly name: string;              // Error class name (e.g., "SizeError")
  readonly args: T;                  // Domain-specific error data
  readonly notes: readonly string[];  // Additional context
  readonly cause: Maybe<Error>;       // Original error (Maybe<Error>)
  readonly stack?: string;            // Stack trace
  readonly message: string;           // Human-readable message
}
```

**ErrorMethods** provides Error-specific enrichment methods:
```typescript
interface ErrorMethods<T> {
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
const domainError = SizeError({ current: 3, wanted: 5 });

// Without schema - still requires {} even with no args
const simpleError = SimpleError({});  // Always pass {} as args

// domainError is just an Error, not a Result
domainError.name === "SizeError";      // true
domainError.args.current === 3;        // true

// Use err() to wrap as Result for chaining
const result = err(domainError);
result.ok === false;                    // true
result.error === domainError;           // reference, not self
```

Note: Even when an error type has no schema (no args), you must still call it with `{}` since the builder function signature requires an argument.

### Using with Result

Error objects integrate with the Result system via `err()`:

```typescript
const result = ok(10).flatMap((x) => {
  if (x > 5) {
    return err(SizeError({ current: x, wanted: 5 }));
  }
  return ok(x * 2);
});

result.mapErr((e) => console.log(e.name));
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

// Or from a Result containing an Error
const result = err(networkError);
const e2 = SizeError({ current: 3, wanted: 5 }).from(result);
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

`raise()` throws the error and returns `never`. It should only be used for **unrecoverable programmer errors** - situations where you intentionally want to halt execution because continuing would be a bug, not an expected failure.

```typescript
import { raise } from "@deessejs/core";

// Only for unrecoverable errors - things that indicate a bug
const process = (size: number): Result<Data, Error> => {
  if (size > MAX_SIZE) {
    raise(SizeError({ current: size, wanted: MAX_SIZE })); // Halts execution
  }
  return ok({ size });
};
```

### When NOT to use raise()

For expected failures (validation, business rules, network errors), use `err()` to propagate errors through the Result rail:

```typescript
import { error, err } from "@deessejs/core";

const EmptyInputError = error({
  name: "EmptyInputError",
  message: () => "Empty input",
});

// Bad - breaks the rail for expected failures
const validateBad = (input: string): Result<string, Error> => {
  if (!input) raise(EmptyInputError({}));  // Never do this!
  return ok(input);
};

// Good - error travels through the rail
const validate = (input: string): Result<string, Error> => {
  if (!input) return err(EmptyInputError({}));
  return ok(input);
};
```

**Summary**: Use `err()` for expected failures. Reserve `raise()` only for unrecoverable programmer errors.

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
