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
import { AsyncResult, okAsync, errAsync, fromPromise } from "@deessejs/core";

// From a value (immediately resolved)
const result: AsyncResult<number, never> = okAsync(42);

// From an error (immediately rejected)
const error: AsyncResult<never, Error> = errAsync(new Error("failed"));

// From an existing Promise
const data = await fetch("/api/user");
const asyncResult = fromPromise(fetch("/api/user"));
```

### Using with await

The Thenable implementation allows direct await usage:

```typescript
const result = await AsyncResult.fromPromise(fetch("/api/user"));

if (result.ok) {
  console.log(result.value); // Response data
} else {
  console.error(result.error); // Error
}
```

### Chaining Operations

```typescript
const result = await AsyncResult.fromPromise(fetchUsers())
  .map(users => users.filter(u => u.active))
  .map(users => users.map(u => u.name))
  .mapErr(e => new Error(`Failed to get users: ${e.message}`));
```

### Handling Errors

All errors in AsyncResult are structured `Error<T>` objects from the Error system, which means you can use `addNotes()` and `from()` for error enrichment:

```typescript
const result = await AsyncResult.fromPromise(fetchData())
  .mapErr(e => e.addNotes(`Failed to fetch data for user ${id}`));

// Chain causes for debugging
const result2 = await AsyncResult.fromPromise(riskyOperation())
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
import { race, all, allSettled } from "@deessejs/core";

// Race - first to complete wins
const fastest = await race(asyncResult1, asyncResult2, asyncResult3);

// All - fail-fast (returns first error)
const combined = await all(
  AsyncResult.fromPromise(fetchUser()),
  AsyncResult.fromPromise(fetchPosts()),
  AsyncResult.fromPromise(fetchComments())
);

// AllSettled - collect all results (successes and failures)
const { values, errors } = await allSettled(
  AsyncResult.fromPromise(fetchItem1()),
  AsyncResult.fromPromise(fetchItem2())
);
```

### Cancellation with AbortSignal

```typescript
import { withSignal, fromPromise } from "@deessejs/core";

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
| `AsyncResult.ok(value)` | Creates an immediately resolved AsyncOk |
| `AsyncResult.err(error)` | Creates an immediately resolved AsyncErr |
| `AsyncResult.fromPromise(promise)` | Wraps a Promise |
| `AsyncResult.from(promise)` | Wraps a Promise<AsyncResultInner> |
| `AsyncResult.fromValue(value, ms?)` | Resolves after optional delay |
| `AsyncResult.fromError(error, ms?)` | Rejects after optional delay |

### Standalone Factories

| Function | Description |
|----------|-------------|
| `okAsync(value)` | Shorthand for `AsyncResult.ok(value)` |
| `errAsync(error)` | Shorthand for `AsyncResult.err(error)` |
| `fromPromise(promise, onError?)` | Wraps a Promise with optional error transform |
| `fromPromiseWithOptions(promise, options)` | Wraps with FromPromiseOptions |

### Type Guards

| Function | Description |
|----------|-------------|
| `isOk(result)` | Returns true if AsyncOk |
| `isErr(result)` | Returns true if AsyncErr |
| `isAbortError(error)` | Returns true if error is an AbortError |

### Transformations

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
import { AsyncResult, fromPromise, all } from "@deessejs/core";

const fetchUser = (id: string) =>
  fromPromise(fetch(`/api/users/${id}`))
    .mapErr(e => new Error(`Failed to fetch user: ${e.message}`))
    .map(async (response) => {
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      return response.json();
    });

const fetchPosts = (userId: string) =>
  fromPromise(fetch(`/api/users/${userId}/posts`))
    .map(async (response) => {
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
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

## Best Practices

1. **Use `fromPromise`** for wrapping existing Promises - it automatically wraps errors in the Error system
2. **Use `okAsync`/`errAsync`** for creating immediately resolved/rejected results
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
