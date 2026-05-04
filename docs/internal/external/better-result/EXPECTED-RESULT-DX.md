# Result System: Expected DeesseJS Core DX

This document defines the target Developer Experience for the unified Result system in @deessejs/fp. It describes the ideal API and behavior that users should experience, serving as the source of truth for the Result system redesign.

---

## 1. Expected DeesseJS Core DX

### Philosophy

The Result type in @deessejs/fp should provide **expressive, composable, and type-safe** error handling. The API follows railway-oriented programming principles with generator-based composition as a first-class feature.

### Core Principles

1. **Results are values** - Results flow through the system like any other value
2. **Results are composable** - Work seamlessly with `Result.gen` generator composition
3. **Results are pipeable** - Functions support both data-first and data-last (pipeable) style
4. **Results are typed** - Full type inference with phantom types for error unions
5. **Results are inspectable** - Easy observation with `tap`, `tapErr`, `tapBoth`

---

## 2. Creating Results

### Factory Functions

Results are created via simple factory functions. No classes exposed to users.

```typescript
import { ok, err, error } from '@deessejs/fp';

// Create Ok result
const result = ok({ id: "123", name: "Alice" });
// Result<{ id: string, name: string }, never>

// Create Err result with domain error
const GenericError = error({ name: "GenericError" });
const errorResult = err(GenericError({ message: "Something failed" }));
// Result<never, GenericError>
```

### With Domain Errors

```typescript
const NotFoundError = error({
  name: "NotFoundError",
  schema: z.object({ id: z.string() })
});

// Create error result with typed error
const result = err(NotFoundError({ id: "123" }));
// Result<never, NotFoundError>
```

### Wrapping Throwing Functions (attempt)

Use `Result.attempt()` to wrap synchronous functions that may throw:

```typescript
import { Result } from '@deessejs/fp';

const ParseError = error({ name: "ParseError" });

// Wrap a function that might throw
const parseResult = Result.attempt(
  () => JSON.parse(input),
  (cause) => ParseError({ input, cause })
);
// Result<unknown, ParseError>

// With default error type (no catch transform)
const parseResult2 = Result.attempt(() => JSON.parse(input));
// Result<unknown, Error>
```

### Wrapping Async Functions (attemptAsync)

Use `Result.attemptAsync()` for async functions that may throw:

```typescript
import { Result } from '@deessejs/fp';

const NetworkError = error({ name: "NetworkError" });
const ValidationError = error({ name: "ValidationError" });

// Async function with custom error mapping
const fetchResult = await Result.attemptAsync(
  async () => {
    const response = await fetch('/api/user');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  },
  (cause) => NetworkError({ url: '/api/user', cause })
);
// Result<User, NetworkError>

// Multiple error types with conditional mapping
const processResult = await Result.attemptAsync(
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

### Error Mapping Signature

The `catch` transform receives the thrown error and must return a domain error:

```typescript
Result.attempt(
  fn: () => T,
  catch: (cause: unknown) => E
): Result<T, E>
```

Without `catch`, the error type is `Error` (native JS Error).

### Converting Promises (fromPromise)

Use `Result.fromPromise()` for promises that reject with errors (not throws):

```typescript
import { Result } from '@deessejs/fp';

// Promise rejection becomes Err
const result = await Result.fromPromise(
  fetch('/api/user').then(r => r.json())
);
// Result<User, Error>

// With error type inference from rejection
const result = await Result.fromPromise(
  fetch('/api/user').then(r => r.json()),
  (cause) => cause instanceof NetworkError
    ? cause
    : new Error('fetch failed', { cause })
);
// Result<User, NetworkError>
```

### Falsy Values

Ok results can contain falsy values like `false`, `0`, `""`, or `null`. Use `isOk()` to check:

```typescript
const falsyOk = ok(false);
const zeroOk = ok(0);
const emptyOk = ok("");

// Check with isOk() / isErr() - do NOT use truthiness
if (falsyOk.isOk()) {
  // falsyOk.value is false, but this branch executes
}
```

---

## 3. Type Guards

### isOk / isErr

```typescript
import { isOk, isErr } from '@deessejs/fp';

const result = ok({ id: "123" });

if (isOk(result)) {
  result.value.id  // Fully narrowed
}

if (isErr(result)) {
  result.error  // Error type
}
```

---

## 4. Mapping Results

### map - Transform Ok Value

```typescript
const result = ok({ id: "123", name: "Alice" });

// Transform the value
const upperName = result.map(user => user.name.toUpperCase());
// Result<string, never>

// pipeable style
const upperName = Result.map(user => user.name.toUpperCase())(result);
```

### mapErr - Transform Error

```typescript
const NotFoundError = error({ name: "NotFoundError", schema: z.object({ id: z.string() }) });
const PermissionError = error({ name: "PermissionError", schema: z.object({ resource: z.string() }) });

const result = err(NotFoundError({ id: "123" }));

// Transform the error
const typed = result.mapErr(err => PermissionError({ resource: err.id }));
// Result<never, PermissionError>

// pipeable style
const typed = Result.mapErr(err => PermissionError({ resource: err.id }))(result);
```

---

## 5. Chaining Results

### flatMap / andThen - Chain Operations

```typescript
const result = ok({ userId: "123" });

// Chain a second operation
const userResult = result.flatMap(({ userId }) => fetchUser(userId));
// Result<User, FetchError>

// pipeable style
const userResult = Result.flatMap(({ userId }) => fetchUser(userId))(result);
```

---

## 6. Generator Composition (Result.gen)

### Railway-Oriented Programming

The key power feature: `Result.gen` enables clean sequential composition with automatic error union inference.

```typescript
import { Result, ok, err, error, Result.gen } from '@deessejs/fp';

const NotFoundError = error({ name: "NotFoundError", schema: z.object({ id: z.string() }) });
const ValidationError = error({ name: "ValidationError", schema: z.object({ field: z.string() }) });

const result = await Result.gen(async function* () {
  // Normal flow - yield* unwraps Ok
  const user = yield* ok({ id: "123", name: "Alice", active: true });

  // Short-circuit on validation failure - yield* Err stops here
  if (!user.active) {
    yield* ValidationError({ field: "user.active" });
  }

  // Another operation
  const profile = yield* fetchProfile(user.id);

  return { user, profile };
});
// Result<{ user: User, profile: Profile }, NotFoundError | ValidationError>
```

### Why Result.gen?

```typescript
// BEFORE: Nested flatMap (callback hell)
const result = ok(userId)
  .flatMap(fetchUser)
  .flatMap(user => user.active
    ? ok(user)
    : err(ValidationError({ field: "user.active" })))
  .flatMap(fetchProfile)
  .map(({ user, profile }) => ({ user, profile }));

// AFTER: Linear generator flow
const result = Result.gen(async function* () {
  const user = yield* fetchUser(userId);
  if (!user.active) {
    yield* ValidationError({ field: "user.active" });
  }
  const profile = yield* fetchProfile(user.id);
  return { user, profile };
});
```

### Error Union Inference

Phantom types enable TypeScript to automatically collect error unions:

```typescript
const result = Result.gen(async function* () {
  const user = yield* fetchUser(id);           // Result<User, UserError>
  const post = yield* fetchPost(postId);       // Result<Post, PostError>
  const comment = yield* fetchComment(cId);    // Result<Comment, CommentError>

  return { user, post, comment };
});
// Result<{ user, post, comment }, UserError | PostError | CommentError>
// TypeScript infers the error union automatically!
```

---

## 7. AsyncResult

### Relationship to Result

`AsyncResult` handles asynchronous operations that may fail. It integrates with `Result.gen` via `Result.await`:

```typescript
const result = await Result.gen(async function* () {
  // Async operations use Result.await
  const user = yield* Result.await(fetchUser(id));
  const posts = yield* Result.await(fetchPosts(user.id));

  return { user, posts };
});
```

### AsyncResult Methods

AsyncResult supports the same operations as Result:

```typescript
const asyncResult = AsyncResult.fromPromise(fetchUser(id));

// Map
const mapped = asyncResult.map(user => user.name);

// Chain
const chained = asyncResult.flatMap(user => AsyncResult.fromPromise(fetchPosts(user.id)));

// Observe
await asyncResult.tap(user => console.log(user));
await asyncResult.tapErr(err => console.error(err));
```

---

## 8. Maybe vs Result

Use `Maybe` when a value may or may not exist (no error context). Use `Result` when an operation may succeed or fail (with error context).

| Scenario | Type | Example |
|----------|------|---------|
| Value optional | `Maybe<T>` | `Maybe<User>` - user may not exist |
| Operation can fail | `Result<T, E>` | `Result<User, NotFoundError>` - fetch may fail |
| Validation error | `Result<T, E>` | `Result<User, ValidationError>` - invalid input |
| Network failure | `Result<T, E>` | `Result<Data, NetworkError>` - connection issue |

---

## 9. Observation

### tap - Side Effect on Ok

```typescript
const result = ok({ id: "123", name: "Alice" });

// Observe without changing
result.tap(user => console.log("User:", user.name));
// Result<{ id, name }, never> (unchanged)
```

### tapErr - Side Effect On Err

```typescript
const result = err(NotFoundError({ id: "123" }));

// Observe error without changing
result.tapErr(e => console.error("Error:", e._tag, e.id));
```

### tapBoth - Symmetric Observation

```typescript
const result = await someOperation();

// Observe both cases
result.tapBoth({
  ok: (value) => console.log("Success:", value),
  err: (error) => console.log("Failed:", error._tag),
});
```

---

## 10. Pattern Matching

### match - Exhaustive Matching

```typescript
import { match } from '@deessejs/fp';

const result = someOperation();

const message = match(result, {
  ok: (value) => `Got: ${value.name}`,
  err: (error) => `Error: ${error._tag}`,
});
```

---

## 11. Extraction

### getOrElse - Fallback Value

```typescript
const result = ok({ id: "123" });

// Get value or default
const user = result.getOrElse({ id: "default", name: "Anonymous" });
// { id: string, name: string }
```

### getOrCompute - Lazy Fallback

```typescript
const result = err(NotFoundError({ id: "123" }));

// Compute default lazily
const user = result.getOrCompute(() => loadDefaultUser());
```

### unwrap - Extract Or Throw

```typescript
const result = ok({ id: "123" });

// Unwrap or throw
const user = result.unwrap();
// { id: "123" } - success

const failed = err(NotFoundError({ id: "123" }));
failed.unwrap();
// throws NotFoundError
```

---

## 12. Combination

### all - Combine Multiple Results

```typescript
const results = await Promise.all([
  fetchUser("1"),
  fetchUser("2"),
  fetchUser("3"),
]);

// All must be Ok
const users = Result.all(...results);
// Result<User[], UserError | PostError | ValidationError>
```

### race - First To Resolve

```typescript
const NetworkError = error({ name: "NetworkError" });

const winner = Result.race(
  fetchFromPrimary(),
  fetchFromSecondary()
);
// Result<User, NetworkError>
```

### traverse - Map Over Array

```typescript
const ids = ["1", "2", "3"];

// Transform array, fail-fast on first Err
const users = ids.traverse(id => fetchUser(id));
// Result<User[], FetchError>
```

---

## 13. Pipeable Functions

### dual() Pattern

All functions support both data-first and data-last styles:

```typescript
import { Result, pipe } from '@deessejs/fp';

// Data-first (method style)
const result = ok({ id: "123" }).map(user => user.name);

// Data-last (pipeable style)
const upperName = pipe(
  ok({ id: "123" }),
  Result.map(user => user.name),
  Result.tap(console.log)
);

// Works with any function
const process = pipe(
  Result.map(fn),
  Result.tapErr(logError),
  Result.flatMap(validate)
);
```

### Available Pipeable Functions

| Function | Description |
|----------|-------------|
| `Result.map(fn)` | Transform Ok value |
| `Result.mapErr(fn)` | Transform Err value |
| `Result.flatMap(fn)` | Chain operation |
| `Result.tap(fn)` | Observe Ok |
| `Result.tapErr(fn)` | Observe Err |
| `Result.tapBoth({ ok, err })` | Observe both |
| `Result.getOrElse(default)` | Extract or default |
| `Result.getOrCompute(fn)` | Extract or compute |
| `Result.match({ ok, err })` | Pattern match |
| `Result.swap()` | Swap Ok/Err |
| `Result.isOk()` | Type guard |
| `Result.isErr()` | Type guard |
| `Result.all(...results)` | Combine all |
| `Result.race(...results)` | First to resolve |
| `Result.traverse(items, fn)` | Map over array |
| `Result.attempt(fn, catch?)` | Wrap synchronous throwing function |
| `Result.attemptAsync(fn, catch?)` | Wrap async throwing function |
| `Result.fromPromise(promise, catch?)` | Convert rejecting Promise |
| `Result.fromPromise(promise, catch?)` | Convert Promise |
| `Result.await(asyncResult)` | Yield async in gen |

---

## 14. Complete Example

```typescript
import { Result, ok, err, error, match, Result.gen, pipe, AsyncResult } from '@deessejs/fp';
import { z } from 'zod';

// Define domain errors
const NotFoundError = error({
  name: "NotFoundError",
  schema: z.object({ id: z.string(), resource: z.string() })
});

const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string(), message: z.string() })
});

const PermissionError = error({
  name: "PermissionError",
  schema: z.object({ action: z.string(), resource: z.string() })
});

const NetworkError = error({
  name: "NetworkError",
  schema: z.object({ url: z.string() })
});

// Use in a Result.gen composition
async function getUserResource(userId: string, resourceId: string) {
  return Result.gen(async function* () {
    const user = yield* Result.await(fetchUser(userId));

    if (!user) {
      yield* NotFoundError({ id: userId, resource: "User" });
    }

    if (!user.canRead(resourceId)) {
      yield* PermissionError({ action: "read", resource: resourceId });
    }

    const resource = yield* Result.await(fetchResource(resourceId));

    if (!resource) {
      yield* NotFoundError({ id: resourceId, resource: "Resource" });
    }

    return resource;
  });
}

// Handle with pattern matching
const result = await getUserResource("u1", "r1");

const message = match(result, {
  ok: (resource) => `Got: ${resource.name}`,
  err: (error) => `Failed: ${error._tag}`,
});

// Or with pipe and tapBoth
pipe(
  result,
  Result.tapBoth({
    ok: (r) => console.log("Success:", r),
    err: (e) => console.error("Error:", e._tag, e)
  }),
  Result.map(r => r.name)
);
```

---

## 15. Summary

| Feature | DX |
|---------|-----|
| **Creation** | `ok(value)`, `err(error)` - no classes |
| **Wrapping** | `Result.attempt(fn)` for try/catch |
| **Async** | `Result.fromPromise(promise)`, `Result.await()` |
| **map** | `result.map(fn)` or `Result.map(fn)(result)` |
| **flatMap** | `result.flatMap(fn)` or `Result.flatMap(fn)(result)` |
| **Generator** | `Result.gen(function* { yield* ... })` |
| **Error union** | Automatic via phantom types |
| **Observation** | `tap`, `tapErr`, `tapBoth` |
| **Matching** | `match(result, { ok, err })` |
| **Combination** | `all`, `race`, `traverse` |
| **Pipeable** | All functions work data-first and data-last |

---

## 16. Implementation Reference

This DX specification serves as the source of truth for the Result system. See the companion documents:

- [ANALYSIS.md](./ANALYSIS.md) - Analysis of current implementation vs target
- [EXPECTED-ERROR-DX.md](./EXPECTED-ERROR-DX.md) - Error system DX (sister document)