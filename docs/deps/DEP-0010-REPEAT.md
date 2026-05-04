---
dep: DEP-0010
title: "Repeat: Repeated Operation Execution"
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

A `repeat()` utility that executes an async operation multiple times, collecting results or stopping on first error. `repeatUntil()` executes until a condition is met. Both provide controlled iteration over operations that may need multiple attempts or polling.

## Motivation

Some operations need to be executed multiple times:

1. **Polling** — Check for a condition until it becomes true
2. **Batch processing** — Process items in chunks with retry
3. **Health checks** — Verify system availability with multiple probes
4. **Idempotent operations** — Ensure an operation succeeds via repetition

Repeat provides:

1. **Result-aware repetition** — Works with `Result<T, E>` instead of raw promises
2. **Early termination** — Stop on error or keep going (configurable)
3. **Delay between attempts** — Built-in delay support
4. **Collection mode** — Gather all results or return only the last

## Detailed Design

### Result.repeat(operation, options)

Executes an async operation N times:

```typescript
import { Result, error } from '@deessejs/fp';

const HealthError = error({
  name: "HealthError",
  schema: z.object({ component: z.string(), cause: z.unknown().optional() })
});

const healthResult = await Result.repeat(checkHealth, {
  count: 5,
  delay: 1000
});
// Result<HealthCheck[], HealthError>
```

### Signature

```typescript
function Result.repeat<T, E>(
  operation: () => AsyncResult<T, E>,
  options: RepeatOptions<T, E>
): AsyncResult<T[], E | RepeatExhaustedError>;

interface RepeatOptions<T, E = Error> {
  count: number;                                    // Number of repetitions (> 0)
  delay?: number | (() => number | Promise<number>); // Delay between attempts
  stopOnError?: boolean;                            // Stop on first error (default: false)
  continueOnError?: boolean;                        // Collect errors in results (default: false)
  abortSignal?: AbortSignal;                        // External cancellation signal
  onAttempt?: (attempt: number) => void;            // Called before each attempt
}

interface RepeatExhaustedError {
  _tag: "RepeatExhaustedError";
  attempts: number;
  errors: E[];
}
```

### Result.repeatUntil(operation, predicate, options)

Executes until predicate returns true:

```typescript
const queueResult = await Result.repeatUntil(
  () => pollQueue(),
  (message) => message !== null,
  { maxAttempts: 10, delay: 500 }
);
// Result<Message | null, QueueError | RepeatedUntilError>
```

### Signature

```typescript
function Result.repeatUntil<T, E>(
  operation: () => AsyncResult<T, E>,
  predicate: (value: T) => boolean | Promise<boolean>,
  options?: RepeatUntilOptions<T, E>
): AsyncResult<T, E | RepeatedUntilError>;

interface RepeatUntilOptions<T, E = Error> {
  maxAttempts?: number;                             // Maximum attempts (default: Infinity)
  delay?: number | (() => number | Promise<number>); // Delay between attempts
  abortSignal?: AbortSignal;                        // External cancellation signal
  onAttempt?: (attempt: number, value: T) => void; // Called before each attempt
}
```

### Result.repeatedIsSome(operation, options)

Executes until a Maybe is Some:

```typescript
const result = await Result.repeatedIsSome(
  () => findInCache(key),
  { maxAttempts: 3, delay: 100 }
);
// Result<T, CacheError | NotFoundError | RepeatedUntilError>
```

This is a specialized `repeatUntil` for Maybe types that returns the first `Some` value or `Err<RepeatedUntilError>` if all attempts return `None`.

## Behavior

### Execution Model

All repeat operations execute **sequentially**. Each attempt completes (success or error) before the next begins. The delay (if specified) is applied between attempts, not before the first attempt.

### Boundary Values

| Parameter | Value | Behavior |
|-----------|-------|----------|
| `count` | `0` | Returns `Ok([])` immediately |
| `count` | `< 0` | Returns `Err<InvalidRepeatOptionsError>` |
| `maxAttempts` | `0` | Returns `Err<RepeatedUntilError>` immediately |
| `maxAttempts` | `Infinity` | Runs until predicate satisfied or aborted |
| `delay` | `0` | No delay between attempts |
| `delay` | `< 0` | Treated as `0` |

### Collection Mode (stopOnError: false)

```typescript
// All attempts run, all results collected
const results = await Result.repeat(checkHealth, {
  count: 3,
  stopOnError: false
});
// Ok<HealthCheck[]> if all succeed
// Err<RepeatExhaustedError> if any fails, with errors array
```

When `stopOnError: false` (default):
- All `count` attempts are made
- If any attempt fails, the final result is `Err<RepeatExhaustedError>`
- The `errors` array contains all failures

### Continuation on Error (continueOnError: true)

```typescript
// Continue despite errors, collect all results including errors
const results = await Result.repeat(checkHealth, {
  count: 3,
  stopOnError: false,
  continueOnError: true
});
// Ok<HealthCheck[]> if all succeed
// Ok<(HealthCheck | Error)[]> if some fail - errors are collected
```

When `continueOnError: true`:
- All attempts are made regardless of failures
- Results array contains both successes and failures
- If all fail, returns `Ok<(T | Error)[]>` (not an error!)

### Early Termination (stopOnError: true)

```typescript
// Stop on first error
const result = await Result.repeat(connectService, {
  count: 3,
  stopOnError: true
});
// Err<ConnectionError> on first failure
// Ok<ConnectionResult> if all succeed
```

When `stopOnError: true`:
- Stops on first error
- Returns that error immediately
- Does not make remaining attempts

### With Delay

```typescript
// Fixed delay
const result = await Result.repeat(checkHealth, {
  count: 5,
  delay: 1000  // 1 second between attempts
});

// Function-based delay
const result = await Result.repeat(connectService, {
  count: 5,
  delay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000)
});
```

**Delay function signature:** `delay?: number | ((attempt: number) => number | Promise<number>)`

### With Callback

```typescript
const result = await Result.repeat(checkHealth, {
  count: 5,
  delay: 1000,
  onAttempt: (attempt) => {
    console.log(`Attempt ${attempt} of 5`);
  }
});
```

### External Cancellation

```typescript
const controller = new AbortController();

const result = await Result.repeat(checkHealth, {
  count: 10,
  abortSignal: controller.signal
});

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);
```

When `abortSignal` is aborted:
- Current attempt completes (no violent interruption)
- Remaining attempts are skipped
- Returns `Err<AbortError>`

## Error Types

### RepeatedUntilError

When `repeatUntil` exhausts all attempts without predicate being satisfied:

```typescript
const RepeatedUntilError = error({
  name: "RepeatedUntilError",
  schema: z.object({
    attempts: z.number(),
    lastValue: z.unknown(),
    predicate: z.string()
  })
});
```

| Property | Type | Description |
|----------|------|-------------|
| `_tag` | `"RepeatedUntilError"` | Discriminator |
| `attempts` | `number` | Number of attempts made |
| `lastValue` | `unknown` | The last value returned by the operation |
| `predicate` | `string` | String description of the predicate |

### RepeatExhaustedError

When `Result.repeat` fails with `stopOnError: false` and any attempts fail:

```typescript
interface RepeatExhaustedError {
  _tag: "RepeatExhaustedError";
  attempts: number;
  errors: Error[];
}
```

### AbortError

When operation is cancelled via `abortSignal`:

```typescript
const AbortError = error({
  name: "AbortError",
  schema: z.object({ reason: z.unknown().optional() })
});
```

## Timeout Integration

`repeatUntil` can integrate with `Result.timeout` for global deadline:

```typescript
const message = await Result.repeatUntil(
  () => pollQueue(queueId),
  (msg) => msg !== null,
  {
    maxAttempts: Infinity,
    delay: 500
  }
).then(result =>
  result.ok && result.value === null
    ? Result.err(RepeatedUntilError({ attempts: -1, lastValue: null, predicate: 'msg !== null' }))
    : result
);

// Combined with Result.timeout for deadline
const result = await Result.timeout(
  Result.repeatUntil(
    () => pollQueue(queueId),
    (msg) => msg !== null,
    { maxAttempts: Infinity, delay: 500 }
  ),
  { deadline: 30000 }
);
```

**Note:** `repeatUntil` does not have a built-in `timeout` option. Use `Result.timeout` wrapper for deadline behavior.

## Examples

### Polling for Data

```typescript
// Poll until data is available
const message = await Result.repeatUntil(
  () => pollQueue(queueId),
  (msg) => msg !== null,
  { maxAttempts: 20, delay: 500 }
);

// Handle result
match(message, {
  ok: (msg) => processMessage(msg),
  err: (err) => {
    if (err._tag === 'RepeatedUntilError') {
      return handleTimeout();
    }
    return handleError(err);
  }
});
```

### Batch Processing

```typescript
const processItems = async (items: string[]) => {
  const results = await Result.repeat(
    () => processNextItem(items),
    {
      count: items.length,
      stopOnError: true
    }
  );
  return results;
};
```

### Health Check with Graceful Degradation

```typescript
const checkSystemHealth = async () => {
  // Try 3 times, continue on error to get partial health picture
  const results = await Result.repeat(checkComponent, {
    count: 3,
    stopOnError: false,
    continueOnError: true,
    delay: 500
  });

  return match(results, {
    ok: (checks) => checks.map(c =>
      c instanceof Error ? { healthy: false, error: c } : c
    ),
    err: (err) => [{ healthy: false, error: err }]
  });
};
```

## Relationship to Retry

Repeat and retry are related but serve different purposes:

| Aspect | Retry | Repeat |
|--------|-------|--------|
| Purpose | Recover from transient failures | Execute N times for polling/batching |
| Success | Same operation, new attempt | Same operation, new attempt |
| Failure | May stop or continue based on policy | Configurable via `stopOnError` |
| Use case | Fault tolerance | Polling, batch processing |

**Combining both:**

```typescript
// Retry each attempt within a repeat loop
const result = await Result.repeat(
  () => Result.retry(operation, { attempts: 3 }),
  { count: 5, delay: 2000 }
);
```

## Relationship to Sleep

`repeat` uses `sleep` internally for delays:

```typescript
// repeat uses sleep between attempts
await sleep(delay);  // Called internally by repeat
await operation();    // The actual operation
```

## Complete Example

```typescript
import { Result, error, repeat, repeatUntil, match } from '@deessejs/fp';
import { z } from 'zod';

const QueueError = error({
  name: "QueueError",
  schema: z.object({ queueId: z.string(), cause: z.unknown().optional() })
});

const RepeatedUntilError = error({
  name: "RepeatedUntilError",
  schema: z.object({
    attempts: z.number(),
    lastValue: z.unknown(),
    predicate: z.string()
  })
});

const AbortError = error({
  name: "AbortError",
  schema: z.object({ reason: z.unknown().optional() })
});

// Poll for message with timeout
async function waitForMessage(
  queueId: string,
  deadline: number = 10000
): Promise<Result<Message | null, QueueError | RepeatedUntilError | TimeoutError | AbortError>> {
  return Result.timeout(
    Result.repeatUntil(
      () => pollQueue(queueId),
      (msg) => msg !== null,
      { maxAttempts: Infinity, delay: 500 }
    ),
    { deadline, timeout: TimeoutError }
  );
}

// Batch process with retry
async function processBatch<T>(
  items: T[],
  processor: (item: T) => AsyncResult<ProcessedItem, Error>
): Promise<Result<ProcessedItem[], Error>> {
  const results: ProcessedItem[] = [];
  let failedCount = 0;

  for (const item of items) {
    const result = await Result.retry(() => processor(item), {
      attempts: 3,
      delay: 1000
    });

    if (result.ok) {
      results.push(result.value);
    } else {
      failedCount++;
    }
  }

  return failedCount > 0
    ? Result.err(ProcessingError({ failedCount }))
    : Result.ok(results);
}

// Usage
const messageResult = await waitForMessage('queue-1', 30000);

match(messageResult, {
  ok: (msg) => console.log('Got message:', msg),
  err: (err) => {
    if (err._tag === 'RepeatedUntilError') {
      console.error(`Polling exhausted after ${err.attempts} attempts`);
    } else if (err._tag === 'TimeoutError') {
      console.error('Timed out waiting for message');
    } else {
      console.error('Queue error:', err);
    }
  }
});

// Graceful degradation health check
const healthResults = await Result.repeat(checkComponent, {
  count: 3,
  stopOnError: false,
  continueOnError: true,
  delay: 1000,
  abortSignal: abortController.signal
});

match(healthResults, {
  ok: (checks) => {
    const healthy = checks.filter(c => !(c instanceof Error));
    const failed = checks.filter(c => c instanceof Error);
    console.log(`Healthy: ${healthy.length}, Failed: ${failed.length}`);
  },
  err: (err) => console.error('All checks failed:', err)
});
```

## References

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — Result type
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Error type
- [DEP-0006-RETRY](./DEP-0006-RETRY.md) — Retry system
- [DEP-0007-SLEEP](./DEP-0007-SLEEP.md) — Sleep utilities
- [DEP-0009-TIMEOUT](./DEP-0009-TIMEOUT.md) — Timeout (combine with repeatUntil for deadline)