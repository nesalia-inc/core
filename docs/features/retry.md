# Retry

The Retry utilities provide resilience patterns for handling transient failures. They're essential for operations that might temporarily fail - like network requests, database connections, or external API calls.

## Why Retry?

Network operations and external services can fail temporarily:

```typescript
// Problem: One failure and you're done
const user = await fetchUser(id);
// If the API is down, you're stuck

// Solution: Retry with smart backoff
import { retryAsync } from '@deessejs/core';
const user = await retryAsync(() => fetchUser(id), {
  attempts: 3,
  delay: 1000,
  backoff: 'exponential'
});
// Retries 3 times with 1s, 2s, 4s delays
```

---

## Quick Start

```typescript
import { retry, retryAsync } from '@deessejs/core';

// Sync operations
const result = retry(() => riskyOperation());

// Async operations (recommended)
const result = await retryAsync(() => fetch('/api/data'));
```

---

## API Reference

### `retry(fn, options)` - Retry synchronous operations

```typescript
import { retry } from '@deessejs/core';

const result = retry(() => {
  // Operation that might throw
  return mightThrow();
});
```

### `retryAsync(fn, options)` - Retry asynchronous operations

```typescript
import { retryAsync } from '@deessejs/core';

const result = await retryAsync(async () => {
  const response = await fetch('/api/data');
  return response.json();
});
```

---

## RetryOptions

All options are optional with sensible defaults:

```typescript
interface RetryOptions {
  /** Number of attempts (default: 3) */
  attempts?: number;

  /** Initial delay in ms (default: 1000) */
  delay?: number;

  /** Backoff strategy (default: 'exponential') */
  backoff?: 'exponential' | 'linear' | 'constant' | ((attempt: number, delay: number) => number);

  /** Predicate to determine if error is retryable */
  predicate?: (error: Error) => boolean;

  /** Callback on each retry */
  onRetry?: (error: Error, attempt: number) => void;

  /** Add jitter to prevent thundering herd (default: false) */
  jitter?: boolean;
}
```

---

## Backoff Strategies

### Exponential (default)

Delays double with each attempt: 1s, 2s, 4s, 8s...

```typescript
import { retryAsync } from '@deessejs/core';

await retryAsync(fn, {
  attempts: 4,
  delay: 1000,
  backoff: 'exponential'
});
// Delays: 1000ms, 2000ms, 4000ms
```

### Linear

Delays increase linearly: 1s, 2s, 3s, 4s...

```typescript
await retryAsync(fn, {
  attempts: 4,
  delay: 1000,
  backoff: 'linear'
});
// Delays: 1000ms, 2000ms, 3000ms
```

### Constant

Same delay every time: 1s, 1s, 1s...

```typescript
await retryAsync(fn, {
  attempts: 4,
  delay: 1000,
  backoff: 'constant'
});
// Delays: 1000ms, 1000ms, 1000ms
```

### Custom Function

You can provide your own backoff function:

```typescript
await retryAsync(fn, {
  delay: 1000,
  backoff: (attempt, delay) => {
    // Fibonacci backoff
    if (attempt === 1) return delay;
    if (attempt === 2) return delay;
    return delay * attempt;
  }
});
```

---

## Selective Retries

### Using `predicate`

Not all errors should trigger a retry. Use `predicate` to filter:

```typescript
import { retryAsync } from '@deessejs/core';

const isRetryable = (error: Error) => {
  // Retry on network errors, 5xx errors
  // Don't retry on 4xx (client errors)
  return error.message.includes('network') ||
         error.message.includes('5');
};

await retryAsync(async () => {
  const response = await fetch('/api/data');
  if (!response.ok) {
    throw new Error(`${response.status}`);
  }
  return response.json();
}, {
  predicate: isRetryable
});
```

### Using `onRetry`

Log or track retries:

```typescript
import { retryAsync } from '@deessejs/core';

await retryAsync(async () => {
  const response = await fetch('/api/data');
  return response.json();
}, {
  attempts: 3,
  onRetry: (error, attempt) => {
    console.log(`Attempt ${attempt} failed: ${error.message}`);
    // Could send to error tracking service
  }
});
```

---

## Jitter

Add randomness to prevent "thundering herd" problems when multiple clients retry simultaneously:

```typescript
import { retryAsync } from '@deessejs/core';

await retryAsync(fn, {
  attempts: 5,
  delay: 1000,
  backoff: 'exponential',
  jitter: true  // Random delay between 500ms-1500ms
});
```

---

## Real-World Examples

### API Calls with Retry

```typescript
import { retryAsync } from '@deessejs/core';

interface User {
  id: number;
  name: string;
}

const fetchUser = async (id: number): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

const fetchUserWithRetry = (id: number): Promise<User> =>
  retryAsync(() => fetchUser(id), {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
    predicate: (error) => {
      // Retry on network errors or 5xx
      const message = error.message;
      return message.includes('network') ||
             message.includes('5') ||
             message.includes('ETIMEDOUT');
    }
  });

// Usage
const user = await fetchUserWithRetry(123);
```

### Database Connection

```typescript
import { retry } from '@deessejs/core';

const connect = retry(() => {
  // Might throw if DB is temporarily unavailable
  return database.connect({
    host: process.env.DB_HOST,
    retries: 0  // No internal retry
  });
}, {
  attempts: 5,
  delay: 2000,
  backoff: 'exponential'
});
```

### File Upload with Progress

```typescript
import { retryAsync } from '@deessejs/core';

const uploadFile = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
};

await retryAsync(() => uploadFile(file), {
  attempts: 3,
  delay: 1000,
  backoff: 'linear',
  onRetry: (error, attempt) => {
    console.log(`Retry ${attempt}: ${error.message}`);
  }
});
```

---

## Backoff Strategy Comparison

| Strategy | Delays (delay=1000) | Best For |
|----------|---------------------|----------|
| **Exponential** | 1s, 2s, 4s | Most cases - backs off quickly |
| **Linear** | 1s, 2s, 3s | Predictable load |
| **Constant** | 1s, 1s, 1s | Third-party APIs with rate limits |

> **Recommendation:** Use exponential backoff for most cases. It provides the best balance between quick recovery and not overwhelming failing services.

---

## Best Practices

### 1. Set Appropriate Limits

```typescript
// Good: Reasonable limits
await retryAsync(fn, {
  attempts: 3,
  delay: 1000  // Start at 1 second
});

// Avoid: Too many retries or too long delays
await retryAsync(fn, {
  attempts: 10,  // Too many
  delay: 10000   // 10 seconds - too long
});
```

### 2. Use Predicate for Smart Retries

```typescript
// Good: Only retry transient errors
await retryAsync(fn, {
  predicate: (error) => {
    // Don't retry auth errors
    if (error.message.includes('401')) return false;
    // Don't retry not found
    if (error.message.includes('404')) return false;
    return true;
  }
});
```

### 3. Log Retries for Debugging

```typescript
await retryAsync(fn, {
  onRetry: (error, attempt) => {
    console.error(`Attempt ${attempt} failed:`, error.message);
  }
});
```

### 4. Prefer `retryAsync` for I/O

```typescript
// Good: Non-blocking
await retryAsync(async () => fetch('/api/data'));

// Avoid: Blocking (uses busy wait)
retry(() => mightThrow()); // Blocks the thread
```

---

## Known Limitations & Future Improvements

### 1. Sync `retry` with delay blocks the Event Loop

**Current behavior:** The sync `retry` uses a busy-wait loop for delays, which blocks the JavaScript event loop.

**Recommendation:** Always use `retryAsync` for production code:

```typescript
// Good: Non-blocking
await retryAsync(async () => fetch('/api/data'));

// Avoid: retry with delay blocks everything
retry(() => mightThrow(), { delay: 1000 }); // Blocks event loop
```

> **Note:** Future versions may deprecate or remove the `delay` option from sync `retry`.

### 2. No `maxDelay` option

**Current behavior:** Exponential backoff can grow unbounded. With `attempts: 10` and `delay: 1000`, delays can reach several minutes.

**Workaround:** Use a custom backoff function:

```typescript
retryAsync(fn, {
  attempts: 10,
  delay: 1000,
  backoff: (attempt, delay) => Math.min(delay * Math.pow(2, attempt - 1), 30000)
});
```

> **Note:** A built-in `maxDelay` option may be added in future versions.

### 3. `attempts` vs `retries` ambiguity

**Current behavior:** `attempts: 3` means 3 total attempts (initial call + 2 retries).

This is consistent with the implementation, but some users may expect `retries` (number of retry attempts after the initial call). Future versions may add `maxAttempts` alias for clarity.

### 4. No `AbortSignal` support

**Current behavior:** `retryAsync` cannot be cancelled mid-operation.

**Recommendation:** Use a wrapper with AbortController:

```typescript
const controller = new AbortController();

try {
  await retryAsync(async () => {
    const response = await fetch(url, { signal: controller.signal });
    return response.json();
  }, { attempts: 5 });
} catch (error) {
  // On cancellation, abort the fetch
  controller.abort();
}
```

> **Note:** Built-in `AbortSignal` support may be added in future versions.

### 5. `predicate` only receives Error

**Current behavior:** The `predicate` function only receives the caught exception.

**Limitation:** For `fetch`, HTTP errors (4xx, 5xx) don't throw - they return a response with `ok: false`.

**Workaround:** Throw explicitly:

```typescript
const fetchWithRetry = (url: string) =>
  retryAsync(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }, { predicate: (error) => error.message.includes('5') });
```

> **Note:** Future versions may support `shouldRetry` that receives both result and error.

### 6. Jitter is binary

**Current behavior:** `jitter: true` uses "Full Jitter" (random value between 0.5x and 1.5x delay).

This is the recommended strategy for preventing thundering herd. A numeric factor may be added in future versions for more control.

### 7. Custom backoff receives initial delay

**Current behavior:** Custom backoff receives `(attempt, initialDelay)`.

```typescript
backoff: (attempt, delay) => delay * attempt // linear
```

This allows calculating from the initial delay. If you need the last used delay, track it externally.

---

## Comparison with Alternatives

| Feature | @deessejs/core | op-retry | retry-async |
|---------|---------------|----------|-------------|
| Bundle size | ~2KB | ~1KB | ~2KB |
| Async support | Yes | No | Yes |
| Custom backoff | Yes | Yes | Limited |
| Jitter | Yes | No | No |
| Predicate | Yes | No | No |

---

## Related

- [Sleep](./sleep.md) - For adding delays
- [AsyncResult](./async-result.md) - For async operations with error handling
