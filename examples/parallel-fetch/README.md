# Parallel Data Fetching

This example demonstrates parallel async operations with `AsyncResult`.

## What You'll Learn

- **AsyncResult.all**: Run operations in parallel
- **AsyncResult.race**: Get first successful result
- **AsyncResult.traverse**: Map array with async function
- **Batch processing**: Process items in chunks

## Running the Example

```bash
tsx examples/parallel-fetch/index.ts
```

## Key Patterns

### 1. Parallel Fetch with All

```typescript
const results = await all(
  fromPromise(fetchUser(1)),
  fromPromise(fetchUser(2)),
  fromPromise(fetchUser(3))
);
```

### 2. Race Multiple Sources

```typescript
const result = await race(
  fromPromise(fetchFromPrimary()),
  fromPromise(fetchFromCache()),
  fromPromise(fetchFromReplica())
);
```

### 3. Traverse Pattern

```typescript
const results = await traverse([1, 2, 3], id =>
  fromPromise(fetchUser(id))
);
```

### 4. Batch Processing

```typescript
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await all(...batch.map(processItem));
}
```

## When to Use

| Pattern | Use Case |
|---------|----------|
| `all` | Need all results, fail fast on error |
| `race` | Multiple sources, first wins |
| `traverse` | Map array with async operation |

## Related Examples

- [HTTP API Error Handling](../http-api/) - Single API calls
- [Database Operations](../database/) - Parallel queries
