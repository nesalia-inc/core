# Maybe Type

A functional `Maybe` type for TypeScript - represents optional values that may or may not be present. Inspired by Haskell's `Maybe` and Rust's `Option`.

## Overview

The `Maybe` type is a container that either contains a value (`Some`) or is empty (`None`). It provides a safe way to handle nullable values without null checks.

```typescript
type Maybe<T> = Some<T> | None;
```

## When to Use Maybe

| Use **Maybe** when: | Use **Result** when: |
|---------------------|----------------------|
| Value may be absent | Operation may fail with error |
| Dealing with nullable types | Need error context/details |
| Optional function parameters | Chaining operations that may fail |
| Safe property access | Railway-oriented programming |

## Core Types

### Maybe\<T\>

Union of `Some<T>` and `None`:

```typescript
type Maybe<T> = Some<T> | None;
```

### Some\<T\>

Represents a present value:

```typescript
interface Some<T> {
  readonly ok: true;
  readonly value: T;
  isSome(): true;
  isNone(): false;
  map<U>(fn: (value: T) => U): Maybe<U>;
  flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U>;
  filter(predicate: (value: T) => boolean): Maybe<T>;
  getOrElse(defaultValue: T): T;
  getOrCompute(fn: () => T): T;
  tap(fn: (value: T) => void): Maybe<T>;
  toResult<E>(onNone: () => E): Result<T, E>;
}
```

### None

Represents an absent value:

```typescript
interface None {
  readonly ok: false;
  isSome(): false;
  isNone(): true;
  map<U>(fn: (value: never) => U): None;
  flatMap<U>(fn: (value: never) => Maybe<U>): None;
  filter(predicate: (value: unknown) => boolean): None;
  getOrElse<T>(defaultValue: T): T;
  getOrCompute<T>(fn: () => T): T;
  tap(fn: (value: never) => void): None;
  toResult<E>(onNone: () => E): Result<never, E>;
}
```

## Usage

### Creating Maybe Values

```typescript
import { some, none, fromNullable } from "@deessejs/core";

// From a value
const present = some(42);
const absent = none();

// From a nullable value
const value: string | null = getOptionalString();
const maybe = fromNullable(value); // Some<string> or None
```

### Working with Maybe

```typescript
const value = some(10);

// Map - transform the value
const doubled = value.map(x => x * 2); // Some(20)

// Chain - flatMap for dependent operations
const user = some({ id: 1, name: "Alice" });
const greeting = user.flatMap(u => some(`Hello, ${u.name}`)); // Some("Hello, Alice")

// Filter - keep only values that match
const positive = some(5).filter(x => x > 0); // Some(5)
const negative = some(-1).filter(x => x > 0); // None

// Access value with default
const result = some("hello").getOrElse("default"); // "hello"
const fallback = none().getOrElse("default");     // "default"

// Access value with computed default
const computed = none().getOrCompute(() => expensiveOperation()); // calls function

// Tap - side effects without changing value
some(5).tap(x => console.log(x)); // logs 5, returns Some(5)
```

### Converting to Result

When you need to convert a `Maybe` to a `Result` (e.g., for error handling):

```typescript
const age = some(25);

// Convert to Result with custom error
const result = age
  .filter(a => a >= 18)  // Some(25) if predicate passes, None otherwise
  .toResult(() => new Error("Too young")); // Ok(25) or Err(Error)

// Chain with Result operations
const validated = age
  .filter(a => a >= 18)
  .toResult(() => "TOO_YOUNG")
  .map(a => a * 2); // Ok(50) or Err("TOO_YOUNG")
```

### Type Narrowing

The `ok` property enables type narrowing:

```typescript
function process(maybe: Maybe<number>) {
  if (maybe.isSome()) {
    // TypeScript knows it's Some<number>
    console.log(maybe.value);
  } else {
    // TypeScript knows it's None
    console.log("No value");
  }
}
```

### Chaining Multiple Maybes

```typescript
import { all, some, none } from "@deessejs/core";

// All must be Some to get Some of array
const combined = all(some(1), some(2), some(3)); // Some([1, 2, 3])
const withNone = all(some(1), none(), some(3));   // None
```

## API Reference

### Factory Functions

| Function | Description |
|----------|-------------|
| `some<T>(value)` | Creates Some with a non-null value |
| `none()` | Creates a None |
| `fromNullable<T>(value)` | Creates Some if not null/undefined, None otherwise |

### Type Guards

| Function | Description |
|----------|-------------|
| `isSome(maybe)` | Returns true if maybe is Some |
| `isNone(maybe)` | Returns true if maybe is None |

### Chainable Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `map` | `(maybe, fn) => Maybe<U>` | Transform the value if Some |
| `flatMap` | `(maybe, fn) => Maybe<U>` | Chain dependent operations |
| `flatten` | `(maybe) => Maybe<T>` | Flatten nested Maybes |
| `filter` | `(maybe, pred) => Maybe<T>` | Keep only matching values |
| `tap` | `(maybe, fn) => Maybe<T>` | Execute side effect, return same Maybe |
| `match` | `(maybe, some, none) => U` | Pattern matching |

### Conversion Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `toNullable` | `(maybe) => T \| null` | Convert to nullable |
| `toUndefined` | `(maybe) => T \| undefined` | Convert to undefined-able |
| `getOrElse` | `(maybe, default) => T` | Get value or default |
| `getOrCompute` | `(maybe, fn) => T` | Get value or compute default |
| `toResult` | `(maybe, onNone) => Result` | Convert to Result |

### Comparison Functions

| Function | Description |
|----------|-------------|
| `equals(a, b)` | Check equality of two Maybes |
| `equalsWith(a, b, comparator)` | Check equality with custom comparator |

### Combinators

| Function | Description |
|----------|-------------|
| `all(maybes)` | Returns Some if all are Some |
| `filter(maybe, predicate)` | Filter by predicate |

## Migration from null/undefined

### Before

```typescript
function getUserName(user: User | null): string {
  if (user === null) {
    return "Anonymous";
  }
  return user.name;
}
```

### After

```typescript
import { fromNullable, getOrElse } from "@deessejs/core";

const getUserName = (user: User | null): string =>
  fromNullable(user).map(u => u.name).getOrElse("Anonymous");
```

## Best Practices

1. **Use `fromNullable`** when bridging from nullable world to Maybe
2. **Prefer `getOrElse`** over `getOrCompute` for simple defaults
3. **Use `toResult`** when you need error context from a None
4. **Chain operations** instead of nested if/else
5. **Keep it functional** - don't mutate Maybe values

## Examples

### Safe Property Access

```typescript
const getCity = (user: Maybe<User>) =>
  user
    .flatMap(u => fromNullable(u.address))
    .map(a => a.city)
    .getOrElse("Unknown");
```

### Validation Chain

```typescript
const validateAge = (age: Maybe<number>) =>
  age
    .filter(a => a >= 0)
    .filter(a => a <= 150)
    .toResult(() => "INVALID_AGE")
    .map(a => `Age: ${a}`);
```

### Optional Configuration

```typescript
const getTimeout = (config: Maybe<Config>) =>
  config
    .map(c => c.timeout)
    .filter(t => t > 0)
    .getOrElse(3000);
```
