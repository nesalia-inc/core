---
dep: DEP-0001
title: "Result: Unified Result Type with Generator Composition"
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

A unified `Result<T, E>` type with railway-oriented generator composition, phantom-type error union inference, and pipeable dual functions. The API provides expressive, composable, and type-safe error handling where Results flow through the system like any other value.

## Motivation

The Result type provides a disciplined approach to handling errors in TypeScript. By making error handling a first-class value rather than a side effect, code becomes more predictable, composable, and testable.

The design philosophy centers on five principles:

1. **Results are values** — Results flow through the system like any other value
2. **Results are composable** — Work seamlessly with `Result.gen` generator composition
3. **Results are pipeable** — Functions support both data-first and data-last (pipeable) style
4. **Results are typed** — Full type inference with phantom types for error unions
5. **Results are inspectable** — Easy observation with `tap`, `tapErr`, `tapBoth`

## Detailed Design

### Factory Functions

No classes exposed to users. Results are created via simple factory functions:

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

const result = err(NotFoundError({ id: "123" }));
// Result<never, NotFoundError>
```

### Wrapping Throwing Functions

`Result.attempt()` wraps synchronous functions that may throw:

```typescript
const ParseError = error({ name: "ParseError" });

const parseResult = Result.attempt(
  () => JSON.parse(input),
  (cause) => ParseError({ input, cause })
);
// Result<unknown, ParseError>

// Without catch transform - uses native Error
const parseResult2 = Result.attempt(() => JSON.parse(input));
// Result<unknown, Error>
```

`Result.attemptAsync()` wraps async functions:

```typescript
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

### Falsy Values

Ok results can contain falsy values like `false`, `0`, `""`, or `null`. Use `isOk()` to check:

```typescript
const falsyOk = ok(false);
const zeroOk = ok(0);
const emptyOk = ok("");

if (falsyOk.isOk()) {
  // falsyOk.value is false, but this branch executes
}
```

### Type Guards

```typescript
import { isOk, isErr } from '@deessejs/fp';

if (isOk(result)) {
  result.value.id  // Fully narrowed
}

if (isErr(result)) {
  result.error  // Error type
}
```

### Mapping Results

```typescript
// map - Transform Ok Value
const result = ok({ id: "123", name: "Alice" });
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
const typed = result.mapErr(err => PermissionError({ resource: err.id }));
// Result<never, PermissionError>

// pipeable style
const typed = Result.mapErr(err => PermissionError({ resource: err.id }))(result);
```

### flatMap / andThen - Chain Operations

```typescript
const result = ok({ userId: "123" });
const userResult = result.flatMap(({ userId }) => fetchUser(userId));
// Result<User, FetchError>

// pipeable style
const userResult = Result.flatMap(({ userId }) => fetchUser(userId))(result);
```

### Generator Composition (Result.gen)

`Result.gen` enables clean sequential composition with automatic error union inference:

```typescript
const NotFoundError = error({ name: "NotFoundError", schema: z.object({ id: z.string() }) });
const ValidationError = error({ name: "ValidationError", schema: z.object({ field: z.string() }) });

const result = await Result.gen(async function* () {
  const user = yield* ok({ id: "123", name: "Alice", active: true });

  if (!user.active) {
    yield* ValidationError({ field: "user.active" });
  }

  const profile = yield* fetchProfile(user.id);

  return { user, profile };
});
// Result<{ user: User, profile: Profile }, NotFoundError | ValidationError>
```

### Why Result.gen?

Generator composition enables linear, readable error handling:

```typescript
// Sequential flatMap
const result = ok(userId)
  .flatMap(fetchUser)
  .flatMap(user => user.active
    ? ok(user)
    : err(ValidationError({ field: "user.active" })))
  .flatMap(fetchProfile)
  .map(({ user, profile }) => ({ user, profile }));

// Generator flow - same behavior, clearer structure
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
// TypeScript infers the error union automatically
```

### AsyncResult Integration

`AsyncResult<T, E>` is the async variant of Result, representing a `Promise<Result<T, E>>`. It handles asynchronous operations and integrates with `Result.gen` via `Result.await`:

```typescript
// AsyncResult<T, E> = Promise<Result<T, E>>
const asyncResult: AsyncResult<User, NetworkError> = fetchUser(id);
```

**Type Definition:**

```typescript
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
```

**Usage with Result.gen:**

```typescript
const result = await Result.gen(async function* () {
  const user = yield* Result.await(fetchUser(id));
  const posts = yield* Result.await(fetchPosts(user.id));
  return { user, posts };
});
```

**Supported Operations:**

AsyncResult supports the same operations as Result:

```typescript
// Create AsyncResult from a Promise
const asyncResult = Result.attemptAsync(fetchUser(id));

const mapped = asyncResult.map(user => user.name);
const chained = asyncResult.flatMap(user => Result.attemptAsync(fetchPosts(user.id)));

await asyncResult.tap(user => console.log(user));
await asyncResult.tapErr(err => console.error(err));
```

### Pipeable Functions (dual)

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
```

Available pipeable functions:

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
| `Result.unwrap()` | Extract or throw |
| `Result.unwrapOr(default)` | Extract or default |
| `Result.unwrapOrCompute(fn)` | Extract or compute default |
| `Result.orElse(fn)` | Transform error to result |
| `Result.match({ ok, err })` | Pattern match |
| `Result.swap()` | Swap Ok/Err |
| `Result.isOk()` | Type guard |
| `Result.isErr()` | Type guard |
| `Result.toNullable()` | Convert to null |
| `Result.toUndefined()` | Convert to undefined |
| `Result.toMaybe()` | Convert to Maybe |
| `Result.all(...results)` | Combine all |
| `Result.race(...results)` | First to resolve |
| `Result.traverse(items, fn)` | Map over array |
| `Result.allSettled(...results)` | All complete with status |
| `Result.fromPromise(promise, catchFn)` | Convert Promise to AsyncResult |
| `Result.attempt(fn, catch?)` | Wrap sync throwing function |
| `Result.attemptAsync(fn, catch?)` | Wrap async throwing function |
| `Result.await(asyncResult)` | Yield async in gen |

### Observation

```typescript
// tap - Side Effect on Ok
result.tap(user => console.log("User:", user.name));

// tapErr - Side Effect on Err
result.tapErr(e => console.error("Error:", e._tag, e.id));

// tapBoth - Symmetric Observation
result.tapBoth({
  ok: (value) => console.log("Success:", value),
  err: (error) => console.log("Failed:", error._tag),
});
```

### Pattern Matching

```typescript
import { match } from '@deessejs/fp';

const message = match(result, {
  ok: (value) => `Got: ${value.name}`,
  err: (error) => `Error: ${error._tag}`,
});
```

### Extraction

```typescript
// getOrElse - Fallback Value
const user = result.getOrElse({ id: "default", name: "Anonymous" });

// getOrCompute - Lazy Fallback
const user = result.getOrCompute(() => loadDefaultUser());

// unwrap - Extract Or Throw
const user = result.unwrap();
// Throws the error if Err, returns the value if Ok

// unwrapOr - Extract Or Default
const user = result.unwrapOr({ id: "default", name: "Anonymous" });
// Returns the value if Ok, default if Err

// unwrapOrCompute - Extract Or Lazy Default
const user = result.unwrapOrCompute(() => loadDefaultUser());
// Returns the value if Ok, lazy default if Err

// orElse - Transform Error to Result
const recovered = result.orElse(err => {
  if (err._tag === 'NotFoundError') {
    return ok(defaultUser);  // Recover with a value
  }
  return err(OtherError({ cause: err }));  // Propagate as different error
});

// pipeable style
const recovered = Result.orElse(err => err._tag === 'NotFoundError' ? ok(defaultUser) : err(err))(result);
```

### Extraction Signatures

```typescript
// getOrElse - Synchronous fallback
function getOrElse<T, E>(defaultValue: T): (result: Result<T, E>) => T;
function getOrElse<T, E>(this: Result<T, E>, defaultValue: T): T;

// getOrCompute - Lazy synchronous fallback
function getOrCompute<T, E>(fn: () => T): (result: Result<T, E>) => T;
function getOrCompute<T, E>(this: Result<T, E>, fn: () => T): T;

// unwrap - Extract or throw
function unwrap<T, E>(this: Result<T, E>): T;
// Throws if Err

// unwrapOr - Extract or provide default
function unwrapOr<T, E>(this: Result<T, E>, defaultValue: T): T;

// unwrapOrCompute - Extract or compute default
function unwrapOrCompute<T, E>(this: Result<T, E>, fn: () => T): T;

// orElse - Transform error to result (recover from error)
function orElse<T, E, E2>(
  fn: (error: E) => Result<T, E2>
): (result: Result<T, E>) => Result<T, E2>;
```

### Conversion

```typescript
// toNullable - Convert to nullable
const value = result.toNullable();
// T | null (null if Err)

const nullable = ok(42).toNullable();  // 42
const nullableErr = err(NotFoundError({})).toNullable();  // null

// toUndefined - Convert to undefined
const value = result.toUndefined();
// T | undefined (undefined if Err)

const defined = ok(42).toUndefined();  // 42
const definedErr = err(NotFoundError({})).toUndefined();  // undefined

// toMaybe - Convert to Maybe (Ok → Some, Err → None)
const maybe = result.toMaybe();
// Maybe<T>

const someResult = ok(42).toMaybe();  // Some(42)
const noneResult = err(NotFoundError({})).toMaybe();  // None
```

### Conversion Signatures

```typescript
// toNullable
function toNullable<T, E>(this: Result<T, E>): T | null;

// toUndefined
function toUndefined<T, E>(this: Result<T, E>): T | undefined;

// toMaybe
function toMaybe<T, E>(this: Result<T, E>): Maybe<T>;
```

### Combination

```typescript
// all - Combine Multiple Results (fail-fast)
// Collects all Ok values, fails on first Err
const results = await Promise.all([
  fetchUser("1"),
  fetchUser("2"),
  fetchUser("3"),
]);
const users = Result.all(results);
// Result<User[], E1 | E2 | E3> - error union of all possible errors

// all with mixed types
const [userResult, postResult] = await Promise.all([
  fetchUser("1"),
  fetchPost("123"),
]);
const combined = Result.all([userResult, postResult]);
// Result<[User, Post], UserError | PostError>

// race - First To Resolve (whichever completes first wins)
const winner = Result.race(
  fetchFromPrimary(),
  fetchFromSecondary()
);
// AsyncResult<T, E> - returns first to resolve, whether Ok or Err

// race with multiple
const first = Result.race(
  fetchCache(),
  fetchDatabase(),
  fetchRemote()
);
// Returns the first resolved Result, ignores others

// traverse - Map Over Array (fail-fast)
const ids = ["1", "2", "3"];
const users = Result.traverse(ids, id => fetchUser(id));
// Result<User[], FetchError> - fails if any fetch fails

// traverse with index
const users = Result.traverse(ids, (id, index) => fetchUserByIndex(index, id));
```

### Collection Signatures

```typescript
// Result.all - Combine array of AsyncResults
function all<T, E extends Error>(
  results: AsyncResult<T, E>[]
): AsyncResult<T[], E>;

// Result.race - First to resolve wins
function race<T, E>(
  ...results: AsyncResult<T, E>[]
): AsyncResult<T, E>;

// Result.traverse - Map array with fail-fast
function traverse<T, E>(
  items: T[],
  fn: (item: T, index: number) => AsyncResult<T, E>
): AsyncResult<T[], E>;

// Result.allSettled - All complete, results include errors
function allSettled<T, E>(
  results: AsyncResult<T, E>[]
): AsyncResult<Outcome<T, E>[], never>;
// Outcome = { ok: true, value: T } | { ok: false, error: E }
```

### Result.allSettled

When you need all results regardless of success/failure:

```typescript
const results = await Result.allSettled([
  fetchUser("1"),
  fetchUser("2"),
  fetchUser("3"),
]);
// Ok<Outcome<User, UserError>[]>
// Each element is either { ok: true, value: User } or { ok: false, error: UserError }

results.value.forEach(outcome => {
  if (outcome.ok) {
    console.log("Success:", outcome.value);
  } else {
    console.error("Failed:", outcome.error);
  }
});
```

### Result.fromPromise

Convert a Promise to AsyncResult:

```typescript
// Basic conversion - rejects become Err
const result = await Result.fromPromise(
  fetch('/api/user'),
  (cause) => NetworkError({ cause })
);
// Result<User, NetworkError>

// With Zod validation
const validated = await Result.fromPromise(
  fetch('/api/user').then(r => r.json()),
  (cause) => NetworkError({ cause })
).map(data => UserSchema.parse(data));
// Result<User, NetworkError | ZodError>

// Reject detection
Result.fromPromise(
  somePromise,
  (reason, rejected) => {
    if (rejected) {
      return ErrorA({ cause: reason });
    }
    return ErrorB({ value: reason });  // For thrown values
  }
);
```

### Result.fromPromise Signature

```typescript
function fromPromise<T, E>(
  promise: Promise<T>,
  catchFn: (reason: unknown, rejected: boolean) => E
): AsyncResult<T, E>;

// rejected = true when promise rejected
// rejected = false when promise throws synchronously
```

## Maybe vs Result

Use `Maybe` when a value may or may not exist (no error context). Use `Result` when an operation may succeed or fail (with error context).

| Scenario | Type | Example |
|----------|------|---------|
| Value optional | `Maybe<T>` | `Maybe<User>` - user may not exist |
| Operation can fail | `Result<T, E>` | `Result<User, NotFoundError>` - fetch may fail |
| Validation error | `Result<T, E>` | `Result<User, ValidationError>` - invalid input |
| Network failure | `Result<T, E>` | `Result<Data, NetworkError>` - connection issue |

## Complete Example

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

## Open Questions

1. **Panic on callback throw** — Should `map`, `flatMap`, `tap` callbacks that throw produce `Err<Panic>` or throw `Panic`? Distinguishing recoverable errors from programmer defects may improve type safety.

2. **Retry combinator** — Should `Result` include built-in retry with backoff, or is this only relevant for `AsyncResult`?

3. **Result serialization** — Should `Result` support `serialize`/`deserialize` for RPC patterns?

## References

- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Unified Error System (sister document)
- [EXPECTED-RESULT-DX.md](../internal/external/better-result/EXPECTED-RESULT-DX.md) — Source of truth for Result DX
- [Rust RFC Process](https://github.com/rust-lang/rfcs)
- [Node.js Enhancement Proposals](https://github.com/nodejs/node-eps)
