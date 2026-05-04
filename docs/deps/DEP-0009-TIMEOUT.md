---
dep: DEP-0009
title: "Timeout: Time-Bound Operations"
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

A `timeout()` utility that wraps async operations with a time limit, returning `Err<TimeoutError>` if the deadline is exceeded. Timeout is the building block for deadline-aware retry loops and provides graceful degradation for operations that may hang indefinitely.

## Motivation

Async operations can hang forever: network partitions, deadlocks, broken external services. Without timeout, a single stalled operation can block your entire application.

Timeout provides:

1. **Resource protection** — Prevent resource leaks from hanging connections
2. **Graceful degradation** — Return a typed error instead of hanging indefinitely
3. **Composability** — Works with `Result.gen` and all Result operations
4. **Cancellation integration** — Respects `AbortSignal` for coordinated cancellation

## Detailed Design

### Result.timeout(operation, deadline, options?)

Wraps an async operation with a deadline:

```typescript
import { Result, error } from '@deessejs/fp';

const TimeoutError = error({
  name: "TimeoutError",
  schema: z.object({
    deadline: z.number(),
    elapsed: z.number(),
    operation: z.string()
  })
});

const AbortError = error({
  name: "AbortError",
  schema: z.object({ reason: z.unknown().optional() })
});

// Basic usage - reject after 5000ms
const result = await Result.timeout(
  fetchUser(id),
  { deadline: 5000, timeout: TimeoutError }
);
// Result<User, NetworkError | TimeoutError>
```

### Signature

```typescript
function Result.timeout<T, E>(
  operation: AsyncResult<T, E>,
  options: TimeoutOptions<T, E>
): AsyncResult<T, E | TimeoutError | AbortError>;

interface TimeoutOptions<T, E = Error> {
  deadline: number;                            // Maximum time in ms
  timeout?: ErrorConstructor | ((info: TimeoutInfo) => TaggedError);
  abortSignal?: AbortSignal;                   // External abort signal
  onTimeout?: () => AsyncResult<T, E>;          // Fallback on timeout
  resume?: 'abort' | 'continue';               // What to do with underlying op
  operationName?: string;                       // For error messages
}

interface TimeoutInfo {
  deadline: number;
  elapsed: number;
  operation: string;
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `operation` | `AsyncResult<T, E>` | The async operation to wrap |
| `options.deadline` | `number` | Maximum time in milliseconds (> 0) |
| `options.timeout` | `ErrorConstructor` | Constructor for TimeoutError |
| `options.abortSignal` | `AbortSignal` | External signal to respect |
| `options.onTimeout` | `() => AsyncResult<T, E>` | Fallback on timeout |
| `options.resume` | `'abort' \| 'continue'` | Continue underlying op after timeout |
| `options.operationName` | `string` | Name for error messages |

### Behavior

**Deadline boundary values:**
- `deadline <= 0` — Returns `Err<TimeoutError>` immediately with `elapsed: 0`
- `deadline === Infinity` — No timeout applied, behaves like plain operation
- `deadline > 0` — Normal timeout behavior

**Success path:**
- Operation completes before deadline → returns original Result

**Timeout path:**
- Deadline exceeded → returns `Err<TimeoutError>`
- If `resume: 'abort'` (default): underlying operation is abandoned via internal AbortSignal
- If `resume: 'continue'`: underlying operation continues running (caller responsible for cleanup)

**Abort path:**
- External signal aborted → returns `Err<AbortError>`
- If signal already aborted when timeout starts → returns `Err<AbortError>` immediately

**Error path:**
- Operation rejects with domain error → error propagates unchanged

### Resource Cleanup

**`resume: 'abort'` (default):**
- An internal AbortSignal is used to signal the operation to stop
- The caller receives `Err<TimeoutError>` immediately
- No guaranteed cleanup (operation may not support AbortSignal)
- Memory is reclaimed when the abandoned operation eventually settles

**`resume: 'continue'`:**
- Underlying operation continues running
- Caller is responsible for tracking and cleaning up orphaned operations
- Use this when the operation doesn't support AbortSignal but must complete

### Timeout with Fallback

```typescript
const result = await Result.timeout(
  fetchHeavyQuery(),
  {
    deadline: 5000,
    timeout: TimeoutError,
    onTimeout: () => Result.ok(cachedData)
  }
);
// Returns cached data instead of TimeoutError
```

**onTimeout callback timeout:** If `onTimeout` is provided but the fallback itself hangs, no additional timeout is applied to the fallback. The fallback must be trusted or self-limiting.

### External AbortSignal

```typescript
const controller = new AbortController();

// External cancellation
setTimeout(() => controller.abort(), 3000);

const result = await Result.timeout(
  fetchUser(id),
  {
    deadline: 5000,
    timeout: TimeoutError,
    abortSignal: controller.signal
  }
);
// Err<AbortError> if aborted before completion
// Err<TimeoutError> if deadline exceeded before abort
```

**Already-aborted signal:** If `abortSignal` is already in aborted state, returns `Err<AbortError>` immediately without executing the operation.

### Error Types

#### TimeoutError

```typescript
const TimeoutError = error({
  name: "TimeoutError",
  schema: z.object({
    deadline: z.number(),
    elapsed: z.number(),
    operation: z.string()
  })
});
```

| Property | Type | Description |
|----------|------|-------------|
| `_tag` | `"TimeoutError"` | Discriminator |
| `deadline` | `number` | The timeout threshold in ms |
| `elapsed` | `number` | Actual time before timeout in ms |
| `operation` | `string` | Name of the timed-out operation |
| `message` | `string` | Human-readable message |

#### AbortError

```typescript
const AbortError = error({
  name: "AbortError",
  schema: z.object({
    reason: z.unknown().optional()
  })
});
```

| Property | Type | Description |
|----------|------|-------------|
| `_tag` | `"AbortError"` | Discriminator |
| `reason` | `unknown` | The abort reason if provided |
| `message` | `string` | Human-readable message |

## Relationship to Retry

Timeout is a primitive used by retry systems:

```typescript
// Retry with deadline (retry stops when deadline reached)
const result = await Result.retry(
  fetchUser(id),
  {
    attempts: 3,
    deadline: 10000,  // Global timeout - uses timeout internally
    onRetry: (err, attempt) => {
      if (err._tag === 'TimeoutError') return false;
      return true;
    }
  }
);
```

**Timeout vs Retry:**

| Aspect | Timeout | Retry |
|--------|---------|-------|
| Attempts | 1 | Multiple |
| Purpose | Hard limit on single operation | Transient fault tolerance |
| Per-attempt limit | Via timeout option | Via timeout option |
| Global deadline | Via timeout option | Via timeout option |

## Relationship to Sleep

Sleep and timeout both deal with time, but serve different purposes:

- `sleep(ms)` — Pause execution for a duration
- `timeout(op, ms)` — Execute with a time limit

```typescript
// Sleep is often used with retry
await sleep(1000);  // Wait before retry
await Result.timeout(op, { deadline: 5000 });  // Limit operation time
```

## Complete Example

```typescript
import { Result, error, pipe } from '@deessejs/fp';
import { z } from 'zod';

const NetworkError = error({
  name: "NetworkError",
  schema: z.object({ url: z.string(), cause: z.unknown().optional() })
});

const TimeoutError = error({
  name: "TimeoutError",
  schema: z.object({
    deadline: z.number(),
    elapsed: z.number(),
    operation: z.string()
  })
});

const AbortError = error({
  name: "AbortError",
  schema: z.object({ reason: z.unknown().optional() })
});

// Fetch with timeout
async function fetchWithTimeout(url: string, deadline: number) {
  return Result.timeout(
    Result.attemptAsync(
      () => fetch(url).then(r => r.json()),
      (cause) => NetworkError({ url, cause })
    ),
    {
      deadline,
      timeout: TimeoutError,
      operationName: `fetch(${url})`
    }
  );
}

// Use with pipe
const userResult = await pipe(
  fetchWithTimeout('/api/user/123', 5000),
  Result.map(user => user.name),
  Result.tapErr(err => console.error('Failed:', err._tag))
);

// External abort with fallback
const controller = new AbortController();
setTimeout(() => controller.abort(), 3000);

const result = await Result.timeout(
  fetchUser(id),
  {
    deadline: 5000,
    timeout: TimeoutError,
    abortSignal: controller.signal,
    onTimeout: () => Result.ok({ id: 'default', name: 'Anonymous' })
  }
);

// Graceful fallback with cached data
const cachedResult = await Result.timeout(
  fetchHeavyQuery(),
  {
    deadline: 2000,
    timeout: TimeoutError,
    onTimeout: () => Result.ok(getCachedData())
  }
);
```

## References

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — Result type
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Error type
- [DEP-0006-RETRY](./DEP-0006-RETRY.md) — Retry system (uses timeout internally)
- [DEP-0007-SLEEP](./DEP-0007-SLEEP.md) — Sleep utilities
- [MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — AbortSignal specification