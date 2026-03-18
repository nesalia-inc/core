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
import { toResult, toMaybeFromResult, fromUndefinedable } from '@deessejs/core';
```

---

## API Reference

### `toResult(maybe, onNone)` - Convert Maybe to Result

Converts a `Maybe<T>` to a `Result<T, E>`. When the Maybe is `None`, the `onNone` function provides the error:

```typescript
import { toResult, some, none } from '@deessejs/core';

const maybeUser = findUserById(1); // Maybe<User>

const result = toResult(maybeUser, () => 'USER_NOT_FOUND');
// Ok<User> if Some, Err('USER_NOT_FOUND') if None
```

**Use case:** When you need to explain why a value is missing:

```typescript
import { toResult } from '@deessejs/core';

const findUser = (id: number): Result<User, 'NOT_FOUND'> => {
  const maybe = database.find(id);
  return toResult(maybe, () => 'NOT_FOUND');
};
```

---

### `toMaybeFromResult(result)` - Convert Result to Maybe

Converts a `Result<T, E>` to a `Maybe<T>`. Errors become `None`:

```typescript
import { toMaybeFromResult, ok, err } from '@deessejs/core';

const result: Result<User, Error> = fetchUser(1);

const maybe = toMaybeFromResult(result);
// Some<User> if Ok, None if Err
```

**Use case:** When you need to pass a value to code that expects Maybe:

```typescript
import { toMaybeFromResult } from '@deessejs/core';

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
import { fromUndefinedable, some, none } from '@deessejs/core';

fromUndefinedable(42);    // Some(42)
fromUndefinedable(undefined); // None
```

This is equivalent to `fromNullable` but specifically for handling `undefined`:

```typescript
import { fromUndefinedable } from '@deessejs/core';

// Use when the value might be undefined (but not null)
const name = fromUndefinedable(getOptionalName());
```

---

## Real-World Examples

### API to Domain Conversion

```typescript
import { toResult, fromNullable } from '@deessejs/core';

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
import { toResult, fromUndefinedable } from '@deessejs/core';

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
import { toMaybeFromResult, ok, err, toResult, some, none } from '@deessejs/core';

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

## Related

- [Result](./result.md) - Explicit error handling
- [Maybe](./maybe.md) - Optional values
- [Error](./error.md) - Structured error types
