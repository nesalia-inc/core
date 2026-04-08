# Try

The Try type wraps synchronous and asynchronous functions that might throw in a type-safe container. It's the bridge between imperative exception handling and functional error management.

## Why Try?

JavaScript/TypeScript exceptions can crash your app:

```typescript
// Problem: This can throw, but we don't see it in the type
const data = JSON.parse(userInput); // Can throw SyntaxError!
const user = JSON.parse(jsonString); // Can throw too!

// Solution: Wrap throwing functions with Try
import { attempt, Try } from '@deessejs/fp';
const result = attempt(() => JSON.parse(userInput));
// Type: Try<User, Error>
```

Try catches exceptions and converts them to typed errors. No more uncaught exceptions crashing your application.

---

## Quick Start

```typescript
import { attempt, attemptAsync, isOk, isErr } from '@deessejs/fp';

// Sync: wrap any throwing function
const result = attempt(() => JSON.parse('{"valid": true}'));

// Async: wrap async functions that might reject
const asyncResult = await attemptAsync(fetch('https://api.example.com'));
```

---

## API Reference

### Creating Tries

#### `attempt(fn)` - Wrap a synchronous function

```typescript
import { attempt } from '@deessejs/fp';

// Success case
const success = attempt(() => 42);
// TrySuccess(42)

// Failure case - catches the exception
const failure = attempt(() => {
  throw new Error('Something went wrong');
});
// TryFailure(Error: 'Something went wrong')
```

Key behaviors:
- Returns `TrySuccess<T>` if the function succeeds
- Returns `TryFailure<Error>` if the function throws
- Non-Error throws are wrapped in an Error object:

```typescript
// Strings are wrapped in Error
const r1 = attempt(() => { throw 'oops'; });
// TryFailure(Error: 'oops')

// Numbers are wrapped in Error
const r2 = attempt(() => { throw 42; });
// TryFailure(Error: '42')

// Objects are wrapped in Error
const r3 = attempt(() => { throw { code: 500 }; });
// TryFailure(Error: '[object Object]')
```

#### `attemptAsync(fn)` - Wrap an async function

```typescript
import { attemptAsync } from '@deessejs/fp';

// Success case
const success = await attemptAsync(async () => {
  const response = await fetch('https://api.example.com');
  return response.json();
});

// Failure case - catches rejected promises
const failure = await attemptAsync(async () => {
  throw new Error('Request failed');
});
```

---

### Type Guards

#### `isOk(t)` - Check for success

```typescript
import { attempt, isOk } from '@deessejs/fp';

const result = attempt(() => 42);

if (isOk(result)) {
  console.log(result.value); // TypeScript knows it's TrySuccess
}
```

#### `isErr(t)` - Check for failure

```typescript
import { attempt, isErr } from '@deessejs/fp';

const result = attempt(() => { throw new Error('oops'); });

if (isErr(result)) {
  console.log(result.error.message); // TypeScript knows it's TryFailure
}
```

---

### Transformation Methods

#### `map(t, fn)` - Transform the value

Transforms the success value, passes failures through unchanged:

```typescript
import { attempt, map } from '@deessejs/fp';

const result = map(attempt(() => 2), x => x * 2);
// TrySuccess(4)

const failed = map(attempt(() => { throw new Error(); }), x => x * 2);
// TryFailure(Error)
```

Equivalent to the method on TrySuccess:

```typescript
import { attempt } from '@deessejs/fp';

attempt(() => 2).map(x => x * 2); // TrySuccess(4)
```

#### `flatMap(t, fn)` - Chain operations

Chains operations that can throw. If success, applies the function. If failure, returns failure:

```typescript
import { attempt, flatMap, Try } from '@deessejs/fp';

const parseNumber = (s: string): Try<number, Error> =>
  attempt(() => {
    const n = parseInt(s, 10);
    if (isNaN(n)) throw new Error('Invalid number');
    return n;
  });

const double = (n: number): Try<number, Error> =>
  attempt(() => n * 2);

// Chain them
const result = flatMap(attempt(() => '21'), parseNumber);
// TrySuccess(21)

const result2 = flatMap(attempt(() => 'abc'), parseNumber);
// TryFailure(Error: 'Invalid number')
```

> **When to use flatMap:** Whenever your transformation function itself might throw.

---

### Extraction Methods

#### `getOrElse(t, defaultValue)` - Get value or fallback

Returns the success value, or a default if failure:

```typescript
import { attempt, getOrElse } from '@deessejs/fp';

const success = getOrElse(attempt(() => 42), 0);  // 42
const failure = getOrElse(attempt(() => { throw new Error(); }), 0); // 0
```

#### `getOrCompute(t, fn)` - Get value or compute fallback

Returns the success value, or computes one if failure. Useful for expensive fallbacks:

```typescript
import { attempt, getOrCompute } from '@deessejs/fp';

const success = getOrCompute(attempt(() => 42), () => expensiveOperation());
// 42 (expensiveOperation never called)

const failure = getOrCompute(attempt(() => { throw new Error(); }), () => 0);
// 0 (computed on demand)
```

---

### Side Effects

#### `tap(t, fn)` - Side effect on success

Executes a function on the value without changing it. Useful for logging:

```typescript
import { attempt, tap } from '@deessejs/fp';

tap(attempt(() => 42), value => console.log('Got:', value));
// Logs: "Got: 42"
// Returns: TrySuccess(42)

tap(attempt(() => { throw new Error(); }), value => console.log('Got:', value));
// Nothing logged
// Returns: TryFailure(Error)
```

#### `tapErr(t, fn)` - Side effect on failure

Executes a function on the error without changing it:

```typescript
import { attempt, tapErr } from '@deessejs/fp';

tapErr(attempt(() => 42), err => console.error('Error:', err));
// Nothing logged

tapErr(attempt(() => { throw new Error('oops'); }), err => console.error('Error:', err));
// Logs: "Error: Error: oops"
// Returns: TryFailure(Error: 'oops')
```

---

### Pattern Matching

#### `match(t, okFn, errFn)` - Handle both cases

The most expressive way to handle Try:

```typescript
import { attempt, match } from '@deessejs/fp';

const result = attempt(() => 42);

const message = match(
  result,
  value => `Success: ${value}`,
  error => `Failed: ${error.message}`
);
// "Success: 42"
```

Can return different types:

```typescript
import { attempt, match } from '@deessejs/fp';

const result = attempt(() => { throw new Error('oops'); });

const value = match(
  result,
  x => x * 2,           // Success: double the number
  () => -1               // Failure: return -1
);
// -1
```

---

### Conversions

#### `toNullable(t)` - Convert to nullable

```typescript
import { attempt, toNullable } from '@deessejs/fp';

toNullable(attempt(() => 42));                        // 42
toNullable(attempt(() => { throw new Error(); }));   // null
```

#### `toUndefined(t)` - Convert to undefined

```typescript
import { attempt, toUndefined } from '@deessejs/fp';

toUndefined(attempt(() => 42));                        // 42
toUndefined(attempt(() => { throw new Error(); }));   // undefined
```

---

## Method Chaining

Try objects have methods built-in, enabling fluent chains:

```typescript
import { attempt } from '@deessejs/fp';

const result = attempt(() => 'hello')
  .map(s => s.toUpperCase())           // TrySuccess('HELLO')
  .map(s => s + '!')                    // TrySuccess('HELLO!')
  .flatMap(s => attempt(() => {
    if (s.length > 5) return s;
    throw new Error('Too short');
  }));
// TrySuccess('HELLO!')
```

---

## Real-World Examples

### JSON Parsing

```typescript
import { attempt, getOrElse, Try } from '@deessejs/fp';

interface User {
  id: number;
  name: string;
}

const parseUser = (json: string): Try<User, Error> =>
  attempt(() => {
    const obj = JSON.parse(json);
    if (typeof obj.id !== 'number' || typeof obj.name !== 'string') {
      throw new Error('Invalid user shape');
    }
    return obj as User;
  });

// Usage
const user = getOrElse(
  parseUser('{"id": 1, "name": "Alice"}'),
  { id: 0, name: 'Guest' } // fallback
);

// Safe to use - errors are handled
```

### File Operations (Node.js)

```typescript
import { attempt, Try } from '@deessejs/fp';
import { readFileSync } from 'fs';

type FileError = Error & { code?: string };

const readJsonFile = (path: string): Try<object, FileError> =>
  attempt(() => {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  });

// Usage with error handling
const config = readJsonFile('./config.json');

if (config.ok) {
  console.log('Config loaded:', config.value);
} else {
  console.error('Failed to load config:', config.error.message);
}
```

### Chained API Calls

```typescript
import { attemptAsync, flatMap, getOrElse, Try } from '@deessejs/fp';

interface User {
  id: number;
  name: string;
}

interface Post {
  id: number;
  userId: number;
  title: string;
}

const fetchUser = async (id: number): Promise<Try<User, Error>> =>
  attemptAsync(async () => {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

const fetchPosts = async (userId: number): Promise<Try<Post[], Error>> =>
  attemptAsync(async () => {
    const res = await fetch(`/api/users/${userId}/posts`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });

const getUserWithPosts = async (userId: number): Promise<Try<{ user: User; posts: Post[] }, Error>> =>
  attemptAsync(async () => {
    const userTry = await fetchUser(userId);
    if (!userTry.ok) throw userTry.error;

    const postsTry = await fetchPosts(userId);
    if (!postsTry.ok) throw postsTry.error;

    return { user: userTry.value, posts: postsTry.value };
  });

// Usage
const result = await getUserWithPosts(1);
const data = getOrElse(result, { user: { id: 0, name: 'Guest' }, posts: [] });
```

---

## Try vs Result vs Maybe

| Use Case | Type | Why |
|----------|------|-----|
| Function might throw | **Try** | Wraps exceptions, converts to typed errors |
| Operation can fail with error | **Result** | You control the error type explicitly |
| Value might be absent | **Maybe** | null/undefined become explicit |

> **When to use Try:** Wrap legacy code, external libraries, or anywhere exceptions can escape.
> **When to use Result:** Define your own error types for better type safety.

```typescript
// Try: for things that might throw
const parsed = attempt(() => JSON.parse(input));

// Result: for operations with controlled errors
const validated = validateUser(input); // Returns Result<User, ValidationError>
```

---

## Best Practices

### 1. Convert to Result for Better Error Types

```typescript
import { attempt, ok, err, Result } from '@deessejs/fp';

// Try gives you Error, but you can convert to Result with your own error type
const parseWithBetterErrors = (input: string): Result<number, 'PARSE_ERROR' | 'NEGATIVE'> => {
  const tried = attempt(() => {
    const n = parseInt(input, 10);
    if (isNaN(n)) throw new Error('parse error');
    if (n < 0) throw new Error('negative');
    return n;
  });

  if (tried.ok) return ok(tried.value);
  return err(tried.error.message === 'parse error' ? 'PARSE_ERROR' : 'NEGATIVE');
};
```

### 2. Use `tapErr` for Logging

```typescript
import { attempt, tapErr } from '@deessejs/fp';

// Log errors without breaking the chain
const result = attempt(() => riskyOperation())
  .tapErr(err => console.error('Operation failed:', err.message))
  .map(value => process(value));
```

### 3. Don't Overuse Try

```typescript
// Good: Wrap truly exceptional operations
const config = attempt(() => JSON.parse(readFileSync('config.json')));

// Avoid: Wrapping already-safe operations
const safe = attempt(() => 1 + 1); // Unnecessary
```

---

## Comparison with Alternatives

| Feature | @deessejs/fp | fp-ts Try |
|---------|---------------|-----------|
| Bundle size | ~2KB | ~40KB |
| Learning curve | Low | High |
| Async support | Yes (attemptAsync) | Yes |
| Custom error types | Via Result | Via mapping |
| Dependencies | 0 | Many |

---

## Related

- [Result](./result.md) - For explicit error types
- [Maybe](./maybe.md) - For optional values
- [AsyncResult](./async-result.md) - For async operations with error handling
