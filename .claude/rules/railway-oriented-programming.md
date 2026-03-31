---
paths:
  - "**/*.ts"
---

# Railway-Oriented Programming Rules

## Never Break the Rail

In railway-oriented programming (ROP), the goal is to handle errors through Result types, not exceptions. Throwing or using `raise()` should be **extremely rare** and only used when you intentionally want to cut the flow and propagate up the call stack.

### Why This Matters

- **Composable**: Results can be mapped, chained, and combined without breaking the flow
- **Explicit**: Errors are part of the return type, not hidden control flow
- **Testable**: Every error path can be tested without exception handling
- ** traceable**: Error enrichment (`addNotes()`, `from()`) builds debugging chains

### The Pattern

Instead of throwing exceptions, pass errors through the Result/AsyncResult:

```typescript
// Bad - breaks the rail with throw/raise
const divide = (a: number, b: number): Result<number, Error> => {
  if (b === 0) raise(new Error("Division by zero"));
  return ok(a / b);
};

// Good - error travels through the rail
const divide = (a: number, b: number): Result<number, Error> => {
  if (b === 0) return err(new Error("Division by zero"));
  return ok(a / b);
};
```

### When to Break the Rail

Breaking the rail (using `throw` or `raise`) should be **exceptional** and reserved for:

1. **Unrecoverable programmer errors** - Things that indicate a bug, not an expected failure
2. **Invariant violations** - Internal assumptions that if violated indicate system corruption
3. **Immediate termination** - When continuing would cause data damage (e.g., in cleanup handlers)

```typescript
// Acceptable - unrecoverable invariant violation
const process = (config: Config): Result<Data, Error> => {
  if (!config.requiredField) {
    raise(new Error("Required field missing - this is a bug"));
  }
  return ok(data);
};
```

### When NOT to Break the Rail

- **User input validation** - Return `Result.err()` with a validation error
- **Network failures** - Return `AsyncResult.err()` from `fromPromise`
- **File system errors** - Return `Result.err()` or `AsyncResult.err()`
- **Business rule violations** - Return `Result.err()` with a domain error
- **Expected failure cases** - Use `err()` to carry the error forward

```typescript
// Bad - throwing for expected failures
const parseConfig = (input: string): Result<Config, Error> => {
  if (!input) throw new Error("Empty input");
  return ok(JSON.parse(input));
};

// Good - expected failures travel through Result
const parseConfig = (input: string): Result<Config, Error> => {
  if (!input) return err(new Error("Empty input"));
  return ok(JSON.parse(input));
};
```

### Async Context

In async code, the same principle applies. Never throw when you can return an error:

```typescript
// Bad - throwing in async function
const fetchUser = async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// Good - errors through AsyncResult
const fetchUser = (id: string) =>
  fromPromise(fetch(`/api/users/${id}`))
    .mapErr(e => e.addNotes(`Failed to fetch user ${id}`))
    .map(async (response) => {
      if (!response.ok) return err(new Error(`HTTP ${response.status}`));
      return response.json();
    });
```

### The `fromPromise` Wrapper

`fromPromise` automatically converts thrown exceptions into `PanicError` wrapped in AsyncResult. This means **you should almost never need to throw** in async operations:

```typescript
// The fromPromise wrapper handles exceptions automatically
const result = await fromPromise(riskyOperation())
  .mapErr(e => e.addNotes("Failed here"));
```

### Design for the Rail

When designing functions, think in terms of the rail:

1. **Input → Result**: Validate inputs and return `Result.err()` if invalid
2. **Result → Result**: Transform values with `map`, errors with `mapErr`
3. **Result → Promise**: Use `fromPromise` for operations that might throw
4. **Combine rails**: Use `all`, `allSettled`, `race` to combine multiple rails

```typescript
// Design for the rail - every step returns Result/AsyncResult
const processOrder = (order: Order) =>
  validateOrder(order)
    .map(enrichOrder)
    .mapErr(e => e.addNotes("Validation failed"))
    .flatMap(checkInventory)
    .flatMap(processPayment)
    .map(shipOrder);
```

### Anti-patterns to Avoid

- Do not use `throw` for expected failures (validation, business rules)
- Do not use `raise()` to exit early from a function that returns `Result`
- Do not catch errors and rethrow in functions that could return `Result.err()`
- Do not use try/catch when you can use `fromPromise` + `mapErr`

### Reference

See `packages/core/src/result/` and `packages/core/src/async-result/` for examples of proper rail design.