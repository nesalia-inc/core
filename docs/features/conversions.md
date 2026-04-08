# Conversions

The Conversions module provides utilities to convert between Result, Maybe, Try, and other types. These helpers make it easy to move between the different error-handling paradigms.

## Why Conversions?

Different parts of your application may use different types:

- External APIs might return `Maybe` (optional values)
- Your domain logic might use `Result` (explicit errors)
- Legacy code might throw exceptions (Try)

Conversions help bridge these paradigms without losing type safety.

---

## Quick Start

```typescript
import { toResult, toMaybeFromResult, fromUndefinedable } from '@deessejs/fp';
```

---

## API Reference

### `toResult(maybe, onNone)` - Convert Maybe to Result

Converts a `Maybe<T>` to a `Result<T, E>`. When the Maybe is `None`, the `onNone` function provides the error:

```typescript
import { toResult, some, none } from '@deessejs/fp';

const maybeUser = findUserById(1); // Maybe<User>

const result = toResult(maybeUser, () => 'USER_NOT_FOUND');
// Ok<User> if Some, Err('USER_NOT_FOUND') if None
```

**Use case:** When you need to explain why a value is missing:

```typescript
import { toResult } from '@deessejs/fp';

const findUser = (id: number): Result<User, 'NOT_FOUND'> => {
  const maybe = database.find(id);
  return toResult(maybe, () => 'NOT_FOUND');
};
```

---

### `toMaybeFromResult(result)` - Convert Result to Maybe

Converts a `Result<T, E>` to a `Maybe<T>`. Errors become `None`:

```typescript
import { toMaybeFromResult, ok, err } from '@deessejs/fp';

const result: Result<User, Error> = fetchUser(1);

const maybe = toMaybeFromResult(result);
// Some<User> if Ok, None if Err
```

**Use case:** When you need to pass a value to code that expects Maybe:

```typescript
import { toMaybeFromResult } from '@deessejs/fp';

const getConfig = (): Result<Config, Error> => { /* ... */ };

// Legacy function expects Maybe
const processConfig = (config: Maybe<Config>) => { /* ... */ };

processConfig(toMaybeFromResult(getConfig()));
```

> **Note:** The error information is lost in this conversion. If you need the error, handle it before converting.

---

### `fromUndefinedable(value)` - Convert undefined to Maybe

Converts a `T | undefined` value to a `Maybe<T>`:

```typescript
import { fromUndefinedable, some, none } from '@deessejs/fp';

fromUndefinedable(42);    // Some(42)
fromUndefinedable(undefined); // None
```

This is equivalent to `fromNullable` but specifically for handling `undefined`:

```typescript
import { fromUndefinedable } from '@deessejs/fp';

// Use when the value might be undefined (but not null)
const name = fromUndefinedable(getOptionalName());
```

---

## Real-World Examples

### API to Domain Conversion

```typescript
import { toResult, fromNullable } from '@deessejs/fp';

interface User {
  id: number;
  name: string;
}

// External API returns nullable
const findUser = (id: number): User | null => {
  return database.find(id);
};

// Convert to Maybe first
const maybeUser = fromNullable(findUser(id));

// Then convert to Result with specific error
const userResult = toResult(maybeUser, () => ({ type: 'NOT_FOUND', id }));
```

### Optional Configuration

```typescript
import { toResult, fromUndefinedable } from '@deessejs/fp';

interface Config {
  timeout: number;
  retries: number;
}

const loadConfig = (): Partial<Config> => {
  return {
    timeout: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : undefined,
    retries: process.env.RETRIES ? parseInt(process.env.RETRIES) : undefined,
  };
};

const config = toResult(
  fromUndefinedable(loadConfig()),
  () => 'INVALID_CONFIG'
);
```

### Mixed Error Types

```typescript
import { toMaybeFromResult, ok, err, toResult, some, none } from '@deessejs/fp';

type DomainError = 'NOT_FOUND' | 'UNAUTHORIZED';

const fetchUser = (id: number): Result<User, DomainError> => {
  // Returns Result<User, 'NOT_FOUND' | 'UNAUTHORIZED'>
};

const fetchProfile = (userId: number): Result<Profile, 'NETWORK_ERROR'> => {
  // Returns Result<Profile, 'NETWORK_ERROR'>
};

// Combine results (errors are unioned)
const combined = ok<User, DomainError>({ id: 1, name: 'John' })
  .flatMap(user => toResult(
    fromNullable(user.profile),
    () => 'NOT_FOUND' as DomainError
  ));
```

---

## Conversion Table

| From | To | Function |
|------|-----|----------|
| Maybe | Result | `toResult(maybe, onNone)` |
| Result | Maybe | `toMaybeFromResult(result)` |
| T \| undefined | Maybe | `fromUndefinedable(value)` |
| T \| null | Maybe | `fromNullable(value)` (in Maybe module) |

---

## Best Practices

### 1. Convert at Boundaries

```typescript
// Good: Convert at the boundary of your domain
const user = toResult(externalApi.getUser(id), () => 'NOT_FOUND');

// Avoid: Mixing types throughout your domain
const result = ok(1).flatMap(x => some(x + 1)); // Confusing
```

### 2. Provide Meaningful Errors

```typescript
// Good: Specific error
toResult(maybeUser, () => ({ type: 'USER_NOT_FOUND', id }));

// Less useful
toResult(maybeUser, () => 'error');
```

### 3. Handle Errors Before Converting

```typescript
// Good: Handle error before losing it
const result = fetchUser(id);
if (result.ok) {
  const maybe = toMaybeFromResult(result);
  // Use maybe
}

// Lost error information
const maybe = toMaybeFromResult(fetchUser(id));
```

---

## Known Limitations & Future Improvements

### 1. Naming Inconsistency

**Current behavior:** Functions use mixed naming: `toResult`, `toMaybeFromResult`, `fromUndefinedable`.

**Issue:** No clear convention between `fromX` (source) and `toX` (destination).

**Note:** Future versions may adopt a consistent naming scheme:

```typescript
// Potential future API (all using 'from')
Result.fromMaybe(maybe, onNone)
Maybe.fromResult(result)
Maybe.fromNullable(value)
Maybe.fromPredicate(value, predicate, onFalse)
```

### 2. No Try Conversions

**Current behavior:** No conversion functions for Try type.

**Note:** Try is equivalent to `Result<T, Error>`. Use `Try` directly or convert:

```typescript
// Try already has the same shape as Result<T, Error>
import { attempt, ok, err } from '@deessejs/fp';

const tryResult = attempt(() => JSON.parse(data));

// Convert to Result if needed
const result = tryResult.ok ? ok(tryResult.value) : err(tryResult.error);
```

### 3. `fromUndefinedable` vs `fromNullable`

**Current behavior:** Two similar functions exist.

**Note:** Consider using `fromNullable` as the standard (handles both null and undefined). `fromUndefinedable` may be deprecated or hidden in future versions.

### 4. No Async Variants

**Current behavior:** Conversions are synchronous only.

**Note:** Async variants may be added:

```typescript
// Potential future API
const asyncResult = await fromPromise(promise);
const asyncMaybe = await AsyncResult.fromPromise(promise).toMaybe();
```

### 5. No `fromPredicate`

**Current behavior:** No function to convert a boolean test to Result.

**Workaround:**

```typescript
import { ok, err, Result } from '@deessejs/fp';

const fromPredicate = <T, E>(
  value: T,
  predicate: (value: T) => boolean,
  onFalse: () => E
): Result<T, E> =>
  predicate(value) ? ok(value) : err(onFalse());

// Usage
const result = fromPredicate(
  user,
  u => u.age >= 18,
  () => 'TOO_YOUNG'
);
```

### 6. No Direct Shortcuts

**Current behavior:** Converting null to Result requires: `toResult(fromNullable(val), err)`.

**Note:** Direct shortcuts may be added:

```typescript
// Potential future API
resultFromNullable(value, onNull)
resultFromThrowable(fn)
```

### 7. Lossy Conversion Warning

**Current behavior:** `toMaybeFromResult` destroys error information.

**Note:** Always handle errors before converting:

```typescript
// Good: Handle error first
const result = fetchUser(id);
if (!result.ok) {
  logError(result.error);
  return defaultUser;
}
return result.value;

// Alternative: Use tapErr before converting
import { tapErr } from '@deessejs/fp';
const maybe = tapErr(fetchUser(id), e => log(e)).match(
  value => ({ ok: true, value }),
  () => ({ ok: false })
);
```

---

## Related

- [Result](./result.md) - Explicit error handling
- [Maybe](./maybe.md) - Optional values
- [Error](./error.md) - Structured error types
