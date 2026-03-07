# Database Operations

This example demonstrates database operations with `AsyncResult` and `Try`.

## What You'll Learn

- **AsyncResult**: Wrapping database queries
- **Try**: Safe error handling for unsafe operations
- **Composition**: Chaining multiple database operations
- **Error handling**: Constraint violations, connection errors

## Running the Example

```bash
tsx examples/database/index.ts
```

## Key Patterns

### 1. Simple Query

```typescript
const result = await fromPromise(db.findUserById(id))
  .map(user => {
    if (!user) throw new Error("Not found");
    return user;
  })
  .mapErr(error => ({
    type: "NOT_FOUND",
    message: error.message
  }));
```

### 2. Constraint Handling

```typescript
await fromPromise(db.createUser(data))
  .mapErr(error => {
    if (error.message.includes("already exists")) {
      return { type: "CONSTRAINT", message: "Email exists" };
    }
    return { type: "QUERY", message: error.message };
  });
```

### 3. Transaction-like Behavior

```typescript
const result = await fromPromise(db.findUser(userId))
  .flatMapAsync(user => fromPromise(db.createPost(...)))
  .flatMapAsync(post => fromPromise(db.notifyUser(post)));
```

## When to Use

✅ **Use when:**
- Querying databases that can fail
- Need to handle constraint violations
- Composing multiple operations
- Want type-safe error handling

## Related Examples

- [HTTP API Error Handling](../http-api/) - Similar patterns for APIs
- [Parallel Data Fetching](../parallel-fetch/) - Concurrent queries
