# AsyncResult

The AsyncResult type is the asynchronous version of Result. It's designed for chaining async operations with proper error handling - perfect for API calls, database queries, and any I/O operations.

## Why AsyncResult?

Async/await is great, but error handling with try/catch is error-prone:

```typescript
// Problem: Easy to forget to catch errors
const user = await fetchUser(id);
// What if fetchUser throws?

// Solution: Errors become part of the type
import { fromPromise, AsyncResult } from '@deessejs/core';
const result = fromPromise(fetchUser(id));
// Type: AsyncResult<User, Error>
```

With AsyncResult, **async errors are explicit in your types**. No more unhandled promise rejections.

---

## Quick Start

```typescript
import { okAsync, errAsync, fromPromise, isOk, isErr } from '@deessejs/core';

// Create a success
const success: AsyncResult<number, string> = okAsync(42);

// Create a failure
const failure: AsyncResult<number, string> = errAsync('Something went wrong');

// Wrap a promise
const result = fromPromise(fetch('https://api.example.com'));
```

---

## API Reference

### Creating AsyncResults

#### `okAsync(value)` - Create an async success

```typescript
import { okAsync } from '@deessejs/core';

const result = await okAsync(42);
// { ok: true, value: 42 }
```

#### `errAsync(error)` - Create an async failure

```typescript
import { errAsync } from '@deessejs/core';

const result = await errAsync('Not found');
// { ok: false, error: 'Not found' }
```

#### `fromPromise(promise)` - Wrap a Promise

```typescript
import { fromPromise } from '@deessejs/core';

// Success case
const success = await fromPromise(Promise.resolve(42));
// { ok: true, value: 42 }

// Failure case - catches rejections
const failure = await fromPromise(Promise.reject(new Error('oops')));
// { ok: false, error: Error: 'oops' }
```

Key behaviors:
- Returns `AsyncOk<T>` if the promise resolves
- Returns `AsyncErr<Error>` if the promise rejects
- Non-Error rejections are wrapped in an Error object:

```typescript
// Strings are wrapped in Error
const r1 = await fromPromise(Promise.reject('oops'));
// AsyncErr(Error: 'oops')

// Objects are wrapped in Error
const r2 = await fromPromise(Promise.reject({ code: 500 }));
// AsyncErr(Error: '[object Object]')
```

---

### Type Guards

#### `isOk(result)` - Check for success

```typescript
import { okAsync, isOk } from '@deessejs/core';

const result = await okAsync(42);

if (isOk(result)) {
  console.log(result.value); // TypeScript knows it's AsyncOk
}
```

#### `isErr(result)` - Check for failure

```typescript
import { errAsync, isErr } from '@deessejs/core';

const result = await errAsync('error');

if (isErr(result)) {
  console.log(result.error); // TypeScript knows it's AsyncErr
}
```

---

### Transformation Methods

#### `map(result, fn)` - Transform the value (sync)

Transforms the success value with a synchronous function, passes errors through:

```typescript
import { okAsync, map } from '@deessejs/core';

const result = await map(okAsync(2), x => x * 2);
// AsyncOk(4)

const failed = await map(errAsync('error'), x => x * 2);
// AsyncErr('error')
```

#### `mapAsync(result, fn)` - Transform the value (async)

Transforms the success value with an async function:

```typescript
import { okAsync, mapAsync } from '@deessejs/core';

const result = await mapAsync(okAsync(2), async x => {
  const data = await fetchData(x);
  return data.value * 2;
});
```

> **When to use map vs mapAsync:** Use `map` for sync transformations, `mapAsync` when you need to await inside the transformation.

#### `flatMap(result, fn)` - Chain operations (sync)

Chains operations with a synchronous function:

```typescript
import { okAsync, flatMap, AsyncResult } from '@deessejs/core';

const fetchUser = (id: number): AsyncResult<User, string> => {
  if (id > 0) return okAsync({ id, name: 'John' });
  return errAsync('Invalid id');
};

const getEmail = (user: User): AsyncResult<string, string> =>
  okAsync(user.name.toLowerCase() + '@example.com');

// Chain them
const result = await flatMap(okAsync(1), fetchUser);
// AsyncOk({ id: 1, name: 'John' })

const result2 = await flatMap(okAsync(-1), fetchUser);
// AsyncErr('Invalid id')
```

#### `flatMapAsync(result, fn)` - Chain operations (async)

Chains operations with an async function:

```typescript
import { okAsync, flatMapAsync, fromPromise, AsyncResult } from '@deessejs/core';

interface User {
  id: number;
  name: string;
}

const fetchUser = (id: number): AsyncResult<User, Error> =>
  fromPromise(fetch(`/api/users/${id}`).then(r => r.json()));

const fetchPosts = (userId: number): AsyncResult<Post[], Error> =>
  fromPromise(fetch(`/api/users/${userId}/posts`).then(r => r.json()));

// Chain async operations
const result = await flatMapAsync(okAsync(1), async user =>
  flatMapAsync(await fetchPosts(user.id), posts =>
    okAsync({ user, posts })
  )
);
```

---

### Extraction Methods

#### `getOrElse(result, defaultValue)` - Get value or fallback

Returns the success value, or a default if failure:

```typescript
import { okAsync, errAsync, getOrElse } from '@deessejs/core';

const success = await getOrElse(okAsync(42), 0);  // 42
const failure = await getOrElse(errAsync('oops'), 0); // 0
```

#### `getOrCompute(result, fn)` - Get value or compute fallback

Returns the success value, or computes one if failure:

```typescript
import { okAsync, errAsync, getOrCompute } from '@deessejs/core';

const success = await getOrCompute(okAsync(42), async () => await fetchFallback());
// 42 (fetchFallback never called)

const failure = await getOrCompute(errAsync('oops'), async () => 0);
// 0 (computed on demand)
```

---

### Side Effects

#### `tap(result, fn)` - Side effect on success

Executes a function on the value without changing it:

```typescript
import { okAsync, errAsync, tap } from '@deessejs/core';

await tap(okAsync(42), value => console.log('Got:', value));
// Logs: "Got: 42"
// Returns: AsyncOk(42)

await tap(errAsync('error'), value => console.log('Got:', value));
// Nothing logged
// Returns: AsyncErr('error')
```

---

### Pattern Matching

#### `match(result, okFn, errFn)` - Handle both cases

```typescript
import { okAsync, match } from '@deessejs/core';

const result = await okAsync(42);

const message = await match(
  result,
  value => `Success: ${value}`,
  error => `Failed: ${error}`
);
// "Success: 42"
```

---

### Parallel Operations

#### `all(...results)` - Run multiple async results in parallel

```typescript
import { okAsync, all } from '@deessejs/core';

const [user, posts, comments] = await all(
  fromPromise(fetchUser(1)),
  fromPromise(fetchPosts(1)),
  fromPromise(fetchComments(1))
);
// All three run in parallel
// Throws if any fails
```

#### `traverse(items, fn)` - Map over items in parallel

```typescript
import { fromPromise, traverse } from '@deessejs/core';

const ids = [1, 2, 3];

const users = await traverse(ids, id =>
  fromPromise(fetchUser(id).then(r => r.json()))
);
// Fetches all users in parallel
// Throws if any fails
```

#### `race(...results)` - Wait for first to resolve

```typescript
import { okAsync, race } from '@deessejs/core';

const fast = okAsync(1);
const slow = okAsync(2).then(async () => {
  await new Promise(r => setTimeout(r, 100));
  return { ok: true, value: 2 };
});

const result = await race(fast, slow);
// Resolves to 1 (the fastest)
```

---

### Conversions

#### `toNullable(result)` - Convert to nullable

```typescript
import { okAsync, errAsync, toNullable } from '@deessejs/core';

await toNullable(okAsync(42)); // 42
await toNullable(errAsync('x')); // null
```

#### `toUndefined(result)` - Convert to undefined

```typescript
import { okAsync, errAsync, toUndefined } from '@deessejs/core';

await toUndefined(okAsync(42)); // 42
await toUndefined(errAsync('x')); // undefined
```

---

## Real-World Examples

### Chained API Calls

```typescript
import { fromPromise, flatMapAsync, getOrElse, okAsync, AsyncResult } from '@deessejs/core';

interface User {
  id: number;
  name: string;
}

interface Order {
  id: number;
  userId: number;
  total: number;
}

const fetchUser = (id: number): AsyncResult<User, Error> =>
  fromPromise(
    fetch(`/api/users/${id}`).then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
  );

const fetchOrders = (userId: number): AsyncResult<Order[], Error> =>
  fromPromise(
    fetch(`/api/users/${userId}/orders`).then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
  );

// Get user with orders
const getUserOrders = (userId: number): AsyncResult<{ user: User; orders: Order[] }, Error> =>
  flatMapAsync(
    fromPromise(fetchUser(userId)),
    user => flatMapAsync(
      fromPromise(fetchOrders(user.id)),
      orders => okAsync({ user, orders })
    )
  );

// Usage
const result = await getUserOrders(1);
const { user, orders } = getOrElse(result, { user: { id: 0, name: 'Guest' }, orders: [] });
```

### Parallel Data Fetching

```typescript
import { fromPromise, all, traverse, AsyncResult } from '@deessejs/core';

const fetchDashboard = async (userId: number) => {
  // Fetch all data in parallel
  const [user, stats, notifications] = await all(
    fromPromise(fetch(`/api/users/${userId}`).then(r => r.json())),
    fromPromise(fetch(`/api/users/${userId}/stats`).then(r => r.json())),
    fromPromise(fetch(`/api/users/${userId}/notifications`).then(r => r.json()))
  );

  return { user, stats, notifications };
};

// Process multiple items
const processItems = async (ids: number[]) => {
  const results = await traverse(ids, async id => {
    const data = await fetchItem(id);
    return transformItem(data);
  });

  return results;
};
```

### Error Recovery

```typescript
import { fromPromise, okAsync, errAsync, getOrElse, AsyncResult } from '@deessejs/core';

const fetchWithFallback = async (
  primaryUrl: string,
  fallbackUrl: string
): AsyncResult<Data, Error> => {
  // Try primary
  const primary = await fromPromise(fetch(primaryUrl));

  if (primary.ok) {
    return okAsync(await primary.value.json());
  }

  // Try fallback on primary failure
  const fallback = await fromPromise(fetch(fallbackUrl));

  if (fallback.ok) {
    return okAsync(await fallback.value.json());
  }

  // Both failed
  return errAsync(new Error('Both primary and fallback failed'));
};
```

---

## AsyncResult vs Try vs Result

| Type | Use Case | Example |
|------|----------|---------|
| **Result** | Sync operations with explicit errors | Validation, simple computations |
| **Try** | Sync operations that might throw | JSON.parse, file read |
| **AsyncResult** | Async operations with error handling | API calls, DB queries |

> **Key insight:** AsyncResult is essentially Result + Promise. Use it whenever you're working with async operations that can fail.

---

## Best Practices

### 1. Use `fromPromise` for API Calls

```typescript
// Good: Wrap fetch calls
const fetchUser = (id: number): AsyncResult<User, Error> =>
  fromPromise(
    fetch(`/api/users/${id}`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
  );
```

### 2. Prefer `flatMapAsync` for Chained Async Operations

```typescript
// Good: Clear async chain
const result = await flatMapAsync(
  fromPromise(fetchUser(id)),
  user => flatMapAsync(
    fromPromise(fetchPosts(user.id)),
    posts => okAsync({ user, posts })
  )
);
```

### 3. Use `all` for Parallel Operations

```typescript
// Good: Run in parallel
const [user, posts] = await all(
  fromPromise(fetchUser(id)),
  fromPromise(fetchPosts(id))
);
```

---

## Known Limitations & Future Improvements

### 1. Await Nesting Problem

**Current behavior:** Functions accept `AsyncResult` as input, requiring nested `await`:

```typescript
await flatMap(await map(await fromPromise(p), fn1), fn2)
```

**Note:** Future versions may implement a "Thenable" pattern (like neverthrow) that allows chaining without intermediate `await`:

```typescript
// Desired future API
fromPromise(p)
  .map(fn1)
  .flatMap(fn2)
  .match(ok => ..., err => ...);
```

### 2. `all` and `traverse` can throw

**Current behavior:** `all` and `traverse` throw if any operation fails.

**Issue:** This breaks the Result contract - the purpose is to handle errors without exceptions.

**Workaround:** Use sequential processing with `flatMapAsync`:

```typescript
import { okAsync, errAsync, flatMapAsync, AsyncResult } from '@deessejs/core';

const safeAll = async <T, E>(...results: AsyncResult<T, E>[]): AsyncResult<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    const r = await result;
    if (!r.ok) return errAsync(r.error);
    values.push(r.value);
  }
  return okAsync(values);
};
```

> **Note:** Future versions may return `Result<T[], E[]>` instead of throwing.

### 3. `fromPromise` wraps non-Error rejections

**Current behavior:** Non-Error rejections are converted to `Error`.

**Issue:** This destroys structured error metadata from GraphQL or SDK errors.

**Workaround:** Wrap manually:

```typescript
import { okAsync, errAsync } from '@deessejs/core';

const fromPromiseCustom = <T, E>(
  promise: Promise<T>,
  onError: (error: unknown) => E
): AsyncResult<T, E> =>
  promise
    .then(value => ({ ok: true as const, value }))
    .catch(error => ({ ok: false as const, error: onError(error) }));
```

> **Note:** Future versions may accept an `onError` parameter.

### 4. Dual `map` / `mapAsync` API

**Current behavior:** Separate functions for sync and async transformations.

**Note:** Future versions may unify these into a single `map` that detects if the function returns a Promise.

### 5. No `AbortSignal` Support

**Current behavior:** Cannot cancel a long-running AsyncResult chain.

**Workaround:** Use AbortController at the operation level:

```typescript
import { fromPromise, flatMapAsync } from '@deessejs/core';

const controller = new AbortController();

const result = await flatMapAsync(
  fromPromise(fetch(url, { signal: controller.signal })),
  data => ...
);

// To cancel
controller.abort();
```

> **Note:** Built-in AbortSignal support may be added in future versions.

### 6. `race` vs `any` Ambiguity

**Current behavior:** `race` returns the first to complete, whether success or error.

**Issue:** Often you want the first **success** (like `Promise.any`).

**Note:** `Promise.any` is not yet widely supported. For now, implement manually:

```typescript
import { okAsync, errAsync, isOk, AsyncResult } from '@deessejs/core';

const firstSuccess = async <T, E>(...results: AsyncResult<T, E>[]): Promise<T> => {
  for (const result of results) {
    const r = await result;
    if (isOk(r)) return r.value;
  }
  throw new Error('All promises were rejected');
};
```

### 7. Error Type Inference

**Current behavior:** Error types are properly unioned when combining AsyncResults.

```typescript
const r1: AsyncResult<string, 'ERR_A'> = okAsync('a');
const r2: AsyncResult<number, 'ERR_B'> = okAsync(1);

// Combined: AsyncResult<number, 'ERR_A' | 'ERR_B'>
const combined = await all(r1, r2);
```

This is handled correctly by the current implementation.

### 8. Instance Methods for Better DX

**Current behavior:** Must use static functions with `await`.

**Note:** As mentioned in point 1, instance methods would improve developer experience:

```typescript
// Future desired API
const value = await fromPromise(promise)
  .map(transform)
  .flatMap(chain)
  .match(ok, err);
```

---

## Comparison with Alternatives

| Feature | @deessejs/core | fp-ts |
|---------|---------------|-------|
| Bundle size | ~2KB | ~40KB |
| Learning curve | Low | High |
| Async/await support | Yes | Yes |
| Parallel operations | Yes (all, race, traverse) | Yes |
| Dependencies | 0 | Many |

---

## Related

- [Result](./result.md) - For synchronous operations with explicit errors
- [Maybe](./maybe.md) - For optional values
- [Try](./try.md) - For wrapping synchronous functions that might throw
