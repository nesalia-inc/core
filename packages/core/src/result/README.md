# Result Type

A simple, composable error handling type for representing success or failure. Uses railway-oriented programming patterns for chaining operations.

## Overview

The Result type is designed for **simple error handling** without the rich domain metadata of the [Error system](./error/index.ts):

- `Ok<T>` represents success with a value of type `T`
- `Err<E>` represents failure with an error of type `E`
- Fluent API for chaining and transforming results
- Error type constrained to `E extends Error`

## When to Use Result vs Error

| Use **Result** when: | Use **Error** when: |
|----------------------|---------------------|
| Chaining operations that may fail | Need rich error context for debugging |
| Railway-oriented programming | Building domain-specific errors |
| Simple success/failure propagation | Need error chaining (cause) |
| Pipeline transformations | Integrating with error tracking tools |

## Core Types

### Result\<T, E\>

A union type representing either success or failure:

```typescript
type Result<T, E extends NativeError = NativeError> = Ok<T, E> | Err<E>;
```

### Ok\<T, E\>

Represents a successful result:

```typescript
type Ok<T, E extends NativeError = NativeError> = {
  readonly ok: true;
  readonly value: T;
  isOk(): true;
  isErr(): false;
  map<U>(fn: (value: T) => U): Ok<U, E>;
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
  mapErr<F extends Error>(fn: (error: never) => F): Ok<T, E>;
  getOrElse(defaultValue: T): T;
  getOrCompute<U>(fn: () => U): T | U;
  tap(fn: (value: T) => void): Ok<T, E>;
  tapErr(fn: (error: E) => void): Ok<T, E>;
  match<U>(ok: (value: T) => U, err: (error: E) => U): U;
  unwrap(): T;
};
```

### Err\<E\>

Represents a failed result:

```typescript
type Err<E extends NativeError = NativeError> = {
  readonly ok: false;
  readonly error: E;
  isOk(): false;
  isErr(): true;
  map<U>(fn: (value: never) => U): Err<E>;
  flatMap<U>(fn: (value: never) => Result<U, E>): Err<E>;
  mapErr<F extends Error>(fn: (error: E) => F): Err<F>;
  getOrElse<T>(defaultValue: T): T;
  getOrCompute<T, U>(fn: () => U): T | U;
  tap(fn: (value: never) => void): Err<E>;
  tapErr(fn: (error: E) => void): Err<E>;
  match<U>(ok: (value: never) => U, err: (error: E) => U): U;
  unwrap(): never;
};
```

### Success\<T\>

An alias for `Result<T, never>` when a function cannot fail:

```typescript
type Success<T> = Result<T, never>;
```

## Usage

### Creating Results

```typescript
import { ok, err, error } from "@deessejs/core";

// Success
const result: Result<number, Error> = ok(42);

// Failure - use error() factory for structured errors
const SomeError = error({
  name: "SomeError",
  message: () => "something went wrong",
});

const result2: Result<number, Error> = err(SomeError({}));
```

Note: Always use the Error system (`error()` factory) for structured errors with enrichment support (`addNotes()`, `from()`).

### Using with Error System

The error type should extend `Error` from the error system:

```typescript
import { ok, err, error } from "@deessejs/core";
import { z } from "zod";

const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string() }),
});

const validate = (field: string): Result<string, Error> => {
  if (!field) {
    return err(ValidationError({ field }));
  }
  return ok(field);
};
```

### Chaining Operations

```typescript
const result = ok(5)
  .map((n) => n * 2)           // Ok(10)
  .map((n) => n + 1)           // Ok(11)
  .mapErr((e) => e)            // Ok(11) - no-op on Ok
  .getOrElse(0);               // 11
```

### Never Break the Rail

In railway-oriented programming, errors should travel through the Result without breaking the flow. Never use `throw` or `raise()` for expected failures:

```typescript
import { error } from "@deessejs/core";

const DivisionError = error({
  name: "DivisionError",
  message: () => "Division by zero",
});

// Bad - breaks the rail
const divideBad = (a: number, b: number): Result<number, Error> => {
  if (b === 0) throw new Error("Division by zero");
  return ok(a / b);
};

// Good - error travels through the rail
const divide = (a: number, b: number): Result<number, Error> => {
  if (b === 0) return err(DivisionError({}));
  return ok(a / b);
};
```

Use `err()` to propagate errors, not `throw`. The only exception is for unrecoverable programmer errors where you want to halt execution.

### flatMap for Fallible Operations

```typescript
import { error } from "@deessejs/core";

const ParseError = error({
  name: "ParseError",
  message: (args: { value: string }) => `Cannot parse "${args.value}"`,
});

const NegativeError = error({
  name: "NegativeError",
  message: () => "Value must be positive",
});

const parseNumber = (s: string): Result<number, Error> => {
  const n = parseInt(s, 10);
  return isNaN(n) ? err(ParseError({ value: s })) : ok(n);
};

const result = ok("42")
  .flatMap(parseNumber)         // Ok(42)
  .flatMap((n) => n > 0 ? ok(n) : err(NegativeError({})));  // Ok(42)
```

Note: Use `err()` to propagate errors, not `throw`. Errors should always travel through the Result rail.

### Matching

```typescript
const result = validate(input);

const message = result.match(
  (value) => `Success: ${value}`,
  (error) => `Error: ${error.message}`
);
```

### Combining Results

```typescript
import { all, error } from "@deessejs/core";

const FailError = error({
  name: "FailError",
  message: () => "fail",
});

const results = all(
  ok(1),
  ok(2),
  ok(3)
);  // Ok([1, 2, 3])

const withFailure = all(
  ok(1),
  err(FailError({})),
  ok(3)
);  // Err(FailError({})) - fail-fast
```

### Never Break the Rail

Errors should propagate through the Result type, not be thrown. This keeps the rail intact and allows proper error enrichment:

```typescript
import { error } from "@deessejs/core";

const ValidationError = error({
  name: "ValidationError",
  message: (args: { field: string }) => `"${args.field}" is invalid`,
});

// Good - error travels through the rail
const validateInput = (input: string): Result<string, Error> => {
  if (!input) return err(ValidationError({ field: "input" }));
  return ok(input);
};

// Bad - breaks the rail for expected failures
const validateInputBad = (input: string): Result<string, Error> => {
  if (!input) throw new Error("Empty input");  // Never do this!
  return ok(input);
};
```

Use `err()` to carry errors forward. Reserve `throw`/`raise()` only for unrecoverable programmer errors.

### Error Transformation

```typescript
import { error } from "@deessejs/core";

const OriginalError = error({
  name: "OriginalError",
  message: () => "original",
});

const CustomError = error({
  name: "CustomError",
  message: (args: { message: string }) => args.message,
});

const result = err(OriginalError({}));

result.mapErr((e) => CustomError({ message: e.message }));
// Err(CustomError({ message: "original" }))
```

Use the Error system for structured errors with enrichment support (`addNotes()`, `from()`).

## API Reference

### Builders

#### ok(value)

Creates a successful result:

```typescript
ok(42);  // Ok<number>
```

#### err(error)

Creates a failed result:

```typescript
import { error } from "@deessejs/core";

const FailError = error({ name: "FailError", message: () => "failed" });
err(FailError({}));  // Err<FailError>
```

### Type Guards

#### isOk(result)

```typescript
isOk(ok(1));   // true
isOk(err(e));  // false
```

#### isErr(result)

```typescript
isErr(ok(1));   // false
isErr(err(e));  // true
```

### Transformations

#### map(result, fn)

Transforms the value if Ok:

```typescript
map(ok(5), (n) => n * 2);  // Ok(10)
map(err(e), (n) => n * 2); // Err(e)
```

#### flatMap(result, fn)

Chains a fallible operation:

```typescript
flatMap(ok(5), (n) => ok(n * 2));  // Ok(10)
flatMap(ok(5), (n) => err(e));      // Err(e)
```

#### mapErr(result, fn)

Transforms the error if Err:

```typescript
mapErr(err(e), (e) => new CustomError(e.message));  // Err(CustomError)
mapErr(ok(5), (e) => new CustomError(e.message));  // Ok(5)
```

### Side Effects

#### tap(result, fn)

Executes function if Ok, returns result unchanged:

```typescript
tap(ok(5), (n) => console.log(n));  // Ok(5), logs "5"
tap(err(e), (n) => console.log(n));  // Err(e), no log
```

#### tapErr(result, fn)

Executes function if Err, returns result unchanged:

```typescript
tapErr(ok(5), (e) => console.log(e));  // Ok(5), no log
tapErr(err(e), (e) => console.log(e)); // Err(e), logs error
```

### Extraction

#### getOrElse(result, defaultValue)

Returns value if Ok, default otherwise:

```typescript
getOrElse(ok(5), 0);   // 5
getOrElse(err(e), 0);   // 0
```

#### getOrCompute(result, fn)

Returns value if Ok, computes default otherwise:

```typescript
getOrCompute(ok(5), () => computeDefault());   // 5
getOrCompute(err(e), () => computeDefault());   // result of computeDefault()
```

#### unwrap(result)

Returns value if Ok, throws if Err:

```typescript
unwrap(ok(5));   // 5
unwrap(err(e));  // throws e
```

### Matching

#### match(result, okFn, errFn)

Executes appropriate function based on variant:

```typescript
match(
  ok(5),
  (v) => `Got ${v}`,
  (e) => `Error: ${e.message}`
);  // "Got 5"
```

### Combination

#### all(...results)

Combines multiple Results (fail-fast):

```typescript
all(ok(1), ok(2), ok(3));  // Ok([1, 2, 3])
all(ok(1), err(e), ok(3)); // Err(e)
```

### Conversion

#### toNullable(result)

```typescript
toNullable(ok(5));   // 5
toNullable(err(e)); // null
```

#### toUndefined(result)

```typescript
toUndefined(ok(5));   // 5
toUndefined(err(e)); // undefined
```

#### swap(result)

Swaps Ok and Err:

```typescript
swap(ok(5));  // Err(5)
swap(err(e)); // Ok(e)
```

### Utilities

#### ExtractError\<T\>

Extracts the error type from a function returning Result:

```typescript
const myFn = (): Result<string, CustomError> => ok("hi");

type MyError = ExtractError<typeof myFn>;  // CustomError
```
