# Result

The Result type represents a value that can be either a success (`Ok`) or a failure (`Err`). It's the cornerstone of explicit error handling in @deessejs/core.

## Why Result?

TypeScript promises type safety, but traditional error handling breaks that promise:

```typescript
// Problem: This can throw, but the type says it returns User
const user = JSON.parse(data); // Type: User

// Solution: Errors are explicit in the type
import { attempt } from '@deessejs/core';
const user = attempt(() => JSON.parse(data)); // Type: Result<User, Error>
```

With Result, **errors become impossible to ignore**. TypeScript forces you to handle both success and failure cases at compile time.

---

## Quick Start

```typescript
import { ok, err, isOk, isErr } from '@deessejs/core';

// Success
const success: Result<number, string> = ok(42);

// Failure
const failure: Result<number, string> = err('Something went wrong');
```

---

## API Reference

### Creating Results

#### `ok(value)` - Create a success

```typescript
import { ok } from '@deessejs/core';

const result = ok(42);
// { ok: true, value: 42 }
```

#### `err(error)` - Create a failure

```typescript
import { err } from '@deessejs/core';

const result = err('Not found');
// { ok: false, error: 'Not found' }
```

> **Tip:** The error type `E` is completely flexible. Use strings, objects, or custom error types:

```typescript
import { err } from '@deessejs/core';

// Simple string errors
const r1 = err('error');

// Structured errors
const r2 = err({ code: 'NOT_FOUND', message: 'User not found' });

// Custom error classes
class NotFoundError extends Error {
  constructor(public resource: string) {
    super(`Not found: ${resource}`);
  }
}
const r3 = err(new NotFoundError('user'));
```

---

### Type Guards

#### `isOk(result)` - Check for success

```typescript
import { ok, isOk } from '@deessejs/core';

const result = ok(42);

if (isOk(result)) {
  console.log(result.value); // TypeScript knows it's Ok
}
```

#### `isErr(result)` - Check for failure

```typescript
import { err, isErr } from '@deessejs/core';

const result = err('error');

if (isErr(result)) {
  console.log(result.error); // TypeScript knows it's Err
}
```

> **Why type guards?** They narrow the type, so TypeScript knows which branch you're in:

```typescript
import { isOk, isErr, Result } from '@deessejs/core';

function handle(result: Result<number, string>) {
  if (isOk(result)) {
    // TypeScript knows: result is Ok<number>
    console.log(result.value);
  } else {
    // TypeScript knows: result is Err<string>
    console.log(result.error);
  }
}
```

---

### Transformation Methods

#### `map(result, fn)` - Transform the value

Transforms the success value, passes errors through unchanged:

```typescript
import { ok, err, map } from '@deessejs/core';

const result = ok(2);
const doubled = map(result, x => x * 2);
// Ok(4)

const failed = map(err('error'), x => x * 2);
// Err('error')
```

Equivalent to the method on Ok:

```typescript
import { ok } from '@deessejs/core';

ok(2).map(x => x * 2); // Ok(4)
```

#### `flatMap(result, fn)` - Chain operations

Chains operations that can fail. If Ok, applies the function. If Err, returns Err:

```typescript
import { ok, err, flatMap, Result } from '@deessejs/core';

interface User {
  id: number;
  name: string;
}

const findUser = (id: number): Result<User, string> => {
  if (id > 0) return ok({ id, name: 'John' });
  return err('Invalid id');
};

const getEmail = (user: User): Result<string, string> =>
  ok(user.name.toLowerCase() + '@example.com');

// Chain them
const result = flatMap(ok(1), findUser);
// Ok({ id: 1, name: 'John' })

const result2 = flatMap(ok(-1), findUser);
// Err('Invalid id')

const result3 = flatMap(ok(1), x => flatMap(findUser(x.id), getEmail));
// Ok('john@example.com')
```

> **When to use flatMap:** Whenever your transformation function itself returns a Result.

#### `mapErr(result, fn)` - Transform the error

Transforms the error, passes success through unchanged:

```typescript
import { ok, err, mapErr } from '@deessejs/core';

const result = mapErr(err('not found'), e => new Error(e));
// Err(Error: 'not found')

const success = mapErr(ok(42), e => new Error(e));
// Ok(42)
```

---

### Extraction Methods

#### `getOrElse(result, defaultValue)` - Get value or fallback

Returns the success value, or a default if Err:

```typescript
import { ok, err, getOrElse } from '@deessejs/core';

const success = getOrElse(ok(42), 0);  // 42
const failure = getOrElse(err('oops'), 0); // 0
```

#### `getOrCompute(result, fn)` - Get value or compute fallback

Returns the success value, or computes one if Err. Useful for expensive fallbacks:

```typescript
import { ok, err, getOrCompute } from '@deessejs/core';

const success = getOrCompute(ok(42), () => expensiveOperation());
// 42 (expensiveOperation never called)

const failure = getOrCompute(err('oops'), () => 0);
// 0 (computed on demand)
```

---

### Side Effects

#### `tap(result, fn)` - Side effect on success

Executes a function on the value without changing it. Useful for logging:

```typescript
import { ok, err, tap } from '@deessejs/core';

tap(ok(42), value => console.log('Got:', value));
// Logs: "Got: 42"
// Returns: Ok(42)

tap(err('error'), value => console.log('Got:', value));
// Nothing logged
// Returns: Err('error')
```

#### `tapErr(result, fn)` - Side effect on failure

Executes a function on the error without changing it:

```typescript
import { ok, err, tapErr } from '@deessejs/core';

tapErr(ok(42), err => console.error('Error:', err));
// Nothing logged

tapErr(err('oops'), err => console.error('Error:', err));
// Logs: "Error: oops"
// Returns: Err('oops')
```

---

### Pattern Matching

#### `match(result, okFn, errFn)` - Handle both cases

The most expressive way to handle Result:

```typescript
import { ok, match } from '@deessejs/core';

const result = ok(42);

const message = match(
  result,
  value => `Success: ${value}`,
  error => `Failed: ${error}`
);
// "Success: 42"
```

Can return different types:

```typescript
import { err, match } from '@deessejs/core';

const result = err('oops');

const value = match(
  result,
  x => x * 2,    // Ok: double the number
  () => -1       // Err: return -1
);
// -1
```

---

### Conversions

#### `toNullable(result)` - Convert to nullable

```typescript
import { ok, err, toNullable } from '@deessejs/core';

toNullable(ok(42));   // 42
toNullable(err('x')); // null
```

#### `toUndefined(result)` - Convert to undefined

```typescript
import { ok, err, toUndefined } from '@deessejs/core';

toUndefined(ok(42));   // 42
toUndefined(err('x')); // undefined
```

---

## Method Chaining

Result objects have methods built-in, enabling fluent chains:

```typescript
import { ok, err } from '@deessejs/core';

const result = ok(5)
  .map(x => x * 2)       // Ok(10)
  .map(x => x + 1)       // Ok(11)
  .flatMap(x => x > 10 ? ok(x) : err('too small'));
// Err('too small')
```

Each method returns a new Result, so you can chain indefinitely.

---

## Real-World Examples

### API Response Handling

```typescript
import { ok, err, flatMap, getOrElse, Result } from '@deessejs/core';

interface User {
  id: number;
  name: string;
}

interface ApiError {
  code: number;
  message: string;
}

const fetchUser = (id: number): Result<User, ApiError> => {
  // Imagine this makes an API call
  if (id <= 0) {
    return err({ code: 400, message: 'Invalid ID' });
  }
  return ok({ id, name: 'John' });
};

const getUserName = (id: number): Result<string, ApiError> =>
  flatMap(fetchUser(id), user => ok(user.name.toUpperCase()));

// Usage
const result = getUserName(1);
const displayName = getOrElse(result, 'Unknown');
```

### Input Validation

```typescript
import { ok, err, flatMap, Result } from '@deessejs/core';

interface User {
  age: number;
  email: string;
}

type ValidationError = { field: string; message: string };

const validateAge = (age: number): Result<number, ValidationError> => {
  if (age < 0) return err({ field: 'age', message: 'Must be positive' });
  if (age > 150) return err({ field: 'age', message: 'Must be realistic' });
  return ok(age);
};

const validateEmail = (email: string): Result<string, ValidationError> => {
  if (!email.includes('@')) return err({ field: 'email', message: 'Invalid format' });
  return ok(email);
};

// Chained validation
const validateUser = (age: number, email: string): Result<User, ValidationError> =>
  flatMap(validateAge(age), () =>
    flatMap(validateEmail(email), () =>
      ok({ age, email })
    )
  );
```

### File Operations

```typescript
import { readFileSync } from 'fs';
import { ok, err, getOrElse, Result } from '@deessejs/core';

type FileError = 'NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_JSON';

const readJsonFile = (path: string): Result<object, FileError> => {
  try {
    const content = readFileSync(path, 'utf-8');
    return ok(JSON.parse(content));
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes('ENOENT')) return err('NOT_FOUND');
      if (e.message.includes('EACCES')) return err('PERMISSION_DENIED');
    }
    return err('INVALID_JSON');
  }
};

// Usage
const config = getOrElse(
  readJsonFile('./config.json'),
  { defaults: true } // fallback
);
```

---

## Best Practices

### 1. Define Error Types

```typescript
import { Result } from '@deessejs/core';

// Good: Specific error types
type FetchError =
  | { type: 'network'; original: Error }
  | { type: 'not_found'; id: number }
  | { type: 'unauthorized' };

// Usage
const fetchUser = (id: number): Result<User, FetchError> => {
  // ...
};

// Handle specific errors
result.mapErr(e => {
  switch (e.type) {
    case 'not_found':
      return `User ${e.id} not found`;
    case 'network':
      return 'Network error';
  }
});
```

### 2. Use `match` for Complex Logic

```typescript
import { match } from '@deessejs/core';

const display = match(
  result,
  user => `<div>Welcome, ${user.name}</div>`,
  error => `<div class="error">${error.message}</div>`
);
```

### 3. Keep Error Handling Local

```typescript
import { getOrElse } from '@deessejs/core';

// Good: Handle errors where you need the value
const user = getOrElse(fetchUser(id), { id: 0, name: 'Guest' });

// Avoid: Swallowing errors silently unless that's intentional
const user = getOrElse(fetchUser(id), { id: 0, name: 'Guest' }); // Explicit fallback
```

---

## Known Limitations & Future Improvements

### 1. No `Result.all()` for composition

**Current behavior:** Chaining multiple operations requires nested `flatMap`, which leads to "callback hell".

**Workaround:** Use sequential chaining:

```typescript
import { ok, err, flatMap, Result } from '@deessejs/core';

const result = flatMap(validateName(input), name =>
  flatMap(validateEmail(input), email =>
    flatMap(validateAge(input), age =>
      ok({ name, email, age })
    )
  )
);
```

> **Note:** `Result.all()` method may be added in future versions to support parallel composition.

### 2. No `toMaybe()` conversion

**Current behavior:** No built-in way to convert a `Result` to a `Maybe`.

**Workaround:**

```typescript
import { isOk, Maybe, some, none } from '@deessejs/core';

const toMaybe = <T, E>(result: Result<T, E>): Maybe<T> =>
  isOk(result) ? some(result.value) : none();
```

> **Note:** A `toMaybe()` method may be added in future versions.

### 3. No `unwrap()` / `getOrThrow()`

**Current behavior:** No way to get the value or throw if error.

**Workaround:**

```typescript
const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.ok) return result.value;
  throw result.error;
};

// Usage in tests
expect(unwrap(ok(42))).toBe(42);
expect(() => unwrap(err('oops'))).toThrow();
```

> **Note:** An `unwrap()` method may be added for DX improvement.

### 4. No `swap()` method

**Current behavior:** No way to swap success and error types.

**Workaround:**

```typescript
import { ok, err, Result } from '@deessejs/core';

const swap = <T, E>(result: Result<T, E>): Result<E, T> =>
  result.ok ? err(result.value) : ok(result.error);

// Result<string, number> -> Result<number, string>
```

> **Note:** A `swap()` method may be added in future versions.

### 5. Static vs Instance API

**Current behavior:** Both static functions (`map(result, fn)`) and instance methods (`result.map(fn)`) are available.

**Trade-off:** As noted for Maybe, having both increases bundle size. Consider using only static functions with pipe pattern for smaller bundles.

### 6. Error type unions in `flatMap`

**Current behavior:** When chaining `flatMap`, error types are properly unioned.

```typescript
const step1 = (): Result<string, 'ERR_A'> => ok('a');
const step2 = (): Result<number, 'ERR_B'> => ok(1);

// Type: Result<number, 'ERR_A' | 'ERR_B'>
const result = flatMap(step1(), () => step2());
```

This is handled correctly by the current implementation.

### 7. `attempt` is in Try, not Result

**Note:** For wrapping synchronous functions that might throw, see [Try](./try.md). The `attempt()` function returns a `Try` type, which can be converted to `Result` if needed:

```typescript
import { attempt, ok, err } from '@deessejs/core';

const toResult = <T>(result: Try<T, Error>): Result<T, Error> =>
  result.ok ? ok(result.value) : err(result.error);
```

### 8. Error discrimination

**Current behavior:** Error type `E` can be anything - strings, objects, or custom types.

**Recommendation:** Use discriminated unions for better error handling:

```typescript
type AppError =
  | { type: 'validation'; field: string; message: string }
  | { type: 'network'; code: number }
  | { type: 'unauthorized' };

const handleError = (error: AppError) => {
  switch (error.type) {
    case 'validation':
      return `Invalid ${error.field}: ${error.message}`;
    case 'network':
      return `Network error: ${error.code}`;
    case 'unauthorized':
      return 'Please log in';
  }
};
```

---

## Comparison with Alternatives

| Feature | @deessejs/core | fp-ts | neverthrow |
|---------|---------------|-------|-------------|
| Bundle size | ~2KB | ~40KB | ~5KB |
| Learning curve | Low | High | Medium |
| Methods | 14 | 30+ | 20+ |
| TypeScript | 5.0+ | 4.0+ | 4.0+ |
| Dependencies | 0 | Many | 0 |

---

## Related

- [Maybe](./maybe.md) - For optional values (null/undefined)
- [Try](./try.md) - For wrapping sync/async functions that might throw
- [AsyncResult](./async-result.md) - For async operations with error handling
