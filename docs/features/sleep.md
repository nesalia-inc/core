# Sleep

The Sleep utilities provide simple but essential delay and timeout functionality for async operations. They're fundamental building blocks for retry logic, rate limiting, and handling asynchronous workflows.

## Why Sleep?

Delays are essential in async programming:

```typescript
// Problem: No way to wait
// Need to wait before retrying...
// Need to debounce...
// Need to rate limit...

// Solution: Simple promise-based delays
import { sleep } from '@deessejs/core';
await sleep(1000); // Wait 1 second
```

---

## Quick Start

```typescript
import { sleep, withTimeout, sleepWithSignal } from '@deessejs/core';

// Simple delay
await sleep(1000); // Wait 1 second

// With timeout
const result = await withTimeout(fetch('/api/data'), 5000);

// Cancellable sleep
const controller = new AbortController();
await sleepWithSignal(5000, controller.signal);
controller.abort(); // Cancels the sleep
```

---

## API Reference

### `sleep(ms)` - Simple delay

Creates a promise that resolves after the specified delay:

```typescript
import { sleep } from '@deessejs/core';

// Wait 1 second
await sleep(1000);

// Wait 500ms
await sleep(500);

// 0 resolves immediately
await sleep(0);
```

---

### `withTimeout(promise, ms, options)` - Add timeout to a promise

Adds a timeout to any promise. Throws a `TimeoutError` if the promise doesn't resolve in time:

```typescript
import { withTimeout } from '@deessejs/core';

// Basic usage
const result = await withTimeout(
  fetch('/api/data'),
  5000 // 5 second timeout
);

// With function instead of promise
const result = withTimeout(
  () => fetch('/api/data'),
  5000
);
```

#### TimeoutOptions

```typescript
interface TimeoutOptions {
  /** Custom error message */
  message?: string;

  /** Custom error name (default: "TIMEOUT") */
  name?: string;

  /** Include elapsed time in error data (default: true) */
  includeElapsed?: boolean;
}
```

#### TimeoutError

```typescript
interface TimeoutError extends Error {
  name: string;
  timeout: number;
  elapsed?: number;
}
```

Examples:

```typescript
import { withTimeout } from '@deessejs/core';

// Custom message
await withTimeout(promise, 1000, {
  message: 'API call took too long'
});

// Custom name
await withTimeout(promise, 1000, {
  name: 'API_TIMEOUT'
});

// Without elapsed time
await withTimeout(promise, 1000, {
  includeElapsed: false
});
```

---

### `sleepWithSignal(ms, signal)` - Cancellable sleep

A sleep that can be cancelled using an AbortSignal:

```typescript
import { sleepWithSignal } from '@deessejs/core';

const controller = new AbortController();

// Start sleeping
const sleepPromise = sleepWithSignal(5000, controller.signal);

// Cancel after 1 second
setTimeout(() => controller.abort(), 1000);

try {
  await sleepPromise;
} catch (error) {
  console.log(error.message); // "Sleep aborted"
}
```

---

## Real-World Examples

### Retry with Delay

```typescript
import { retryAsync, sleep } from '@deessejs/core';

// Exponential backoff with sleep
const fetchWithBackoff = async (url: string, attempts = 3) => {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url);
      return response.json();
    } catch (error) {
      if (i === attempts - 1) throw error;
      // Wait before retry: 1s, 2s, 4s...
      await sleep(1000 * Math.pow(2, i));
    }
  }
};
```

### Rate Limiting

```typescript
import { sleep } from '@deessejs/core';

const rateLimitedFetch = async (urls: string[]) => {
  const results = [];

  for (const url of urls) {
    results.push(await fetch(url));
    // Wait 100ms between requests to avoid rate limiting
    await sleep(100);
  }

  return results;
};
```

### API Call with Timeout

```typescript
import { withTimeout, TimeoutError } from '@deessejs/core';

const fetchWithTimeout = async (url: string) => {
  try {
    return await withTimeout(fetch(url), 5000);
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.log(`Request timed out after ${error.elapsed}ms`);
      throw new Error('Request took too long');
    }
    throw error;
  }
};
```

### Debouncing

```typescript
import { sleep } from '@deessejs/core';

const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      await fn(...args);
    }, delay);
  };
};

// Usage
const debouncedSearch = debounce(async (query: string) => {
  const results = await fetch(`/api/search?q=${query}`);
  console.log(await results.json());
}, 300);
```

### Timeout with Cleanup

```typescript
import { withTimeout, sleepWithSignal } from '@deessejs/core';

const fetchWithCleanup = async (url: string) => {
  const controller = new AbortController();

  const result = await Promise.race([
    fetch(url, { signal: controller.signal }),
    sleepWithSignal(5000, controller.signal)
  ]);

  // If we hit timeout, abort the fetch
  if (result instanceof Error) {
    controller.abort();
    throw result;
  }

  return result;
};
```

---

## Best Practices

### 1. Use `withTimeout` for External Calls

```typescript
// Good: Always timeout external calls
const data = await withTimeout(fetch('/api/data'), 5000);

// Avoid: Unbounded waits
const data = await fetch('/api/data'); // Could hang forever
```

### 2. Handle Timeout Errors Gracefully

```typescript
import { withTimeout, TimeoutError } from '@deessejs/core';

try {
  await withTimeout(riskyOperation(), 5000);
} catch (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout specifically
    return fallbackValue;
  }
  // Handle other errors
  throw error;
}
```

### 3. Use AbortSignal for Cancellation

```typescript
import { sleepWithSignal } from '@deessejs/core';

const controller = new AbortController();

// Clean cancellation
await sleepWithSignal(10000, controller.signal);
controller.abort();

// Or use with cancellation token from elsewhere
const token = getCancellationToken();
await sleepWithSignal(5000, token.signal);
```

---

## Comparison with Alternatives

| Feature | @deessejs/core | Native |
|---------|---------------|--------|
| `sleep()` | Simple promise wrapper | No (need manual implementation) |
| `withTimeout()` | Rich error with timeout/elapsed | Promise.race manually |
| `sleepWithSignal()` | AbortSignal support | Native `sleep` doesn't exist |

---

## Related

- [Retry](./retry.md) - For resilience with backoff
- [AsyncResult](./async-result.md) - For async operations with error handling
