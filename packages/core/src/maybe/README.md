# Maybe Type

A functional `Maybe` type for TypeScript - represents optional values that may or may not be present. Inspired by Haskell's `Maybe` and Rust's `Option`.

## Overview

The `Maybe` type is a container that either contains a value (`Some`) or is empty (`None`). It provides a safe way to handle nullable values without null checks. Instead of relying on `undefined` or `null` checks throughout your code, `Maybe` makes the possibility of a missing value explicit in the type system.

The fundamental insight behind `Maybe` is that **presence and absence are both valid states**, not exceptional ones. A function that returns `Maybe<User>` clearly communicates: "I might give you a user, or I might give you nothing." This is better than a function that returns `User | null` because the type itself guides how you handle both cases.

```typescript
type Maybe<T> = Some<T> | None;
```

### Why Maybe?

JavaScript's `null` and `undefined` are often called the "billion dollar mistake" because they cause countless runtime errors. Traditional approaches rely on manual checks scattered throughout the codebase:

```typescript
// Traditional approach - null checks everywhere
function getCity(user) {
  if (user !== null && user !== undefined) {
    if (user.address !== null && user.address !== undefined) {
      if (user.address.city !== null && user.address !== undefined) {
        return user.address.city;
      }
    }
  }
  return "Unknown";
}
```

With Maybe, this becomes a clean chain where each operation either transforms the value or propagates the absence:

```typescript
// Maybe approach - explicit flow
const getCity = (user: Maybe<User>) =>
  user
    .flatMap(u => fromNullable(u.address))
    .map(a => a.city)
    .getOrElse("Unknown");
```

## When to Use Maybe

Maybe shines when dealing with optional data. However, it's important to distinguish between "optional data" and "operations that can fail."

| Use **Maybe** when: | Use **Result** when: |
|---------------------|----------------------|
| Value may be absent | Operation may fail with error |
| Dealing with nullable types | Need error context/details |
| Optional function parameters | Chaining operations that may fail |
| Safe property access | Railway-oriented programming |

### The Decision Framework

Ask yourself: **Is the absence an error or a normal state?**

- **Normal absence**: The data simply isn't there. A user might not have a phone number. A configuration might not have a timeout set. Use `Maybe`.

- **Failure**: Something went wrong that you need to handle. A database query failed. A file doesn't exist. Use `Result`.

If you're unsure, ask: "If this is `null`, is it a bug or just missing data?" If it's just missing data, use `Maybe`.

## Core Types

### Maybe\<T\>

Union of `Some<T>` and `None`:

```typescript
type Maybe<T> = Some<T> | None;
```

The `Maybe` type represents a value that might exist. The `ok` property tells you which state you're in, and the type system narrows accordingly.

### Some\<T\>

Represents a present value - the happy path where the data exists:

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

When you have a `Some<T>`, you can safely access the `value` property. All transformation methods (`map`, `flatMap`, `filter`) apply to the contained value.

### None

Represents an absent value - the case where the data simply isn't there:

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

When you have a `None`, all transformation methods short-circuit and return `None`. The `getOrElse` and `getOrCompute` methods provide the value or fallback behavior.

## Usage

### Creating Maybe Values

The three factory functions cover the main ways you might get a Maybe value:

```typescript
import { some, none, fromNullable } from "@deessejs/core";

// From a concrete value - use when you know the value exists
const present = some(42);

// Explicitly empty - use when the value is intentionally absent
const absent = none();

// From nullable world - bridge JavaScript's null/undefined into Maybe
const value: string | null = getOptionalString();
const maybe = fromNullable(value); // Some<string> if not null/undefined, None otherwise
```

**When to use each:**

- `some(value)` - Call this when you have a non-null value and want to wrap it. The function asserts the value exists.

- `none()` - Call this when you want to explicitly represent the absence of a value. This is often used in `flatMap` results.

- `fromNullable(value)` - This is your bridge from the nullable world. It handles both `null` and `undefined` by converting them to `None`.

### Working with Maybe

The core operations on Maybe are designed to be composable. You chain them together to build complex transformations without ever checking for null:

```typescript
const value = some(10);

// Map - transform the value if present
// If Some(10), maps to Some(20)
// If None, stays None
const doubled = value.map(x => x * 2); // Some(20)

// Chain - flatMap for dependent operations
// Use when the next operation might also return Maybe
const user = some({ id: 1, name: "Alice" });
const greeting = user.flatMap(u => some(`Hello, ${u.name}`)); // Some("Hello, Alice")

// Filter - keep only values that match a predicate
// If Some(5) and predicate(x > 0) is true -> Some(5)
// If Some(-1) and predicate(x > 0) is false -> None
// If None -> None (predicate not evaluated)
const positive = some(5).filter(x => x > 0); // Some(5)
const negative = some(-1).filter(x => x > 0); // None

// Access value with default - getOrElse
// Returns the value if Some, or the default if None
const result = some("hello").getOrElse("default"); // "hello"
const fallback = none().getOrElse("default");     // "default"

// Access value with computed default - getOrCompute
// Use when computing the default is expensive (lazy evaluation)
const computed = none().getOrCompute(() => expensiveOperation()); // calls function

// Tap - side effects without changing the Maybe
// Useful for logging or debugging without altering the flow
some(5).tap(x => console.log(x)); // logs 5, returns Some(5)
```

### Understanding filter

The `filter` method is where Maybe really shines for validation. It's a powerful concept that might feel unfamiliar at first, but once you understand it, you'll use it constantly.

**How filter works:**

```
Some(value).filter(predicate) → predicate(value) ? Some(value) : None
None.filter(predicate)        → None (predicate is never evaluated)
```

The key insight is that `filter` **preserves the Some or converts to None** based on the predicate. It doesn't throw exceptions or break the chain - it just says "this value didn't pass validation, so it becomes None."

**Why this matters:**

Traditional validation often looks like this:

```typescript
// Traditional - early returns or exceptions
function validateAge(age: number): number {
  if (age < 0) throw new Error("Age cannot be negative");
  if (age > 150) throw new Error("Age is unrealistically high");
  return age;
}
```

With Maybe, validation becomes compositional:

```typescript
// Maybe - filter chains, no exceptions
const age = some(25);

age.filter(a => a >= 0)   // Some(25) - passes first check
  .filter(a => a <= 150)  // Some(25) - passes second check
  // If any filter fails, result is None
```

**Combining filter with toResult for error handling:**

Maybe handles the "absence" case well, but sometimes you need more - you need an error. That's where `toResult` comes in. The pattern is:

1. Use `filter` to validate and chain conditions
2. Use `toResult` to convert None into an error Result

```typescript
// filter + toResult = validation pattern
const validated = some(25)
  .filter(a => a >= 18)      // Some(25) or None
  .filter(a => a <= 150)     // Some(25) or None (chained validation)
  .toResult(() => ValidationError());
  // Ok(25) if all filters pass, Err(ValidationError) if any fail
```

**Key insight**: `filter` lets you chain validations without breaking the Maybe rail. Only when you're ready to convert to Result (for error handling) do you call `toResult`. This keeps your validation logic separate from your error handling logic.

### Converting to Result

When you need to handle the "missing" case as an error rather than just a fallback value, convert your Maybe to a Result. This is the bridge between the "optional value" world and the "railway-oriented programming" world.

```typescript
import { some, error } from "@deessejs/core";

const TooYoungError = error({
  name: "TooYoungError",
  message: () => "Too young",
});

const age = some(25);

// Convert to Result with structured error
// filter returns Some(25) if predicate passes, None otherwise
// toResult converts None to Err(TooYoungError)
const result = age
  .filter(a => a >= 18)
  .toResult(() => TooYoungError()); // Ok(25) or Err(TooYoungError)

// Once in Result territory, you can use all Result operations
const validated = age
  .filter(a => a >= 18)
  .toResult(() => TooYoungError())
  .map(a => a * 2); // Ok(50) or Err(TooYoungError)
```

**Why convert to Result?**

Maybe is perfect for handling absence, but sometimes "not found" is an error condition that needs to propagate through your application. Converting to Result allows you to:

- Use `mapErr` to enrich the error with context
- Use `flatMap` to chain fallible operations
- Use `all` or `race` to combine multiple Results
- Get proper stack traces and error chaining

### Type Narrowing

The `ok` property enables safe type narrowing. TypeScript understands that when `ok === true`, you're dealing with a `Some`, and when `ok === false`, you're dealing with a `None`:

```typescript
function process(maybe: Maybe<number>) {
  if (maybe.isSome()) {
    // TypeScript narrows type to Some<number>
    // You can safely access .value
    console.log(maybe.value);
  } else {
    // TypeScript narrows type to None
    console.log("No value");
  }
}
```

This works because `isSome()` and `isNone()` are type guards that TypeScript understands. When you call `isSome()`, TypeScript narrows the type within that branch.

### Chaining Multiple Maybes

Sometimes you need to combine multiple Maybe values. The `all` function lets you do this, but with a specific behavior: **all values must be present for the result to be Some**.

```typescript
import { all, some, none } from "@deessejs/core";

// All must be Some to get Some of array
const combined = all(some(1), some(2), some(3)); // Some([1, 2, 3])
const withNone = all(some(1), none(), some(3));   // None - one missing, all fails
```

This is particularly useful for:

- Collecting optional parameters that all must be present
- Checking that all optional fields in a form are filled
- Validating that all dependencies are available

## API Reference

### Factory Functions

| Function | Description |
|----------|-------------|
| `some<T>(value)` | Creates Some with a non-null value. Use when you know the value exists. |
| `none()` | Creates a None. Use when explicitly representing absence. |
| `fromNullable<T>(value)` | Creates Some if not null/undefined, None otherwise. Use when bridging from nullable code. |

### Type Guards

| Function | Description |
|----------|-------------|
| `isSome(maybe)` | Returns true if maybe is Some. Type guard for narrowing. |
| `isNone(maybe)` | Returns true if maybe is None. Type guard for narrowing. |

### Chainable Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `map` | `(maybe, fn) => Maybe<U>` | Transform the value if Some, return None if None. |
| `flatMap` | `(maybe, fn) => Maybe<U>` | Chain operations that return Maybe. |
| `flatten` | `(maybe) => Maybe<T>` | Remove one level of nesting: Some(Some(x)) → Some(x). |
| `filter` | `(maybe, pred) => Maybe<T>` | Keep only values matching predicate, convert to None otherwise. |
| `tap` | `(maybe, fn) => Maybe<T>` | Execute side effect, return same Maybe unchanged. |
| `match` | `(maybe, some, none) => U` | Pattern matching: provide handlers for both cases. |

### Conversion Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `toNullable` | `(maybe) => T \| null` | Convert Maybe back to nullable: Some(x) → x, None → null. |
| `toUndefined` | `(maybe) => T \| undefined` | Convert Maybe back to undefined-able: Some(x) → x, None → undefined. |
| `getOrElse` | `(maybe, default) => T` | Get value if Some, return default if None. |
| `getOrCompute` | `(maybe, fn) => T` | Get value if Some, compute and return default if None. |
| `toResult` | `(maybe, onNone) => Result` | Convert Maybe to Result: Some(x) → Ok(x), None → Err(onNone()). |

### Comparison Functions

| Function | Description |
|----------|-------------|
| `equals(a, b)` | Check equality of two Maybes. Both must be Some with equal values, or both must be None. |
| `equalsWith(a, b, comparator)` | Check equality with custom comparator function. |

### Combinators

| Function | Description |
|----------|-------------|
| `all(maybes)` | Returns Some if all inputs are Some, None otherwise. |
| `filter(maybe, predicate)` | Standalone filter function (same as instance method). |

## Migration from null/undefined

### The Problem with Null Checks

Traditional JavaScript relies heavily on null checks, which leads to several issues:

1. **Verbosity**: Every property access requires a null check
2. **Error-prone**: It's easy to forget a check and get a runtime error
3. **No type guidance**: `User | null` doesn't tell you how to handle the null case
4. **Nested chaos**: Deep property access leads to "pyramid of doom"

### Before and After

**Before** - traditional approach with nested null checks:

```typescript
function getUserName(user: User | null): string {
  if (user === null) {
    return "Anonymous";
  }
  return user.name;
}

function getCity(user: User | null): string {
  if (user === null) {
    return "Unknown";
  }
  if (user.address === null) {
    return "Unknown";
  }
  if (user.address.city === null) {
    return "Unknown";
  }
  return user.address.city;
}
```

**After** - Maybe approach with composable operations:

```typescript
import { fromNullable, getOrElse } from "@deessejs/core";

const getUserName = (user: User | null): string =>
  fromNullable(user).map(u => u.name).getOrElse("Anonymous");

const getCity = (user: User | null): string =>
  fromNullable(user)
    .flatMap(u => fromNullable(u.address))
    .map(a => a.city)
    .getOrElse("Unknown");
```

The Maybe version is:
- **Shorter**: No nested if statements
- **Safer**: Can't forget a check - the type enforces handling
- **Composable**: Each step is a simple transformation
- **Testable**: Each transformation can be tested in isolation

## Best Practices

### 1. Use `fromNullable` as Your Bridge

When working with external APIs or JavaScript libraries that return nullable values, use `fromNullable` immediately to bring the value into the Maybe world:

```typescript
// Good - immediately convert to Maybe
const config = fromNullable(getConfig()).map(c => c.timeout);

// Avoid - staying in nullable world
const timeout = getConfig()?.timeout;
```

### 2. Choose Between `getOrElse` and `getOrCompute` Based on Cost

If the default value is cheap to compute, use `getOrElse`. If computing the default is expensive or has side effects, use `getOrCompute` to defer the computation:

```typescript
// Simple default - use getOrElse
const name = user.map(u => u.name).getOrElse("Anonymous");

// Expensive computation - use getOrCompute
const data = cacheLookup(key).getOrCompute(() => expensiveDatabaseQuery());
```

### 3. Use `toResult` Only When You Need Error Context

If you're just providing a fallback value, `getOrElse` is cleaner. Reserve `toResult` for situations where the absence is genuinely an error condition that needs to propagate:

```typescript
// Fallback case - use getOrElse
const displayName = user.map(u => u.name).getOrElse("Anonymous");

// Error case - use toResult
const userRecord = lookupUser(id)
  .filter(u => u.isActive)
  .toResult(() => UserNotFoundError({ id }));
```

### 4. Chain Operations, Don't Nest

The beauty of Maybe is that transformations chain together. Avoid nesting - instead, keep chaining:

```typescript
// Avoid - nesting
const result = maybe.map(x => {
  const transformed = x * 2;
  return fromNullable(getSomething(transformed)).map(s => s.value);
});

// Prefer - chaining
const result = maybe
  .map(x => x * 2)
  .flatMap(x => fromNullable(getSomething(x)))
  .map(s => s.value);
```

### 5. Keep Maybe Values Immutable

Maybe values are immutable by design. Don't try to "set" a value on a None or modify the contained value. Instead, use transformation methods to create new Maybes:

```typescript
// Wrong - trying to mutate
maybe.value = newValue; // Compile error anyway

// Correct - transformation creates new Maybe
const updated = maybe.map(x => newValue);
```

### 6. Use `tap` for Debugging

When debugging a Maybe chain, use `tap` to inspect values without breaking the chain:

```typescript
const result = maybe
  .tap(value => console.log("Before:", value))
  .map(x => x * 2)
  .tap(value => console.log("After:", value))
  .filter(x => x > 0);
```

### 7. Compose with `all` for Multiple Optional Values

When you need multiple optional values to all be present, use `all`:

```typescript
// All fields required for operation
const userData = all(
  fromNullable(user.name),
  fromNullable(user.email),
  fromNullable(user.phone)
).map(([name, email, phone]) => ({ name, email, phone }));
```

## Examples

### Safe Property Access

Accessing nested properties is a common source of null pointer exceptions. With Maybe, you can safely navigate deeply nested structures:

```typescript
const getCity = (user: Maybe<User>) =>
  user
    .flatMap(u => fromNullable(u.address))    // Maybe<Address> or None
    .map(a => a.city)                           // Maybe<string> or None
    .getOrElse("Unknown");
```

If any step returns None, the chain short-circuits and returns None. No exceptions, no null checks.

### Validation Chain

For input validation, `filter` + `toResult` creates a powerful pattern:

```typescript
const validateAge = (age: Maybe<number>) =>
  age
    .filter(a => a >= 0)                              // Reject negative
    .filter(a => a <= 150)                            // Reject unrealistically high
    .toResult(() => ValidationError({ message: "Age out of range" }))
    .map(a => `Age: ${a}`);                            // Ok("Age: 25") or Err(ValidationError)
```

Each `filter` adds a validation rule. The chain reads like a specification of the valid values.

### Optional Configuration

When reading configuration, Maybe handles optional fields elegantly:

```typescript
const getTimeout = (config: Maybe<Config>) =>
  config
    .map(c => c.timeout)      // Maybe<number> - might not exist
    .filter(t => t > 0)       // Ensure timeout is positive
    .getOrElse(3000);          // Default to 3000ms
```

The caller receives a clear value with a sensible default, without needing to check if the config or timeout exists.

### Optional Function Result

When calling functions that might not return a value, Maybe handles the result cleanly:

```typescript
const findUser = (users: User[], id: string): Maybe<User> =>
  fromNullable(users.find(u => u.id === id));

// Usage
const user = findUser(allUsers, "123")
  .map(u => u.name)
  .getOrElse("User not found");
```

No exceptions for not found, no special return values needed. The type system guides the handling.

### Combining with Result

For complex scenarios where you might have both absence and errors:

```typescript
const loadConfig = (): Result<Config, Error> =>
  fromNullable(readFileSync("config.json"))
    .toResult(() => ConfigFileNotFoundError())
    .flatMap(content => parseConfig(content))
    .mapErr(e => ConfigParseError({ cause: e }));
```

This handles:
1. File not found → ConfigFileNotFoundError
2. Parse error → ConfigParseError with original error as cause
3. Success → Ok(Config)