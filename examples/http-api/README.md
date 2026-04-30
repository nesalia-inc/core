# HTTP API Error Handling

This example demonstrates how to use `@deessejs/fp` for robust HTTP API error handling.

## What You'll Learn

- **AsyncResult**: Wrapping `fetch` and other Promise-based APIs
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Timeout Handling**: Adding timeout constraints to requests
- **Error Categorization**: Distinguishing network vs business errors
- **Request Chaining**: Composing multiple API calls

## Running the Example

```bash
# From the project root
tsx examples/http-api/index.ts
```

## Key Patterns

### 1. Basic Fetch with AsyncResult

```typescript
import { fromPromise } from "@deessejs/fp";

const result = await fromPromise(fetchUserFromApi(id)).mapErr((error) => ({
  type: "NETWORK",
  message: error.message,
}));

if (result.isOk()) {
  console.log("User:", result.value);
} else {
  console.log("Error:", result.error);
}
```

### 2. Adding Timeout

```typescript
import { withTimeout } from "@deessejs/fp";

const result = await fromPromise(fetchUserFromApi(id))
  .flatMap((user) =>
    fromPromise(
      withTimeout(Promise.resolve(user), 5000, {
        message: "Request timeout",
        name: "TIMEOUT",
      })
    )
  );
```

### 3. Automatic Retry

```typescript
import { retryAsync } from "@deessejs/fp";

const result = await retryAsync(
  () => fromPromise(fetchUserFromApi(id)),
  {
    attempts: 3,
    delay: 500,
    backoff: "exponential",
    jitter: true,
    onRetry: (error, attempt) => {
      console.log(`Retry ${attempt}:`, error.message);
    },
  }
);
```

### 4. Input Validation

```typescript
const validationResult = ok(data)
  .flatMap((d) =>
    d.name.length >= 2
      ? ok(d)
      : err({ type: "BUSINESS", message: "Name too short" })
  )
  .flatMap((d) =>
    d.email.includes("@")
      ? ok(d)
      : err({ type: "BUSINESS", message: "Invalid email" })
  );
```

### 5. Chaining Requests

```typescript
const result = await fromPromise(fetchUser(userId))
  .flatMapAsync((user) =>
    fromPromise(fetchPosts(user.id))
      .mapAsync((posts) =>
        fromPromise(fetchComments(posts))
      )
  );
```

## When to Use This Pattern

✅ **Use when:**
- Making HTTP requests that can fail
- Need automatic retry for transient failures
- Require timeout constraints
- Want to distinguish error types
- Composing multiple API calls

❌ **Don't use when:**
- Simple fetch that rarely fails
- No need for error categorization
- One-off requests without retry needs

## Related Examples

- [Parallel Data Fetching](../parallel-fetch/) - For concurrent requests
- [Rate Limiting & Timeouts](../resilience/) - For advanced resilience patterns
