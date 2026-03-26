# Try Type

A functional `Try` type for TypeScript - wraps try/catch in a type-safe way. The essential bridge between JavaScript's exception-based error handling and the functional Result type.

## Overview

The `Try` type transforms code that throws exceptions into typed results. It's the bridge between the "impure" world of JavaScript (where any function can throw) and the "pure" world of functional programming (where errors are values).

```typescript
type Try<T, E = Error> = TrySuccess<T> | TryFailure<E>;
```

## When to Use Try

| Use **Try** when: | Use **Result** when: |
|-------------------|---------------------|
| Wrapping try/catch blocks | Chaining operations that may fail |
| Dealing with async operations | Railway-oriented programming |
| Converting exceptions to values | Simple success/failure propagation |

## Core Types

### Try\<T, E\>

Union of `TrySuccess<T>` and `TryFailure<E>`:

```typescript
type Try<T, E = Error> = TrySuccess<T> | TryFailure<E>;
```

### TrySuccess\<T\>

Represents a successful computation:

```typescript
interface TrySuccess<T> {
  readonly ok: true;
  readonly value: T;
  map<U>(fn: (value: T) => U): TrySuccess<U>;
  flatMap<U, E>(fn: (value: T) => Try<U, E>): Try<U, E>;
  getOrElse(defaultValue: T): T;
  getOrCompute<U>(fn: () => U): T | U;
  tap(fn: (value: T) => void): TrySuccess<T>;
  tapErr(fn: (error: never) => void): TrySuccess<T>;
  match<U>(ok: (value: T) => U, err: (error: never) => U): U;
}
```

### TryFailure\<E\>

Represents a failed computation:

```typescript
interface TryFailure<E> {
  readonly ok: false;
  readonly error: E;
  map<U>(_fn: (value: never) => U): TryFailure<E>;
  flatMap<U>(_fn: (value: never) => Try<U, E>): TryFailure<E>;
  getOrElse<T>(defaultValue: T): T;
  getOrCompute<T, U>(fn: () => U): T | U;
  tap(_fn: (value: never) => void): TryFailure<E>;
  tapErr(fn: (error: E) => void): TryFailure<E>;
  match<U>(_ok: (value: never) => U, err: (error: E) => U): U;
}
```

## Usage

### Basic try/catch

```typescript
import { attempt } from "@deessejs/core";

// Wrap a function that may throw
const result = attempt(() => JSON.parse(userInput));

if (result.ok) {
  console.log("Parsed:", result.value);
} else {
  console.error("Failed:", result.error.message);
}
```

### With async operations

```typescript
import { attemptAsync } from "@deessejs/core";

const result = await attemptAsync(() => fetch("/api/user").then(r => r.json()));

if (result.ok) {
  console.log("User:", result.value);
} else {
  console.error("Failed:", result.error.message);
}
```

### With custom error handler

```typescript
import { attempt, error } from "@deessejs/core";

const DatabaseError = error({ name: "DatabaseError" });

// Transform native errors into typed errors
const result = attempt(
  () => connectToDatabase(),
  (caught) => DatabaseError({ message: caught.message })
);
```

### Chaining operations

```typescript
import { attempt, map, flatMap } from "@deessejs/core";

const result = attempt(() => fetchUser(id))
  .flatMap(user => attempt(() => fetchOrders(user.id)))
  .map(orders => orders.filter(o => o.active))
  .getOrElse([]);
```

### Using match

```typescript
import { attempt, match } from "@deessejs/core";

const result = await attemptAsync(() => fetchData());

// Pattern matching style
const data = match(result,
  value => `Success: ${value.name}`,
  error => `Error: ${error.message}`
);
```

## API Reference

### attempt()

Wraps a synchronous function in try/catch.

```typescript
// Simple usage - returns Try<T, Error>
attempt(() => JSON.parse(input))

// With custom error handler - returns Try<T, E>
attempt(
  () => riskyOperation(),
  (caught) => MyError({ cause: caught.message })
)
```

### attemptAsync()

Wraps an async function in try/catch.

```typescript
// Simple usage
await attemptAsync(() => fetch("/api").then(r => r.json()))

// With custom error handler
await attemptAsync(
  () => fetchData(),
  (caught) => NetworkError({ originalError: caught.message })
)
```

### Methods

All methods from `TrySuccess` and `TryFailure` are available:

- `map(fn)` - Transform the value if success
- `flatMap(fn)` - Chain another Try if success
- `getOrElse(default)` - Get value or default
- `getOrCompute(fn)` - Get value or compute default
- `tap(fn)` - Side effect on success
- `tapErr(fn)` - Side effect on failure
- `match(okFn, errFn)` - Pattern matching

### Standalone functions

Imported from `../result`:

- `isOk(t)` - Type guard
- `isErr(t)` - Type guard
- `map(t, fn)` - Map value
- `flatMap(t, fn)` - Chain Tries
- `getOrElse(t, default)` - Get value or default
- `getOrCompute(t, fn)` - Get value or compute
- `tap(t, fn)` - Side effect on success
- `tapErr(t, fn)` - Side effect on failure
- `match(t, okFn, errFn)` - Pattern matching
- `toNullable(t)` - Convert to null
- `toUndefined(t)` - Convert to undefined
