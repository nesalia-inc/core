---
dep: DEP-0006
title: "Retry: Resilient Operations with Backoff and Jitter"
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

A retry system that provides resilient operations by automatically retrying failed operations with configurable backoff strategies and jitter. Integrates with `Result` and `Try` patterns to provide type-safe, composable retry logic for both synchronous and asynchronous operations.

## Motivation

Network requests, database operations, and external API calls can fail transiently. The retry system provides:

1. **Automatic retry** — Failed operations are automatically retried without manual loops
2. **Backoff strategies** — Prevents overwhelming failing services with exponential delay
3. **Jitter** — Randomization prevents thundering herd problems
4. **Type safety** — Full TypeScript inference with Result integration
5. **Composable** — Works with existing pipe/flow composition

## Detailed Design

### Core Concepts

#### Retry Policy

A retry policy defines how many times to retry and with what delay strategy:

```typescript
interface RetryPolicy {
  maxAttempts: number;      // Maximum number of attempts (including first)
  initialDelay: number;      // Initial delay in milliseconds
  maxDelay: number;         // Maximum delay cap in milliseconds
  maxTotalTime?: number;    // Maximum total time in milliseconds (deadline)
  backoffMultiplier: number; // Multiplier for exponential backoff
  jitter: JitterConfig;     // Jitter configuration
  onRetry?: RetryHooks<T, E>; // Observability hooks
}

interface JitterConfig {
  enabled: boolean;
  factor: number;  // 0-1, percentage of delay to randomize
}

interface RetryHooks<T, E> {
  onRetry?: (attempt: number, error: E, delay: number) => void;
  onSuccess?: (result: Ok<T>, attemptCount: number) => void;
  onFailure?: (error: E, attemptCount: number, allErrors: readonly E[]) => void;
}
```

#### Default Policy

```typescript
const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2,
  jitter: { enabled: true, factor: 0.3 }
};
```

### Creating Retry Policies

```typescript
import { retryPolicy } from '@deessejs/fp';

// Default policy
const defaultPolicy = retryPolicy();

// Custom policy
const aggressivePolicy = retryPolicy({
  maxAttempts: 5,
  initialDelay: 50,
  maxDelay: 2000,
  backoffMultiplier: 1.5,
  jitter: { enabled: true, factor: 0.2 }
});

// No jitter policy
const stablePolicy = retryPolicy({
  maxAttempts: 3,
  initialDelay: 500,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: { enabled: false }
});
```

### Backoff Calculation

Delays are calculated as:

```
delay = min(initialDelay * (backoffMultiplier ^ (attempt - 1)), maxDelay)
```

With jitter applied:

```
actualDelay = delay * (1 - jitter.factor + (random() * jitter.factor * 2))
```

Example with `initialDelay: 100, multiplier: 2, maxDelay: 5000`:

| Attempt | Base Delay | With 30% Jitter (range) |
|---------|------------|------------------------|
| 1 | 100ms | 70-130ms |
| 2 | 200ms | 140-260ms |
| 3 | 400ms | 280-520ms |
| 4 | 800ms | 560-1040ms |
| 5 | 1600ms | 1120-2080ms |

Note: Attempt numbers start at 1 (first attempt = no delay, second attempt = first retry).

### Retrying Operations

#### Result.retry(policy, fn)

Retries a synchronous operation that returns a Result:

```typescript
import { Result, retry, retryPolicy } from '@deessejs/fp';

const flakyOperation = (): Result<User, NetworkError> => {
  return fetchFromUnreliableServer();
};

const policy = retryPolicy({ maxAttempts: 3 });
const result = Result.retry(policy, flakyOperation);
```

#### Result.retryAsync(policy, fn)

Retries an async operation:

```typescript
import { Result, retryAsync, retryPolicy } from '@deessejs/fp';

const flakyAsyncOperation = async (): Promise<Result<User, NetworkError>> => {
  return fetchUserFromAPI();
};

const result = await Result.retryAsync(policy, flakyAsyncOperation);
```

#### retry with pipe

```typescript
import { pipe, Result, retry, retryPolicy } from '@deessejs/fp';

const result = await pipe(
  userId,
  fetchUserById,
  Result.retry(retryPolicy({ maxAttempts: 5 }))
);
```

### When to Retry

By default, retry only on `Err` results. The `shouldRetry` predicate controls this:

```typescript
// Retry on all errors (default)
const result = Result.retry(policy, flakyOperation);

// Retry only on specific errors
const networkOnlyPolicy = retryPolicy({
  maxAttempts: 3,
  shouldRetry: (error) => error._tag === 'NetworkError'
});

const result = Result.retry(networkOnlyPolicy, flakyOperation);

// Retry on network errors or timeout errors
const extendedPolicy = retryPolicy({
  maxAttempts: 5,
  shouldRetry: (error) =>
    error._tag === 'NetworkError' || error._tag === 'TimeoutError'
});
```

### Filtering Retriable Errors

For operations that return mixed error types, filter to only retry transient failures:

```typescript
const policy = retryPolicy({
  maxAttempts: 3,
  shouldRetry: (error) => {
    // Only retry network-related errors
    if (error._tag === 'NetworkError') return true;
    // Retry timeout errors
    if (error._tag === 'TimeoutError') return true;
    // Do not retry validation or permission errors
    return false;
  }
});

const result = await Result.retryAsync(policy, () =>
  complexOperation()
);
```

### Combining with Try

Use `Result.attempt` inside retry for operations that might throw:

```typescript
import { Result, retryAsync, retryPolicy } from '@deessejs/fp';

const safeFetchUser = async (id: string) =>
  Result.attemptAsync(
    () => fetch(`/api/users/${id}`).then(r => r.json()),
    (cause) => NetworkError({ url: `/api/users/${id}`, cause })
  );

const result = await Result.retryAsync(
  retryPolicy({ maxAttempts: 3 }),
  () => safeFetchUser('user-123')
);
```

### Circuit Breaker Pattern

For operations that are consistently failing, combine with circuit breaker logic:

```typescript
// Implementation delegates to a separate DEP for circuit breaker
// This DEP focuses on retry semantics

// See DEP-XXXX-CIRCUIT-BREAKER for circuit breaker integration
```

## Type Signatures

```typescript
// RetryPolicy
interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  maxTotalTime?: number;
  backoffMultiplier: number;
  jitter: JitterConfig;
  shouldRetry?: (error: E) => boolean;
  onRetry?: RetryHooks<T, E>;
}

// retry for sync operations
function retry<T, E>(
  policy: RetryPolicy,
  fn: () => Result<T, E>
): Result<T, E>;

// retry for async operations
function retryAsync<T, E>(
  policy: RetryPolicy,
  fn: () => Promise<Result<T, E>>,
  options?: { signal?: AbortSignal }
): Promise<Result<T, E>>;

// Policy builder
function retryPolicy(config?: Partial<RetryPolicy>): RetryPolicy;
```

### Cancellation

Async retry operations accept an `AbortSignal` to enable cancellation:

```typescript
const controller = new AbortController();

const result = await Result.retryAsync(
  retryPolicy({ maxAttempts: 5 }),
  () => fetchUserData('user-123'),
  { signal: controller.signal }
);

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10000);
```

When aborted, the operation throws an `AbortError` and the retry loop terminates immediately.

## Retry vs Result States

| Scenario | Behavior |
|----------|----------|
| First attempt succeeds | Returns `Ok<T>` immediately |
| First attempt fails, retry succeeds | Returns `Ok<T>` with total attempt count logged |
| All attempts fail | Returns `Err<E>` with last error |
| Non-retriable error | Returns `Err<E>` immediately |
| maxAttempts exceeded | Returns `Err<E>` with final error |
| maxTotalTime exceeded | Returns `Err<E>` with `TimeoutError` |
| Operation throws | Caught and returned as `Err<E>` via Try |
| Aborted | Throws `AbortError` |

## Idempotency Requirement

Retried operations **must be idempotent**. A retry is idempotent if executing it multiple times produces the same result as executing it once.

**Safe to retry:**
- `GET` requests (read-only operations)
- DELETE requests with idempotent key
- Operations with client-generated IDs
- Stateless transformations

**Not safe to retry:**
- `POST` requests that create resources
- Operations with server-generated IDs
- Payment transactions
- Email/notification sending

If an operation is not idempotent, use `shouldRetry` to prevent retry:

```typescript
const safePolicy = retryPolicy({
  shouldRetry: (error) => error._tag === 'NetworkError' || error._tag === 'TimeoutError'
});
```

## Complete Example

```typescript
import { Result, pipe, retry, retryPolicy, error } from '@deessejs/fp';

const NetworkError = error({
  name: "NetworkError",
  schema: z.object({ url: z.string(), cause: z.unknown() })
});

const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string(), message: z.string() })
});

// Operation that might fail with network error
const fetchUserData = (userId: string): Result<User, NetworkError | ValidationError> => {
  const response = httpGet(`/api/users/${userId}`);

  if (response.status === 404) {
    return err(ValidationError({ field: 'id', message: 'User not found' }));
  }

  if (!response.ok) {
    return err(NetworkError({ url: `/api/users/${userId}` }));
  }

  return ok(response.data);
};

// Retry policy that only retries network errors with observability
const networkRetryPolicy = retryPolicy({
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 2000,
  maxTotalTime: 30000,
  backoffMultiplier: 2,
  jitter: { enabled: true, factor: 0.2 },
  shouldRetry: (error) => error._tag === 'NetworkError',
  onRetry: {
    onRetry: (attempt, err, delay) => {
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms: ${err._tag}`);
    }
  }
});

// Using retry with cancellation
const controller = new AbortController();
const result = await Result.retryAsync(
  networkRetryPolicy,
  () => fetchUserData('user-123'),
  { signal: controller.signal }
);

// Using with pipe
pipe(
  'user-123',
  fetchUserData,
  Result.retry(networkRetryPolicy),
  Result.map(user => user.email),
  Result.getOrElse('anonymous@example.com')
);
```

## Relationship to Other DEPs

The retry system works with all composition patterns:

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — Retry wraps Result-returning functions
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — `shouldRetry` receives TaggedError for filtering
- [DEP-0004-TRY](./DEP-0004-TRY.md) — Combine with `Result.attempt` for throwing functions
- [DEP-0005-COMPOSITION](./DEP-0005-COMPOSITION.md) — Works with pipe/flow composition

## Benefits

| Benefit | Description |
|---------|-------------|
| **Resilience** | Automatic retry handles transient failures |
| **Control** | Configurable attempts, delays, and backoff |
| **Predictability** | Jitter prevents thundering herd |
| **Type safety** | Full TypeScript inference |
| **Composability** | Works with pipe, flow, and Result patterns |

## Observability Hooks

Retry operations emit hooks for observability:

```typescript
const policy = retryPolicy({
  maxAttempts: 3,
  onRetry: {
    onRetry: (attempt, error, delay) => {
      logger.warn(`Retry attempt ${attempt} after ${delay}ms`, { error: error._tag });
    },
    onSuccess: (result, attemptCount) => {
      metrics.increment('retry.success', { attemptCount });
    },
    onFailure: (error, attemptCount, allErrors) => {
      metrics.increment('retry.failure', { attemptCount });
      logger.error('All retry attempts failed', { errors: allErrors });
    }
  }
});
```

## Open Questions

1. **Circuit breaker integration** — Should retry include circuit breaker behavior after consecutive failures, or keep as separate concern?

2. **Total timeout vs per-attempt timeout** — Currently `maxTotalTime` caps total duration. Should there also be a per-attempt timeout handled separately?

## References

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — Result type
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Error type
- [DEP-0004-TRY](./DEP-0004-TRY.md) — Try pattern
- [DEP-0005-COMPOSITION](./DEP-0005-COMPOSITION.md) — pipe/flow composition
- [Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
