---
name: no-class-exports
description: No class should be exported to the end user - use functional wrappers instead
paths:
  - "packages/fp/src/**/*.ts"
---

# No Class Exports to End User

The public API must not expose class constructors. Use functional wrappers instead.

## Pattern: Factory Functions + Internal Classes

Internal implementation uses classes with methods. Public API exposes only factory functions and types:

```typescript
// INTERNAL: Class with methods
class Ok<T, E> {
  constructor(readonly value: T) {}
  map<U>(fn: (val: T) => U): Ok<U, E> { return new Ok(fn(value)); }
  flatMap<U>(fn: (val: T) => Result<U, E>): Result<U, E> { return fn(value); }
  // ... more methods
}

class Err<T, E> {
  constructor(readonly error: E) {}
  map<U>(_fn: (val: T) => U): Err<U, E> { return this as Err<U, E>; }
  flatMap<U>(_fn: (val: T) => Result<U, E>): Err<U, E> { return this; }
  // ... more methods
}

// PUBLIC: Export factory functions, not the classes
export const ok = <T, E extends Error = Error>(value: T): Ok<T, E> => new Ok(value);
export const err = <E extends Error>(error: E): Err<never, E> => new Err(error);
```

**Note:** Internal classes must follow [naming conventions](./naming-conventions.md) - no `Impl` suffix.

## Allowed Exports

- **Factory functions**: `ok()`, `err()`, `success()`, `failure()`, `some()`, `none()`, `okAsync()`, `errAsync()`, `successAsync()`, `failureAsync()`
- **Utility functions**: `map()`, `flatMap()`, `tap()`, `tapErr()`, `getOrElse()`, `match()`, `isOk()`, `isErr()`, `swap()`, `unwrap()`, etc.
- **Type definitions**: `Result`, `Ok`, `Err`, `Maybe`, `Some`, `None`, `AsyncResult`, `Error`

## Why

This maintains a clean functional programming style in the public API. Users interact with plain objects from factory functions, not class instances. See [naming conventions](./naming-conventions.md) for naming rules.

## Current Implementation

The codebase currently uses plain objects with methods created by factory functions `createOk()` and `createErr()` in `result/builder.ts`. This should be refactored to use internal classes per this rule.

## Current Violations

- `RetryAbortedError` class in `packages/fp/src/retry.ts` - exported class violates this rule
  - Should use the library's [error system](./error-system.md) via `error()` builder instead
  - Example: `const RetryAbortedError = error({ name: "RetryAbortedError" })`

## Exception

Internal classes used within implementation details (not exported from index.ts) are allowed, but must follow [naming conventions](./naming-conventions.md).