# Result

The Result type represents a value that can be either a success (`Ok`) or a failure (`Err`). It's the cornerstone of explicit error handling.

## Why Result?

TypeScript promises type safety, but traditional error handling breaks that promise. When a function can throw, the type system can't help you handle errors - they're invisible until runtime.

### The Problem with Exceptions

In traditional JavaScript/TypeScript, errors are handled via exceptions:

```typescript
// This function CAN throw, but the type says it returns User
const user = JSON.parse(data); // Type: User

// Callers have no idea this can fail
function processUser(data: string): User {
  return JSON.parse(data); // No error in the type!
}

// You MUST remember to wrap in try/catch
try {
  const user = processUser(data);
} catch (e) {
  // But what if you forget?
}
```

**Problems with this approach:**
1. Errors are **invisible in the type signature** - callers don't know a function can fail
2. TypeScript can't enforce error handling at compile time
3. It's easy to forget try/catch, leading to unhandled exceptions
4. Error handling is asynchronous (control flow jumps elsewhere)

### The Result Solution

With Result, **errors become explicit in the type**:

```typescript
import { ok, err, isOk, isErr } from '@deessejs/fp';

// The type signature tells you this can fail
function parseUser(data: string): Result<User, ParseError> {
  try {
    return ok(JSON.parse(data));
  } catch (e) {
    return err({ type: 'parse', message: e.message });
  }
}

// TypeScript FORCES you to handle both cases
const result = parseUser(data);

if (isOk(result)) {
  // TypeScript knows result.value exists here
  console.log(result.value.name);
} else {
  // TypeScript knows result.error exists here
  console.error('Failed to parse:', result.error);
}
```

Key concepts:

- **`Result<User, ParseError>`** - Two generic types: success value (`User`) and error type (`ParseError`)
- **`ok(value)`** - Wraps success: `{ ok: true, value: T }`
- **`err(error)`** - Wraps failure: `{ ok: false, error: E }`
- **`isOk()`** - Type guard that narrows to the success branch
- TypeScript forces you to handle both cases - errors become impossible to ignore

### Comparison

| Aspect | Exceptions | Result |
|--------|-----------|--------|
| Error in type signature | No | Yes |
| Compile-time safety | No | Yes |
| Forced handling | No | Yes |
| Composable | No | Yes |
| Testable | Hard | Easy |

### When to Use Result

- **Parsing** - Validate and transform data (JSON, user input, config files)
- **API calls** - Network errors are expected, not exceptional
- **File operations** - Files may not exist, permissions may be denied
- **Business logic** - Validation errors, not bugs

Use exceptions for **truly unexpected** errors (programmer mistakes, out-of-memory, etc.).

---

## Quick Start

```typescript
import { ok, err, isOk, isErr } from '@deessejs/fp';

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
import { ok } from '@deessejs/fp';

const result = ok(42);
// { ok: true, value: 42 }
```

#### `err(error)` - Create a failure

```typescript
import { err } from '@deessejs/fp';

const result = err('Not found');
// { ok: false, error: 'Not found' }
```

> **Tip:** The error type `E` is completely flexible. Use strings, objects, or custom error types:

```typescript
import { err } from '@deessejs/fp';

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
import { ok, isOk } from '@deessejs/fp';

const result = ok(42);

if (isOk(result)) {
  console.log(result.value); // TypeScript knows it's Ok
}
```

#### `isErr(result)` - Check for failure

```typescript
import { err, isErr } from '@deessejs/fp';

const result = err('error');

if (isErr(result)) {
  console.log(result.error); // TypeScript knows it's Err
}
```

> **Why type guards?** They narrow the type, so TypeScript knows which branch you're in:

```typescript
import { isOk, isErr, Result } from '@deessejs/fp';

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
import { ok, err, map } from '@deessejs/fp';

const result = ok(2);
const doubled = map(result, x => x * 2);
// Ok(4)

const failed = map(err('error'), x => x * 2);
// Err('error')
```

Equivalent to the method on Ok:

```typescript
import { ok } from '@deessejs/fp';

ok(2).map(x => x * 2); // Ok(4)
```

#### `flatMap(result, fn)` - Chain operations

Chains operations that can fail. If Ok, applies the function. If Err, returns Err:

```typescript
import { ok, err, flatMap, Result } from '@deessejs/fp';

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
import { ok, err, mapErr } from '@deessejs/fp';

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
import { ok, err, getOrElse } from '@deessejs/fp';

const success = getOrElse(ok(42), 0);  // 42
const failure = getOrElse(err('oops'), 0); // 0
```

#### `getOrCompute(result, fn)` - Get value or compute fallback

Returns the success value, or computes one if Err. Useful for expensive fallbacks:

```typescript
import { ok, err, getOrCompute } from '@deessejs/fp';

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
import { ok, err, tap } from '@deessejs/fp';

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
import { ok, err, tapErr } from '@deessejs/fp';

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
import { ok, match } from '@deessejs/fp';

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
import { err, match } from '@deessejs/fp';

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
import { ok, err, toNullable } from '@deessejs/fp';

toNullable(ok(42));   // 42
toNullable(err('x')); // null
```

#### `toUndefined(result)` - Convert to undefined

```typescript
import { ok, err, toUndefined } from '@deessejs/fp';

toUndefined(ok(42));   // 42
toUndefined(err('x')); // undefined
```

#### `toMaybeFromResult(result)` / `fromResult(result)` - Convert to Maybe

```typescript
import { ok, err, toMaybeFromResult, fromResult } from '@deessejs/fp';

toMaybeFromResult(ok(42)); // Some(42)
fromResult(err('x'));     // None
```

---

## Method Chaining

Result objects have methods built-in, enabling fluent chains:

```typescript
import { ok, err } from '@deessejs/fp';

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
import { ok, err, flatMap, getOrElse, Result } from '@deessejs/fp';

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
import { ok, err, flatMap, Result } from '@deessejs/fp';

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
import { ok, err, getOrElse, Result } from '@deessejs/fp';

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
import { Result } from '@deessejs/fp';

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
import { match } from '@deessejs/fp';

const display = match(
  result,
  user => `<div>Welcome, ${user.name}</div>`,
  error => `<div class="error">${error.message}</div>`
);
```

### 3. Keep Error Handling Local

```typescript
import { getOrElse } from '@deessejs/fp';

// Good: Handle errors where you need the value
const user = getOrElse(fetchUser(id), { id: 0, name: 'Guest' });

// Avoid: Swallowing errors silently unless that's intentional
const user = getOrElse(fetchUser(id), { id: 0, name: 'Guest' }); // Explicit fallback
```

---

## Composition

### `all(...results)` - Combine multiple Results

Combines multiple Results into a single Result. Returns Ok with array of all values if all are Ok, or the first Err (fail-fast):

```typescript
import { ok, err, all } from '@deessejs/fp';

const result = all(ok(1), ok(2), ok(3));
// Ok([1, 2, 3])

const result2 = all(ok(1), err('error'), ok(3));
// Err('error')
```

### `swap(result)` - Swap Ok and Err

Swaps the success and error types:

```typescript
import { ok, err, swap } from '@deessejs/fp';

const result: Result<string, number> = ok('hello');
const swapped = swap(result);
// Err<string>('hello')

const result2: Result<string, number> = err(42);
const swapped2 = swap(result2);
// Ok<number>(42)
```

Also available as a method:

```typescript
ok('hello').swap(); // Err('hello')
err(42).swap();     // Ok(42)
```

### `unwrap(result)` - Get value or throw

Extracts the value if Ok, throws the error if Err:

```typescript
import { ok, err, unwrap } from '@deessejs/fp';

unwrap(ok(42));    // 42
unwrap(err('oops')); // throws 'oops'
```

Also available as a method:

```typescript
ok(42).unwrap();    // 42
err('oops').unwrap(); // throws 'oops'
```

---

## Error Type Unions

When chaining `flatMap`, error types are properly unioned:

```typescript
const step1 = (): Result<string, 'ERR_A'> => ok('a');
const step2 = (): Result<number, 'ERR_B'> => ok(1);

// Type: Result<number, 'ERR_A' | 'ERR_B'>
const result = flatMap(step1(), () => step2());
```

---

## Error Discrimination

Error type `E` can be anything - strings, objects, or custom types. For better error handling, use discriminated unions:

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

| Feature | @deessejs/fp | fp-ts | neverthrow |
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
