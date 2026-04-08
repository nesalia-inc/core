# AsyncResult Type

An async version of the Result type - a Thenable wrapper for asynchronous operations with proper error handling. Provides fluent chaining without intermediate await calls.

## Overview

The AsyncResult type extends the Result pattern to work seamlessly with Promises and async/await:

- `AsyncOk<T>` represents success with a value of type `T`
- `AsyncErr<E>` represents failure with an error of type `E`
- Thenable implementation - can be used directly with `await`
- Fluent API for chaining async operations
- Built-in support for AbortSignal cancellation

## When to Use AsyncResult

| Use **AsyncResult** when: | Use **Result** when: |
|--------------------------|---------------------|
| Operations are async (Promise-based) | Operations are synchronous |
| Need cancellation support | No cancellation needed |
| Chaining multiple async operations | Simple sync error handling |
| Working with fetch, DB calls, I/O | In-memory computations |

## Core Types

### AsyncResult\<T, E\>

A Thenable wrapper representing either success or failure:

```typescript
type AsyncResult<T, E = Error> = AsyncResultInstance<T, E> & {
  readonly [Symbol.toStringTag]: "AsyncResult";
};
```

### AsyncOk\<T\>

Represents a successful async result:

```typescript
type AsyncOk<T> = {
  readonly ok: true;
  readonly value: T;
};
```

### AsyncErr\<E\>

Represents a failed async result:

```typescript
type AsyncErr<E> = {
  readonly ok: false;
  readonly error: E;
};
```

### AsyncResultInner\<T, E\>

Union type for the internal state:

```typescript
type AsyncResultInner<T, E> = AsyncOk<T> | AsyncErr<E>;
```

## Usage

### Creating AsyncResults

```typescript
import { ok, err, okAsync, errAsync, fromPromise } from "@deessejs/fp";

// From a value (immediately resolved)
const result = ok(42);
const result2 = okAsync(42);

// From an error (use err with a structured error)
const error = err(new Error("failed")); // Error wrapped in AsyncErr
const error2 = errAsync(new Error("failed")); // Alias for err

// From an existing Promise
const asyncResult = fromPromise(fetch("/api/user"));
```

Note: When wrapping with `err()`, use the Error system for structured errors with enrichment support.

### Using with await

The Thenable implementation allows direct await usage:

```typescript
const result = await fromPromise(fetch("/api/user"));

if (result.ok) {
  console.log(result.value); // Response data
} else {
  console.error(result.error); // Error
}
```

### Chaining Operations

```typescript
import { map, mapErr, fromPromise, err, error } from "@deessejs/fp";

// Define a custom error for HTTP errors
const HttpError = error({
  name: "HttpError",
  message: (args: { status: number }) => `HTTP error: ${args.status}`,
});

const result = await fromPromise(fetchUsers())
  .map(users => users.filter(u => u.active))
  .map(users => users.map(u => u.name))
  .mapErr(e => HttpError({ status: 500 }));
```

Note: Never use `throw` or `raise()` for expected failures. Use `err()` to propagate errors through the rail.

### Handling Errors

All errors in AsyncResult are structured `Error<T>` objects from the Error system, which means you can use `addNotes()` and `from()` for error enrichment:

```typescript
const result = await fromPromise(fetchData())
  .mapErr(e => e.addNotes(`Failed to fetch data for user ${id}`));

// Chain causes for debugging
const result2 = await fromPromise(riskyOperation())
  .mapErr(e => SomeOtherError({ context: "operation" }).from(e));
```

The `fromPromise` wrapper automatically converts:
- Native errors to `PanicError` with the original as `cause`
- Non-Error values to `PanicError` with message preserved
- AbortSignal aborts to structured `AbortError`

```typescript
// Access error properties
result.mapErr(e => {
  console.log(e.name);      // "PanicError" or custom
  console.log(e.message);  // error message
  console.log(e.cause);   // Maybe<Error> - original error if any
  e.addNotes("Additional context");
});
```

### Combining Multiple AsyncResults

```typescript
import { race, all, allSettled } from "@deessejs/fp";

// Race - first to complete wins
const fastest = await race(asyncResult1, asyncResult2, asyncResult3);

// All - fail-fast (returns first error)
const combined = await all(
  fromPromise(fetchUser()),
  fromPromise(fetchPosts()),
  fromPromise(fetchComments())
);

// AllSettled - collect all results (successes and failures)
const { values, errors } = await allSettled(
  fromPromise(fetchItem1()),
  fromPromise(fetchItem2())
);
```

### Cancellation with AbortSignal

```typescript
import { withSignal, fromPromise } from "@deessejs/fp";

const controller = new AbortController();

const result = await withSignal(
  fromPromise(fetch("/api/data", { signal: controller.signal })),
  controller.signal
);

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);
```

## API Reference

### Factory Functions

| Function | Description |
|----------|-------------|
| `ok(value)` | Creates an immediately resolved AsyncOk |
| `err(error)` | Creates an immediately resolved AsyncErr |
| `okAsync(value)` | Alias for `ok()` |
| `errAsync(error)` | Alias for `err()` |
| `fromPromise(promise)` | Wraps a Promise |
| `from(promise)` | Wraps a Promise<AsyncResultInner> |
| `fromValue(value, ms?)` | Resolves after optional delay |
| `fromError(error, ms?)` | Rejects after optional delay |
| `fromPromiseWithOptions(promise, options)` | Wraps with FromPromiseOptions |

### Type Guards

| Function | Description |
|----------|-------------|
| `isOk(result)` | Returns true if AsyncOk |
| `isErr(result)` | Returns true if AsyncErr |
| `isAbortError(error)` | Returns true if error is an AbortError |

### Transformations (standalone functions)

| Function | Description |
|----------|-------------|
| `map(result, fn)` | Transform value if AsyncOk (sync or async fn) |
| `flatMap(result, fn)` | Chain fallible async operations |
| `mapErr(result, fn)` | Transform error if AsyncErr |
| `mapAsync(result, fn)` | (Deprecated) Use `map` with async function |
| `flatMapAsync(result, fn)` | (Deprecated) Use `flatMap` |

### Side Effects

| Function | Description |
|----------|-------------|
| `tap(result, fn)` | Execute side effect if AsyncOk |
| `tapErr(result, fn)` | Execute side effect if AsyncErr |

### Extraction

| Function | Description |
|----------|-------------|
| `getOrElse(result, default)` | Get value or default |
| `getOrCompute(result, fn)` | Get value or compute default |
| `unwrap(result)` | Get value, throw if error |
| `unwrapOr(result, default)` | Get value or default |
| `toNullable(result)` | Convert to `T | null` |
| `toUndefined(result)` | Convert to `T | undefined` |

### Pattern Matching

| Function | Description |
|----------|-------------|
| `match(result, okFn, errFn)` | Execute appropriate handler |

### Combinators

| Function | Description |
|----------|-------------|
| `race(...results)` | Resolve with first to complete |
| `all(...results)` | Combine all (fail-fast) |
| `allSettled(...results)` | Combine all (collect both values and errors) |
| `traverse(items, fn)` | Map over items and combine |
| `withSignal(result, signal)` | Add AbortSignal cancellation |

## Migration from Raw Promises

### Before

```typescript
async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

// Usage with nested handling
async function getUserProfile(id: string) {
  try {
    const user = await fetchUser(id);
    try {
      const posts = await fetchPosts(user.id);
      return { user, posts };
    } catch (postsError) {
      return { user, posts: [] };
    }
  } catch (error) {
    return null;
  }
}
```

### After

```typescript
import { fromPromise, map, mapErr, all, err, error } from "@deessejs/fp";

// Define custom errors for HTTP operations
const HttpError = error({
  name: "HttpError",
  message: (args: { status: number }) => `HTTP error: ${args.status}`,
});

const fetchUser = (id: string) =>
  fromPromise(fetch(`/api/users/${id}`))
    .mapErr(e => e.addNotes(`Failed to fetch user ${id}`))
    .map(async (response) => {
      if (!response.ok) return err(HttpError({ status: response.status }));
      return response.json();
    });

const fetchPosts = (userId: string) =>
  fromPromise(fetch(`/api/users/${userId}/posts`))
    .map(async (response) => {
      if (!response.ok) return err(HttpError({ status: response.status }));
      return response.json();
    });

// Usage - clean chaining
const getUserProfile = async (id: string) => {
  const [userResult, postsResult] = await all(fetchUser(id), fetchPosts(id));

  return userResult.match(
    (user) => ({
      user,
      posts: postsResult.match(
        (posts) => posts,
        () => []
      ),
    }),
    () => null
  );
};
```

### Never Break the Rail

In railway-oriented programming, errors should travel through the Result/AsyncResult without breaking the flow. Never use `throw` or `raise()` for expected failures:

```typescript
// Bad - breaks the rail
if (!response.ok) throw HttpError({ status: response.status });

// Good - error travels through the rail
if (!response.ok) return err(HttpError({ status: response.status }));
```

The only exception is for unrecoverable programmer errors where you want to halt execution.

## Best Practices

1. **Use `fromPromise`** for wrapping existing Promises - it automatically wraps errors in the Error system
2. **Use `ok`/`err`** or their aliases `okAsync`/`errAsync`** for creating immediately resolved/rejected results
3. **Chain transformations** instead of nested await/catch
4. **Use `race`** when you need the first result and don't care which completes first
5. **Use `allSettled`** when you need all results regardless of success/failure
6. **Handle errors with `mapErr`** to add context before they propagate
7. **Use `withSignal`** for cancellable operations
8. **Use error enrichment** with `addNotes()` and `from()` to build error chains for debugging

## Error System Integration

AsyncResult is fully integrated with the Error system. All errors are structured `Error<T>` objects that support:

- **`addNotes(...notes)`** - Add contextual information to errors
- **`from(cause)`** - Chain errors to track provenance
- **`cause`** - Access the original error via `Maybe<Error>`

This allows building rich error chains for debugging:

```typescript
const result = await fetchUser(id)
  .mapErr(e => e.addNotes(`User ${id} not found`))
  .mapErr(e => AuthorizationError({ userId: id }).from(e));

// At the end, you can trace:
// AuthorizationError
//   cause: PanicError("User 123 not found")
//   notes: ["User 123 not found"]
```

## Comparison with Result

AsyncResult follows the same functional pattern as Result:

| Result | AsyncResult |
|--------|-------------|
| `ok(value)` | `ok(value)` or `okAsync(value)` |
| `err(error)` | `err(error)` or `errAsync(error)` |
| `from(result)` | `from(promise)` |
| `map(result, fn)` | `map(asyncResult, fn)` |
| `flatMap(result, fn)` | `flatMap(asyncResult, fn)` |
| `result.map(fn)` (instance) | `result.then(fn)` (Thenable) |

The key difference is that AsyncResult operations are always async (Promise-based), while Result operations are synchronous.