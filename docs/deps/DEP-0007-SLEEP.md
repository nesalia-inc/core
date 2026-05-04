---
dep: DEP-0007
title: "Sleep: Delayed Execution Utilities"
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

A sleep utility that provides delayed execution for async operations. Integrates with the retry system and supports cancellation via AbortController. Sleep is fundamental for implementing backoff strategies, rate limiting, and introducing delays in async workflows.

## Motivation

Async workflows often require deliberate delays:

1. **Retry backoff** — Sleep enables exponential backoff between retry attempts
2. **Rate limiting** — Prevent overwhelming external services
3. **Polling** — Wait for async operations to complete
4. **Testing** — Control timing in async tests
5. **User experience** — Debounce UI events or show loading states

## Detailed Design

### sleep(millis)

Pauses execution for the specified duration:

```typescript
import { sleep } from '@deessejs/fp';

// Sleep for 100 milliseconds
await sleep(100);
```

### sleep with Cancellation

Sleep accepts an AbortSignal to enable cancellation:

```typescript
import { sleep } from '@deessejs/fp';

const controller = new AbortController();

// Start a 10 second sleep
const sleepPromise = sleep(10000, { signal: controller.signal });

// Cancel after 1 second
setTimeout(() => controller.abort(), 1000);

try {
  await sleepPromise;
  // Completed normally (unlikely with these timings)
} catch (e) {
  if (e instanceof AbortError) {
    // Sleep was cancelled
  }
}
```

### sleepUntil(predicate, options)

Pauses until a predicate returns true or timeout is reached:

```typescript
import { sleepUntil } from '@deessejs/fp';

// Poll until condition is met (max 5 seconds)
const result = await sleepUntil(
  () => fetchStatus().ok,  // Predicate returning boolean
  { timeout: 5000, interval: 100 }
);

// Async predicate for async operations
const ready = await sleepUntil(
  async () => {
    const status = await fetchStatus();
    return status.ok;
  },
  { timeout: 5000, interval: 100 }
);
```

If the predicate throws, the exception propagates and `sleepUntil` rejects.

### sleepRandom(min, max)

Pauses for a random duration within a range:

```typescript
import { sleepRandom } from '@deessejs/fp';

// Sleep for 100-500ms (useful for jitter)
const actualDuration = await sleepRandom(100, 500);
```

`sleepRandom` validates inputs:
- `min < 0` or `max < 0` — throws `ValidationError`
- `min > max` — throws `ValidationError`

The returned duration is the actual time slept.

## Type Signatures

```typescript
// Basic sleep
function sleep(millis: number, options?: { signal?: AbortSignal }): Promise<void>;

// Sleep until predicate is true
function sleepUntil(
  predicate: () => boolean | Promise<boolean>,
  options?: {
    timeout?: number;    // Maximum wait time in ms (default: infinity)
    interval?: number;   // Polling interval in ms (default: 10)
    signal?: AbortSignal;
  }
): Promise<boolean>;  // Returns true if predicate succeeded, false if timeout or abort

// Random sleep
function sleepRandom(min: number, max: number, options?: { signal?: AbortSignal }): Promise<number>; // Returns actual duration slept
```

### Maximum Duration

`sleep` uses the platform's maximum timer delay internally. JavaScript's `setTimeout` has a maximum of `2^31 - 1` ms (~24.8 days). Durations exceeding this are clamped to the platform maximum.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| `sleep(0)` | Yields to event loop, resolves on next tick |
| Negative duration | Treated as `0` |
| Duration > platform max | Clamped to platform maximum (~24.8 days) |
| Abort before start | Resolves immediately if signal already aborted |
| Abort during sleep | Rejects with `AbortError` |
| Timeout in `sleepUntil` | Resolves to `false` |
| `sleepRandom(min, max)` with `min > max` | Throws `ValidationError` |
| `sleepRandom` with negative values | Throws `ValidationError` |
| `sleepUntil` predicate throws | Exception propagates, `sleepUntil` rejects |
| `sleepUntil` predicate is async | Awaits predicate result, treats promise truthiness correctly |

## Integration with Retry

Sleep is used internally by the retry system for backoff delays:

```typescript
// The retry system uses sleep internally for delay between attempts
const policy = retryPolicy({
  initialDelay: 100,
  maxDelay: 5000,
  backoffMultiplier: 2
});
// Retry handles sleep internally, no explicit sleep needed
```

## Relationship to Other DEPs

- [DEP-0006-RETRY](./DEP-0006-RETRY.md) — Retry uses sleep internally for backoff delays
- [DEP-0005-COMPOSITION](./DEP-0005-COMPOSITION.md) — Works with pipe/flow for sequencing delays

## Benefits

| Benefit | Description |
|---------|-------------|
| **Cancellation** | Full AbortSignal support for cancellation |
| **Composability** | Works with async/await and pipe |
| **Precision** | Millisecond-level control |
| **Predictability** | sleepUntil provides bounded polling |

## Open Questions

1. **Zero-argument variant** — Should there be a `yield()` function that yields to event loop without minimum delay?

2. **Progressive delay for sleepUntil** — Should `sleepUntil` support exponential backoff on the polling interval instead of fixed interval?

## References

- [DEP-0006-RETRY](./DEP-0006-RETRY.md) — Retry system
- [DEP-0005-COMPOSITION](./DEP-0005-COMPOSITION.md) — Composition utilities
