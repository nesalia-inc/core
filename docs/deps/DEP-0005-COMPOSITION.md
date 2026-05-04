---
dep: DEP-0005
title: "Composition: pipe, flow, tap, and Observation Utilities"
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

A composition system enabling linear, readable code through `pipe` and `flow`, with observation utilities (`tap`, `tapErr`, `tapBoth`) for logging and debugging without changing values. All functions support both data-first and data-last styles via the `dual()` pattern.

## Motivation

Imperative code with nested function calls is hard to read and debug. The composition system provides:

1. **Linear code flow** — Top-to-bottom reading, like a recipe
2. **Reusable pipelines** — `flow` creates composable function chains
3. **Non-invasive observation** — `tap` family logs without transforming
4. **Pipeable functions** — Both data-first and data-last via dual()
5. **Type-safe composition** — Full TypeScript inference throughout

## Core Concepts

### Type Signatures

```typescript
// pipe passes a value through functions left-to-right
function pipe<A>(value: A): A;
function pipe<A, B>(value: A, f1: (a: A) => B): B;
function pipe<A, B, C>(value: A, f1: (a: A) => B, f2: (b: B) => C): C;
function pipe<A, B, C, D>(value: A, f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D): D;
// ... and so on for more functions

// flow creates a reusable pipeline
function flow<A>(f1: (a: A) => A): (a: A) => A;
function flow<A, B>(f1: (a: A) => B): (a: A) => B;
function flow<A, B, C>(f1: (a: A) => B, f2: (b: B) => C): (a: A) => C;
function flow<A, B, C, D>(f1: (a: A) => B, f2: (b: B) => C, f3: (c: C) => D): (a: A) => D;
// ... and so on for more functions
```

### pipe(value, ...fns)

Passes a value through a chain of functions left to right:

```typescript
import { pipe, Result, Maybe } from '@deessejs/fp';

const result = pipe(
  userId,
  findUser,               // Maybe<User>
  Maybe.filter(user => user.active),
  Maybe.map(user => user.email),
  Maybe.getOrElse('anonymous@example.com')
);
```

### flow(...fns)

Creates a reusable function from composed functions:

```typescript
import { flow, Result, Maybe } from '@deessejs/fp';

const processEmail = flow(
  findUser,
  Maybe.filter(user => user.active),
  Maybe.map(user => user.email),
  Maybe.getOrElse('anonymous@example.com')
);

const email1 = processEmail('user-1');
const email2 = processEmail('user-2');
```

### Relationship Between pipe and flow

`flow` is the curried form of `pipe`:

```typescript
// These are equivalent:
pipe(value, f, g, h);
flow(f, g, h)(value);

// flow is useful when you want to:
// 1. Create a reusable pipeline
// 2. Pass it as a callback
// 3. Compose it with other flows
```

### Short-Circuit Behavior

Pipelines short-circuit on failure. When a Result is `Err` or a Maybe is `None`, subsequent functions in the pipeline are not executed—the failure value passes through directly.

```typescript
// Err short-circuits the pipeline
pipe(
  result,
  Result.map(x => x + 1),    // Not executed if result is Err
  Result.map(x => x * 2),    // Not executed if result is Err
  Result.getOrElse(0)         // Returns the error value
);

// None short-circuits the pipeline
pipe(
  maybeValue,
  Maybe.map(x => x + 1),      // Not executed if maybeValue is None
  Maybe.filter(x => x > 0),   // Not executed if maybeValue is None
  Maybe.getOrElse(0)          // Returns null
);
```

### Edge Cases

| Case | Behavior |
|------|----------|
| `pipe(value)` | Returns `value` unchanged (identity) |
| `flow()` | Returns identity function `x => x` |
| Function throws | Caught and converted to `Err` via `Result.attempt` pattern |

## Observation Utilities (tap family)

The `tap` family executes side effects without changing the value. This enables logging, debugging, and instrumentation without affecting the data flow.

### tap(value, fn)

Observe the Ok/success value without changing it:

```typescript
pipe(
  userId,
  findUser,
  Maybe.tap(user => console.log('Found user:', user.name)),  // Logs, returns Maybe unchanged
  Maybe.map(user => user.email)
);
```

Pipeable style:

```typescript
pipe(
  userId,
  findUser,
  Maybe.tap(user => console.log('Found user:', user.name)),
  Maybe.map(user => user.email)
);
```

### tapErr(value, fn)

Observe the Err/failure value without changing it:

```typescript
pipe(
  userId,
  findUser,
  Result.tapErr(err => console.error('Failed:', err._tag, err)),
  Result.map(user => user.email)
);
```

### tapBoth(value, { ok, err })

Observe both success and failure cases:

```typescript
pipe(
  result,
  Result.tapBoth({
    ok: (value) => console.log('Success:', value),
    err: (error) => console.error('Failed:', error._tag, error)
  }),
  Result.map(value => value.id)
);
```

### tap usage with Maybe

Maybe supports `tap` for observing present values:

```typescript
pipe(
  maybeUser,
  Maybe.tap(user => console.log('User:', user.name)),
  Maybe.map(user => user.email)
);

maybeUser.tap(user => console.log('User:', user.name));
// Returns Maybe<User> unchanged, logs the value
```

## The dual() Pattern

All library functions support both data-first and data-last styles. This is achieved via the `dual()` utility:

```typescript
import { dual, Result, pipe } from '@deessejs/fp';

// dual(arity, fn) creates a function that works both ways:
// - Data-first when called with all arguments: map(result, fn)
// - Data-last when called with partial arguments: map(fn)(result)

const map = dual(2, <A, B, E>(result: Result<A, E>, fn: (a: A) => B) =>
  result.map(fn)
);
```

### Why dual()?

The `arity` parameter tells `dual()` how many arguments the function expects. This determines the behavior:

| Arity | Data-First Call | Data-Last Call |
|-------|-----------------|----------------|
| `dual(2, fn)` | `fn(a, b)` | `fn(a)(b)` |
| `dual(3, fn)` | `fn(a, b, c)` | `fn(a)(b)(c)` |

Traditional functional libraries offer either data-first or data-last, not both:

| Library | Style |
|---------|-------|
| Ramda | Data-last only |
| lodash | Data-first only |
| fp-ts | Data-last only (pipeable) |

The `dual()` pattern provides maximum flexibility:

```typescript
// Composing with pipe (data-last)
const process = pipe(
  some(2),
  Result.map(x => x * 2),
  Result.tap(x => console.log(x)),
  Result.getOrElse(0)
);

// Composing with method chaining (data-first)
const result = some(2)
  .map(x => x * 2)
  .tap(x => console.log(x))
  .getOrElse(0);

// Passing as callback (data-last form)
const double = Result.map(x => x * 2);
```

## Pipeable Functions by Type

### Result Pipeable Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `Result.map(fn)` | `(fn: (a: A) => B) => (result: Result<A, E>) => Result<B, E>` | Transform Ok value |
| `Result.mapErr(fn)` | `(fn: (e: E) => F) => (result: Result<A, E>) => Result<A, F>` | Transform Err value |
| `Result.flatMap(fn)` | `(fn: (a: A) => Result<B, E>) => (result: Result<A, E>) => Result<B, E>` | Chain operation |
| `Result.tap(fn)` | `(fn: (a: A) => void) => (result: Result<A, E>) => Result<A, E>` | Observe Ok |
| `Result.tapErr(fn)` | `(fn: (e: E) => void) => (result: Result<A, E>) => Result<A, E>` | Observe Err |
| `Result.tapBoth({ ok, err })` | `(handlers) => (result) => result` | Observe both |
| `Result.getOrElse(default)` | `(default: A) => (result: Result<A, E>) => A` | Extract or default |
| `Result.getOrCompute(fn)` | `(fn: () => A) => (result: Result<A, E>) => A` | Extract or compute |
| `Result.match({ ok, err })` | `(handlers) => (result) => R` | Pattern match |
| `Result.swap()` | `(result: Result<A, E>) => Result<E, A>` | Swap Ok/Err |
| `Result.isOk()` | `(result: Result<A, E>) => result is Ok<A, E>` | Type guard |
| `Result.isErr()` | `(result: Result<A, E>) => result is Err<A, E>` | Type guard |
| `Result.all(...results)` | `(results: Result<A, E>[]) => Result<A[], E>` | Combine all |
| `Result.race(...results)` | `(results: Result<A, E>[]) => Result<A, E>` | First to resolve |
| `Result.traverse(items, fn)` | `(items: A[], fn: (a: A) => Result<B, E>) => Result<B[], E>` | Map over array |
| `Result.attempt(fn, catch?)` | `(fn: () => T, catch?: (c: unknown) => E) => Result<T, E>` | Wrap sync thrower |
| `Result.attemptAsync(fn, catch?)` | `(fn: () => Promise<T>, catch?: (c: unknown) => E) => Promise<Result<T, E>>` | Wrap async thrower |
| `Result.await(asyncResult)` | `(asyncResult: AsyncResult<A, E>) => Promise<Result<A, E>>` | Yield async in gen |

### Maybe Pipeable Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `Maybe.map(fn)` | `(fn: (a: A) => B) => (maybe: Maybe<A>) => Maybe<B>` | Transform value |
| `Maybe.flatMap(fn)` | `(fn: (a: A) => Maybe<B>) => (maybe: Maybe<A>) => Maybe<B>` | Chain operations |
| `Maybe.tap(fn)` | `(fn: (a: A) => void) => (maybe: Maybe<A>) => Maybe<A>` | Observe value |
| `Maybe.filter(pred)` | `(pred: (a: A) => boolean) => (maybe: Maybe<A>) => Maybe<A>` | Keep if predicate passes |
| `Maybe.getOrElse(default)` | `(default: A) => (maybe: Maybe<A>) => A` | Extract or default |
| `Maybe.getOrCompute(fn)` | `(fn: () => A) => (maybe: Maybe<A>) => A` | Extract or compute |
| `Maybe.match({ some, none })` | `(handlers) => (maybe) => R` | Pattern match |
| `Maybe.isSome()` | `(maybe: Maybe<A>) => maybe is Some<A>` | Type guard |
| `Maybe.isNone()` | `(maybe: Maybe<A>) => maybe is None` | Type guard |
| `Maybe.all(...maybes)` | `(maybes: Maybe<A>[]) => Maybe<A[]>` | Combine all |
| `Maybe.traverse(items, fn)` | `(items: A[], fn: (a: A) => Maybe<B>) => Maybe<B[]>` | Map over array |
| `Maybe.race(...maybes)` | `(maybes: Maybe<A>[]) => Maybe<A>` | First Some to resolve |
| `Maybe.fromNullable(value)` | `(value: A | null | undefined) => Maybe<A>` | Convert nullable |

## Complete Example

```typescript
import { pipe, flow, Result, Maybe } from '@deessejs/fp';

// Using flow to create a reusable pipeline
const processUserEmail = flow(
  findUser,
  Maybe.filter(user => user.active),
  Maybe.map(user => user.email),
  Maybe.getOrElse('anonymous@example.com')
);

// Using pipe for one-off processing
const userEmail = pipe(
  userId,
  findUser,
  Maybe.tap(user => console.log('Found:', user.name)),
  Maybe.filter(user => user.active),
  Maybe.map(user => user.email),
  Maybe.getOrElse('anonymous@example.com')
);

// Combining Result operations with tap
const fetchAndProcess = flow(
  fetchUser,
  Result.tapErr(err => logger.error('Fetch failed:', err)),
  Result.tap(user => metrics.increment('user.fetch.success')),
  Result.map(user => ({ ...user, processedAt: Date.now() }))
);

// Using tapBoth for symmetric logging
pipe(
  result,
  Result.tapBoth({
    ok: (value) => audit.log('success', value),
    err: (error) => audit.log('error', { tag: error._tag, message: error.message })
  }),
  Result.map(value => process(value))
);
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Readability** | Code reads top-to-bottom, like a recipe |
| **Debuggability** | Easy to trace each transformation step with tap |
| **Reusability** | `flow` creates reusable pipelines |
| **Flexibility** | Both data-first and data-last via dual() |
| **Declarative** | Focus on "what" not "how" |

## Relationship to Other DEPs

The composition utilities work with all types defined in other DEPs:

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — `Result.map`, `Result.flatMap`, `Result.tap`, etc.
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Errors work with `Result.tapErr`, `Result.tapBoth`
- [DEP-0003-MAYBE](./DEP-0003-MAYBE.md) — `Maybe.map`, `Maybe.flatMap`, `Maybe.tap`, etc.
- [DEP-0004-TRY](./DEP-0004-TRY.md) — `Result.attempt` uses composition pattern

## Open Questions

1. **`flow` type inference** — Complex flows with mixed types (Result → Maybe → value) may require explicit type annotations. TypeScript's inference handles most cases, but very complex pipelines benefit from explicit type annotations on the first function's output.

2. **Async composition** — Async functions in pipelines are not currently specified. When async support is needed, a separate DEP will be created to define the behavior (detecting Promise returns, automatic awaiting, error propagation).

3. **`tap` return value** — `tap` returns the original Maybe/Result unchanged. This is intentional—tap is for observation only, not transformation.

## References

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — Result type
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Error type
- [DEP-0003-MAYBE](./DEP-0003-MAYBE.md) — Maybe type
- [DEP-0004-TRY](./DEP-0004-TRY.md) — Try pattern
- [fp-ts pipeable](https://gcanti.github.io/fp-ts/modules/Pipeable.ts.html)
- [Ramda compose](https://ramdajs.com/docs/#compose)
