# Rate Limiting & Timeouts

This example demonstrates resilience patterns with `retry`, `sleep`, and `withTimeout`.

## What You'll Learn

- **retryAsync**: Retry with different backoff strategies
- **withTimeout**: Add timeout constraints
- **sleep**: Rate limiting and delays
- **Conditional retry**: Retry based on error type

## Running the Example

```bash
tsx examples/resilience/index.ts
```

## Key Patterns

### 1. Simple Retry

```typescript
const result = await retryAsync(
  () => fromPromise(fetchApi()),
  {
    attempts: 3,
    delay: 1000
  }
);
```

### 2. Exponential Backoff

```typescript
await retryAsync(() => fetchApi(), {
  attempts: 5,
  delay: 500,
  backoff: "exponential",
  jitter: true
});
```

### 3. Timeout

```typescript
await fromPromise(
  withTimeout(slowOperation(), 5000, {
    message: "Operation timed out"
  })
);
```

### 4. Rate Limiting

```typescript
for (const item of items) {
  await processItem(item);
  await sleep(500); // Wait between requests
}
```

## Backoff Strategies

| Strategy | Delay Formula | Best For |
|----------|---------------|----------|
| constant | delay | Quick retries |
| linear | delay × attempt | Predictable scaling |
| exponential | delay × 2^attempt | Long retries |

## Related Examples

- [HTTP API Error Handling](../http-api/) - Retry in API clients
- [Database Operations](../database/) - Database retry logic
