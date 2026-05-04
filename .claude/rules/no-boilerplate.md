---
name: no-boilerplate
description: Avoid unnecessary boilerplate for side effects - direct execution over .run()
paths:
  - "packages/fp/src/**/*.ts"
---

# No Unnecessary Boilerplate

## Avoid Redundant `.run()` Calls

Don't force users to write unnecessary steps for side effects:

```typescript
// Bad - redundant boilerplate
const result = getUsers().run();

// Good - direct execution
const result = getUsers();
```

## Principle

If a function can execute directly and return a result, it should. Adding `.run()` or similar intermediate steps is ceremony that adds no value.

## When Execution Is Implicit

The library's design favors direct returns:

- `ok(value)` returns the result directly, no `.run()`
- `retryAsync(fn, options)` returns `Promise<T>` directly
- `fromPromise(fn)` returns `AsyncResult<T, E>` directly

## When Explicit Execution Is Needed

If lazy evaluation or explicit control is required, provide clear naming:

```typescript
// Lazy evaluation - explicit
const getUsers = () => Result.fromQuery(db.queryUsers);
const users = getUsers(); // Not executed yet

// Immediate - no .run() needed
const usersResult = queryUsers(); // Executed
```

## Deterministic Design

Favor patterns where:
1. Function call = execution (no lazy delay)
2. Return value = result (no wrapper needed)
3. Side effects happen at call time, not on `.run()`

## Rules

1. No `.run()` suffix for execution - call directly
2. No `.execute()` unless there's a clear lazy/active distinction
3. Factory functions return results, notthunks
4. If lazy is needed, name it explicitly: `createQuery()`, `lazy()`, `defer()`