---
dep: DEP-0004
title: "Try: Wrapping Throwing Functions"
stage: draft
tags:
  - area/core
  - type/feature
authors:
  - DeesseJS Team <support@nesalia.com>
created: 2026-05-04
updated: 2026-05-04
---

## Summary

A **Try pattern** that wraps synchronous and asynchronous functions which might throw, converting exceptions into typed errors. `Result.attempt()` and `Result.attemptAsync()` provide a safe bridge between imperative exception handling and functional error management. Try is not a separate type — it is the pattern of using Result to safely handle throwing functions.

## Motivation

JavaScript exceptions can crash applications. The Try system provides:

1. **Safe wrapping** — Any throwing function is caught and converted to a typed Result
2. **Error transformation** — Custom error mapping via a `catch` transform
3. **Async support** — `attemptAsync` handles async functions that reject
4. **Type safety** — The error type is explicit, not hidden in thrown exceptions

## Detailed Design

### Wrapping Synchronous Functions (Result.attempt)

`Result.attempt()` wraps a synchronous function that may throw:

```typescript
import { Result, error } from '@deessejs/fp';

const ParseError = error({ name: "ParseError" });

// With custom error mapping
const parseResult = Result.attempt(
  () => JSON.parse(input),
  (cause) => ParseError({ input, cause })
);
// Result<unknown, ParseError>

// Without catch — error type is native Error
const fallback = Result.attempt(() => JSON.parse(input));
// Result<unknown, Error>
```

**Error mapping signature:**

```typescript
Result.attempt<T, E>(
  fn: () => T,
  catch?: (cause: unknown) => E
): Result<T, E>
```

If `catch` is omitted, thrown errors are wrapped in a native `Error` object.

### Wrapping Async Functions (Result.attemptAsync)

`Result.attemptAsync()` wraps async functions:

```typescript
import { Result, error } from '@deessejs/fp';

const NetworkError = error({ name: "NetworkError" });
const ValidationError = error({ name: "ValidationError" });

const fetchResult = await Result.attemptAsync(
  async () => {
    const response = await fetch('/api/user');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  (cause) => NetworkError({ url: '/api/user', cause })
);
// Result<User, NetworkError>
```

**Multiple error types with conditional mapping:**

```typescript
const result = await Result.attemptAsync(
  async () => {
    const data = await fetchData();
    if (!data.valid) throw new Error('Invalid data');
    return transform(data);
  },
  (cause) => {
    if (cause instanceof TypeError) {
      return ValidationError({ field: 'data', message: cause.message });
    }
    return NetworkError({ cause });
  }
);
// Result<Transformed, ValidationError | NetworkError>
```

### Non-Error Throws

Non-Error throws are converted to Error:

```typescript
Result.attempt(() => { throw 'oops'; });
// Err<Error: 'oops'>

Result.attempt(() => { throw 42; });
// Err<Error: '42'>

Result.attempt(() => { throw { code: 500 }; });
// Err<Error: '[object Object]'>
```

### Catch Transform Behavior

The `catch` transform receives the thrown cause and must return a domain error:

```typescript
Result.attempt(
  fn: () => T,
  catch: (cause: unknown) => E
): Result<T, E>
```

**Cause chaining:** When `catch` creates a domain error, the original cause should be preserved via error enrichment:

```typescript
const result = Result.attempt(
  () => { throw new Error('original'); },
  (cause) => ValidationError({ field: 'data', message: cause instanceof Error ? cause.message : 'unknown' }).from(cause)
);
// The ValidationError has cause: Error('original')
```

**If catch throws:** The `catch` transform should not throw. If it does, this indicates a programmer defect and results in a Panic:

```typescript
// This is a programmer error - catch should not throw
const badResult = Result.attempt(
  () => { throw new Error('oops'); },
  (cause) => { throw new Error('defect in catch handler'); }  // BAD
);
// Results in Panic, not Err<...>
```

**If cause is already a domain error:** The catch handler receives it as `unknown`. The handler should decide whether to chain it via `.from()` or create a new error without chaining:

```typescript
Result.attempt(
  () => { throw NotFoundError({ id: '123' }); },
  (cause) => {
    if (cause instanceof Error && cause._tag === 'NotFoundError') {
      // Already a domain error — chain it to preserve context
      return ValidationError({ field: 'id', message: 'not found in validation' }).from(cause);
    }
    // Third-party error — create new without chaining
    return ValidationError({ field: 'id', message: 'unknown error' });
  }
);
```

### When Not to Use attempt

Wrapping already-pure, non-throwing functions with `attempt` is unnecessary but harmless. It adds overhead for no benefit:

```typescript
// Unnecessary - this never throws
const result = Result.attempt(() => 1 + 1);
// Fine in production, but pointless

// Necessary - external input may be malformed
const parsed = Result.attempt(() => JSON.parse(userInput));
```

### Exported Types

The Try pattern reuses the Result types:

```typescript
import { Result, Ok, Err, Some, None, error } from '@deessejs/fp';

export type Ok<T, E = never> = Readonly<{ readonly ok: true; readonly value: T }>;
export type Err<T, E = never> = Readonly<{ readonly ok: false; readonly error: E }>;
export type Result<T, E = Error> = Ok<T, E> | Err<T, E>;

export type Some<T> = Readonly<{ readonly _tag: "Some"; readonly value: T }>;
export type None = Readonly<{ readonly _tag: "None" }>;
export type Maybe<T> = Some<T> | None;
```

### Conversions

```typescript
// toNullable
toNullable(Result.attempt(() => 42));                        // 42
toNullable(Result.attempt(() => { throw new Error(); })); // null

// toUndefined
toUndefined(Result.attempt(() => 42));                        // 42
toUndefined(Result.attempt(() => { throw new Error(); }));   // undefined

// toMaybe — Try success becomes Some, failure becomes None
const maybe = tryResult.ok ? some(tryResult.value) : none();
```

### Combination (async)

```typescript
// allSettled — Collect all results, preserving failures
const results = await Promise.allSettled([
  fetchUser("1"),
  fetchUser("2"),
  fetchUser("3"),
]);

const parsed = results.map(r =>
  r.status === "fulfilled"
    ? ok(r.value)
    : err(r.reason)
);
// (Ok<User> | Err<Error>)[]
```

## Relationship to Result

Try is the bridge from imperative code to Result. It is a pattern, not a separate type.

| Function | Purpose | Error Type |
|---------|---------|------------|
| `Result.attempt(fn)` | Wrap sync throwing function | Native `Error` |
| `Result.attempt(fn, catch)` | Wrap sync with custom error | Domain error via `catch` |
| `Result.attemptAsync(fn)` | Wrap async throwing function | Native `Error` |
| `Result.attemptAsync(fn, catch)` | Wrap async with custom error | Domain error via `catch` |

**Rule of thumb:**
- Use `attempt` for synchronous operations (JSON.parse, file reads)
- Use `attemptAsync` for async operations (fetch, file I/O)
- Use `catch` transform to map to your domain errors

## Try vs Result vs Maybe

| Scenario | Type | Example |
|----------|------|---------|
| Function might throw | `Try` / `Result.attempt()` | `Result.attempt(() => JSON.parse(input))` |
| Operation can fail with error | `Result<T, E>` | `Result<User, NotFoundError>` |
| Value might be absent | `Maybe<T>` | `Maybe<User>` - user may not exist |

**When to use Try:**
- Wrapping legacy code or external libraries
- Converting exceptions to structured errors
- Any place where exceptions can escape

**When to use Result directly:**
- When you control the error type explicitly
- For domain operations with typed errors

## Complete Example

```typescript
import { Result, ok, err, error, pipe } from '@deessejs/fp';
import { z } from 'zod';

const ParseError = error({
  name: "ParseError",
  schema: z.object({ input: z.string(), cause: z.unknown() })
});

const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string(), message: z.string() })
});

const NetworkError = error({
  name: "NetworkError",
  schema: z.object({ url: z.string(), status: z.number().optional() })
});

interface User {
  id: string;
  name: string;
}

// Parse with domain errors
const parseUser = (json: string): Result<User, ParseError | ValidationError> => {
  const parsed = Result.attempt(
    () => JSON.parse(json),
    (cause) => ParseError({ input: json, cause })
  );

  if (!parsed.ok) return parsed;

  const { id, name } = parsed.value;

  if (typeof id !== 'string') {
    return err(ValidationError({ field: 'id', message: 'must be string' }));
  }
  if (typeof name !== 'string') {
    return err(ValidationError({ field: 'name', message: 'must be string' }));
  }

  return ok({ id, name });
};

// Fetch with domain errors
const fetchUser = async (id: string): Promise<Result<User, NetworkError | ParseError | ValidationError>> => {
  const response = await Result.attemptAsync(
    async () => {
      const res = await fetch(`/api/users/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    (cause) => NetworkError({ url: `/api/users/${id}` })
  );

  if (!response.ok) return response;

  return parseUser(JSON.stringify(response.value));
};

// Usage with pipe
const result = await fetchUser('123');

pipe(
  result,
  Result.tap(user => console.log('User:', user.name)),
  Result.tapErr(e => console.error('Failed:', e._tag, e)),
  Result.map(user => user.id)
);
```

## Open Questions

1. **TrySuccess/TryFailure naming** — Should Try variants use `success`/`failure` for clarity, or keep `ok`/`error` for consistency with Result?

## References

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — Result type with generator composition
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Error type with tagging
- [DEP-0003-MAYBE](./DEP-0003-MAYBE.md) — Maybe type for nullable values
