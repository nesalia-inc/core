# Migrating from neverthrow to @deessejs/fp

This guide shows you how to migrate from [neverthrow](https://github.com/supermacro/neverthrow) to @deessejs/fp. The libraries share similar concepts but @deessejs/fp offers additional types, better type inference, and active maintenance.

## Why Migrate?

| Concern | neverthrow | @deessejs/fp |
|---------|-----------|--------------|
| Last significant commit | Feb 2026 | Actively maintained |
| React 19 support | Broken | Works |
| `fromPromise` errorFn | Not optional | Optional |
| Type inference | Occasional failures | Consistent |
| Issue response time | Variable | < 48 hours |
| Maybe type | No | Yes |
| Try type | No | Yes |
| AsyncResult allSettled | No | Yes |
| Zod validation | No | Yes (optional) |

## Installation

```bash
npm install @deessejs/fp
```

## Quick Reference

### Basic Types

| neverthrow | @deessejs/fp |
|------------|--------------|
| `Result<T, E>` | `Result<T, E>` |
| `ResultAsync<T, E>` | `AsyncResult<T, E>` |
| `Ok` | `ok()` |
| `Err` | `err()` |
| N/A | `Maybe<T>` (Some/None) |
| N/A | `Try<T, E>` |

## Core Differences

### 1. Creating Results

**neverthrow:**
```typescript
import { ok, err, Result } from 'neverthrow';

const success: Result<number, Error> = ok(42);
const failure: Result<number, Error> = err(new Error('failed'));
```

**@deessejs/fp:**
```typescript
import { ok, err } from '@deessejs/fp';

const success = ok(42);
const failure = err(new Error('failed'));
```

### 2. Method Chaining

**neverthrow:**
```typescript
const result = await ResultAsync.fromPromise(fetch('/api/user'))
  .map(user => user.name)
  .mapErr(error => new AppError('FETCH_FAILED', error));
```

**@deessejs/fp:**
```typescript
const result = await fromPromise(fetch('/api/user'))
  .map(user => user.name)
  .mapErr(error => error({ name: 'FETCH_FAILED', message: error.message }));
```

### 3. Type Guards

**neverthrow:**
```typescript
if (result.isOk()) {
  console.log(result.value);
}
```

**@deessejs/fp:**
```typescript
if (isOk(result)) {
  console.log(result.value);
}
```

### 4. Pattern Matching

**neverthrow:**
```typescript
result.match(
  (value) => handleSuccess(value),
  (error) => handleError(error)
);
```

**@deessejs/fp:**
```typescript
match(result, {
  onSuccess: (value) => handleSuccess(value),
  onError: (error) => handleError(error)
});

// Or with function-style:
match(result,
  (value) => handleSuccess(value),
  (error) => handleError(error)
);
```

## API Mapping

### Result Creation

| neverthrow | @deessejs/fp |
|-----------|--------------|
| `Result.ok(value)` | `ok(value)` |
| `Result.err(error)` | `err(error)` |
| `new Ok(value)` | `ok(value)` |
| `new Err(error)` | `err(error)` |
| `Result.fromNullable(value, errorFn)` | `fromNullable(value).mapErr(errorFn)` |
| `Result.fromPromise(promise)` | `fromPromise(promise)` |
| `Result.fromPromise(promise, errorFn)` | `fromPromise(promise).mapErr(errorFn)` |

### Result Methods

| neverthrow | @deessejs/fp |
|-----------|--------------|
| `.isOk()` | `.ok` or `isOk(result)` |
| `.isErr()` | `.ok === false` or `isErr(result)` |
| `.map(fn)` | `.map(fn)` |
| `.mapErr(fn)` | `.mapErr(fn)` |
| `.flatMap(fn)` | `.flatMap(fn)` |
| `.match(okFn, errFn)` | `.match({ onSuccess: okFn, onError: errFn })` |
| `.unwrap()` | `.unwrap()` |
| `.unwrapOr(default)` | `.getOrElse(default)` |
| `.andThen(fn)` | `.flatMap(fn)` |
| `.tap(fn)` | `.tap(fn)` |
| `.tapErr(fn)` | `.tapErr(fn)` |
| `.swap()` | `.swap()` |

### AsyncResult (ResultAsync)

| neverthrow | @deessejs/fp |
|-----------|--------------|
| `ResultAsync.fromPromise(promise)` | `fromPromise(promise)` |
| `ResultAsync.fromPromise(promise, errorFn)` | `fromPromise(promise).mapErr(errorFn)` |
| `.map(fn)` | `.map(fn)` |
| `.mapErr(fn)` | `.mapErr(fn)` |
| `.flatMap(fn)` | `.flatMap(fn)` |
| `.match(okFn, errFn)` | `.match({ onSuccess: okFn, onError: errFn })` |
| `.unwrap()` | `.unwrap()` |
| `.unwrapOr(default)` | `.getOrElse(default)` |
| `.tap(fn)` | `.tap(fn)` |
| `.tapErr(fn)` | `.tapErr(fn)` |

### Additional Types in @deessejs/fp

@deessejs/fp includes types that neverthrow doesn't have:

#### Maybe Type

For optional values without null/undefined:

```typescript
import { some, none, fromNullable, isSome, isNone, map as mapMaybe } from '@deessejs/fp';

// Creation
const present = some(42);
const absent = none();

// From nullable
const value1 = fromNullable(someValue);  // Some or None
const value2 = fromNullable(null);        // None

// Transformation
const doubled = mapMaybe(present, x => x * 2);

// Extraction
const result = getOrElse(absent, 0);  // 0
```

#### Try Type

For wrapping synchronous functions that might throw:

```typescript
import { attempt } from '@deessejs/fp';

const result = attempt(() => JSON.parse(userInput));
// Returns Try<parsed, Error>
```

#### Error System with Zod

@deessejs/fp integrates with Zod for validated errors:

```typescript
import { error } from '@deessejs/fp';
import { z } from 'zod';

const ValidationError = error({
  name: 'ValidationError',
  schema: z.object({
    field: z.string(),
    value: z.union([z.string(), z.number()]),
  }),
  message: (args) => `"${args.field}" is invalid: ${args.value}`,
});

// Use with Result
const result = err(ValidationError({ field: 'email', value: 123 }));
```

## Migration Examples

### Example 1: Basic API Call

**neverthrow:**
```typescript
import { ResultAsync, err, ok } from 'neverthrow';

interface User {
  id: string;
  name: string;
}

async function fetchUser(id: string): Promise<ResultAsync<User, Error>> {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    return err(new Error(`HTTP ${response.status}`));
  }

  const data = await response.json();
  return ok(data);
}

// Usage
const result = await fetchUser('123');
result
  .map(user => console.log(user.name))
  .mapErr(error => console.error(error));
```

**@deessejs/fp:**
```typescript
import { fromPromise, ok, err, isOk, map, mapErr, tap, tapErr } from '@deessejs/fp';

interface User {
  id: string;
  name: string;
}

function fetchUser(id: string) {
  return fromPromise(fetch(`/api/users/${id}`))
    .andThen(async (response) => {
      if (!response.ok) {
        return err(new Error(`HTTP ${response.status}`));
      }
      return ok(await response.json());
    });
}

// Usage
const result = await fetchUser('123');
result
  .tap(user => console.log(user.name))
  .tapErr(error => console.error(error));
```

### Example 2: Chained Operations

**neverthrow:**
```typescript
const result = await ResultAsync.fromPromise(fetchUser(id))
  .map(user => user.profile)
  .mapErr(error => new AppError('FETCH_PROFILE', error))
  .andThen(profile => validateProfile(profile))
  .andThen(profile => saveProfile(profile));
```

**@deessejs/fp:**
```typescript
const result = await fromPromise(fetchUser(id))
  .map(user => user.profile)
  .mapErr(error => error({ name: 'FETCH_PROFILE', message: error.message }))
  .flatMap(profile => validateProfile(profile))
  .flatMap(profile => saveProfile(profile));
```

### Example 3: Parallel Operations

**neverthrow (no direct support):**
```typescript
// Manual Promise.all with Result
const [userResult, postsResult] = await Promise.all([
  fetchUser(id).toPromise(),
  fetchPosts(id).toPromise(),
]);

if (userResult.isErr()) {
  return err(userResult.error);
}
if (postsResult.isErr()) {
  return err(postsResult.error);
}
return ok({ user: userResult.value, posts: postsResult.value });
```

**@deessejs/fp (with allSettled):**
```typescript
const [userResult, postsResult] = await all(
  fetchUser(id),
  fetchPosts(id)
);

// Returns AsyncResult<[User, Post], Error[]>
// Never Err - always Ok with collected errors
```

### Example 4: Using Maybe for Optional Values

neverthrow doesn't have a Maybe type. Here's how to transition:

**Without Maybe (null checks):**
```typescript
// This is what you'd do with only Result
const user = findUserById(id);
if (user === null) {
  return err(new Error('NOT_FOUND'));
}
return ok(user);
```

**With @deessejs/fp Maybe:**
```typescript
import { some, none, fromNullable, toResult, isSome } from '@deessejs/fp';

const user = fromNullable(findUserById(id))
  .mapErr(() => error({ name: 'NOT_FOUND', message: 'User not found' }));

if (isSome(user)) {
  // user.value is available
}
```

### Example 5: Error Enrichment

@deessejs/fp supports error enrichment with notes and cause chains:

```typescript
import { error, err } from '@deessejs/fp';

const NetworkError = error({
  name: 'NetworkError',
  schema: z.object({ host: z.string().optional() }),
});

const ValidationError = error({
  name: 'ValidationError',
  schema: z.object({ field: z.string() }),
});

// Enrich errors with context
const enriched = err(ValidationError({ field: 'email' }))
  .mapErr(e => e
    .addNotes('While processing user registration')
    .from(NetworkError({ host: 'api.example.com' })));
```

## Common Patterns

### Safe Navigation

**neverthrow:**
```typescript
// Use andThen for safe navigation
const result = await ResultAsync.fromPromise(fetchUser(id))
  .andThen(user => ok(user.address?.city ?? null));
```

**@deessejs/fp:**
```typescript
// Use flatMap with fromNullable for safe navigation
const result = await fromPromise(fetchUser(id))
  .flatMap(user => fromNullable(user.address?.city));
```

### Collecting Errors

**neverthrow:**
```typescript
// Manual collection
const results = await Promise.all([
  validateEmail(input.email).toPromise(),
  validatePassword(input.password).toPromise(),
  validateUsername(input.username).toPromise(),
]);

const errors = results.filter(r => r.isErr());
if (errors.length > 0) {
  return err(errors.map(e => e.error));
}
```

**@deessejs/fp:**
```typescript
import { allSettled } from '@deessejs/fp';

const results = await allSettled(
  validateEmail(input.email),
  validatePassword(input.password),
  validateUsername(input.username)
);

// results is AsyncResult<[T[], E[]], E[]>
// All errors collected, never Err
```

## Frequently Asked Questions

### Q: Is the API compatible with TypeScript 5.x?

A: Yes. @deessejs/fp requires TypeScript 5.0+ and takes advantage of modern TypeScript features for better type inference.

### Q: Does @deessejs/fp work with React 19?

A: Yes. neverthrow's `ResultAsync.fromPromise` has known issues with React 19 server components. @deessejs/fp's `fromPromise` works correctly.

### Q: How do I handle Zod validation errors?

A: Use the error factory with Zod schema:

```typescript
import { error } from '@deessejs/fp';
import { z } from 'zod';

const MyError = error({
  name: 'MyError',
  schema: z.object({ field: z.string() }),
});

// Zod validation happens at error creation
const err = MyError({ field: 123 }); // Throws ZodValidationError
const validErr = MyError({ field: 'valid' }); // Works
```

### Q: Can I use @deessejs/fp alongside neverthrow during migration?

A: Yes, but we recommend completing the migration to avoid bundle size overhead. Both libraries can coexist if needed.

### Q: How do I handle backward compatibility with existing code?

A: Create wrapper functions:

```typescript
import { fromPromise } from '@deessejs/fp';
import { ResultAsync } from 'neverthrow';

// Wrapper for neverthrow ResultAsync
const toNeverthrow = <T>(result: AsyncResult<T, Error>): ResultAsync<T, Error> => {
  return ResultAsync.fromPromise(
    result.unwrap().then(r => r.ok ? Promise.resolve(r.value) : Promise.reject(r.error))
  );
};
```

## Next Steps

- Read the [Result documentation](../features/result.md)
- Read the [AsyncResult documentation](../features/async-result.md)
- Read the [Maybe documentation](../features/maybe.md)
- Read the [Error documentation](../features/error.md)
- Check out [comparison with fp-ts](./fp-ts.md)
