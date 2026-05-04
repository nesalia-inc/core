---
name: type-safety
description: Prefer generics over any or unknown for type safety
paths:
  - "packages/fp/src/**/*.ts"
---

# Type Safety Rules

## Prefer Generics Over `any` or `unknown`

Avoid `any` and `unknown` unless absolutely necessary. Use generics to maintain type safety:

```typescript
// Bad - loses type information
function process(value: any): any { ... }
const fn: (...args: unknown[]) => unknown;

// Good - preserves type information
function process<T>(value: T): T { ... }
function pipe<A, B>(value: A, fn: (v: A) => B): B;
```

## When `unknown` Is Acceptable

- External data (API responses, parsed JSON) before validation
- Type guard predicates where the type is narrowed within the guard
- Union exhaustion checks where all cases must be handled

## When `any` Is Acceptable

- **Never** - `any` defeats TypeScript's purpose. Use `unknown` if type is truly unknown.

## Current Uses

The `pipe.ts` file uses `unknown` for its `AnyFn` type because it's a generic utility that operates on values of any shape. This is a valid exception for foundational generic utilities.

The `async-result/builder.ts` uses `unknown` for error handlers and the `isAbortError` type guard - also valid for catching arbitrary thrown values.

## Error Handling

For errors, use the library's [error system](./error-system.md) - see `error()` builder. Do not use native JS `Error` or `any` type for error arguments.

## Rules

1. Default to generics: `<T>(value: T): T` not `(value: any): any`
2. Use `unknown` for truly unknown external data
3. Never use `any` - it opt-out of type checking
4. If stuck with `unknown`, use type guards or casts to narrow
5. For domain errors, use the library's `error()` builder (see [error-system](./error-system.md))