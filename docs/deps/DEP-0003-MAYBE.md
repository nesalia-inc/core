---
dep: DEP-0003
title: "Maybe: Option Type for Nullable Values"
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

A `Maybe<T>` type representing a value that may or may not be present (`Some<T>` or `None`). It's the functional alternative to `null` and `undefined`, making absence explicit in types and enabling safe, composable operations on optional values.

## Motivation

TypeScript's `null` and `undefined` are the source of many runtime errors. The Maybe type makes absence a first-class concept: the type system statically guarantees that absence is handled, not hidden.

The design philosophy centers on four principles:

1. **Absence is explicit** — Types tell you when a value may be absent
2. **Maybes are composable** — Work with `map`, `flatMap`, and generator helpers
3. **Maybes are pipeable** — Functions support both data-first and data-last style
4. **Maybes are chainable** — Operations chain naturally without null checks

## Detailed Design

### Factory Functions

No classes exposed to users. Maybes are created via simple factory functions:

```typescript
import { some, none, fromNullable } from '@deessejs/fp';

// Create a present value
const present: Maybe<number> = some(42);
// Maybe<number>

// Create an absent value
const absent: Maybe<number> = none();
// None — singleton instance, always the same object

// Convert nullable to Maybe
fromNullable(42);        // Some(42)
fromNullable(null);      // None
fromNullable(undefined);  // None

// Falsy values are treated as present (not absent)
fromNullable(0);    // Some(0) — NOT None!
fromNullable('');   // Some('') — NOT None!
fromNullable(false); // Some(false) — NOT None!
fromNullable(NaN);   // Some(NaN) — NOT None!

// fromNullable signature
function fromNullable<T>(value: T | null | undefined): Maybe<T>;
```

Note: Only `null` and `undefined` are treated as absent. This is intentional — `0`, `''`, `false`, and `NaN` are valid values that represent meaningful states.

### Type Guards

```typescript
import { isSome, isNone } from '@deessejs/fp';

if (isSome(maybe)) {
  maybe.value  // Fully narrowed to T
}

if (isNone(maybe)) {
  // TypeScript knows it's None
}
```

### Type Guard Signatures

```typescript
// isSome - Type guard for Some
function isSome<T>(maybe: Maybe<T>): maybe is Some<T>;

// isNone - Type guard for None
function isNone<T>(maybe: Maybe<T>): maybe is None;

// Also available as static methods
Maybe.isSome(maybe): maybe is Some<T>
Maybe.isNone(maybe): maybe is None
```

### Exported Types

The `Maybe<T>` type is a tagged union of two concrete variants. Both are exported for explicit use:

```typescript
import { Maybe, Some, None } from '@deessejs/fp';

// Maybe<T> is the union of Some<T> and None
export type Some<T> = Readonly<{ readonly _tag: "Some"; readonly value: T }>;
export type None = Readonly<{ readonly _tag: "None" }>;
export type Maybe<T> = Some<T> | None;
```

**Why export the variants?**

1. **Explicit narrowing** — When using `isSome()` / `isNone()`, TypeScript narrows to `Some<T>` or `None`. Having the types be real makes this explicit rather than implicit.

2. **Exhaustive matching** — Pattern matching and type narrowing work because these are real discriminated types.

3. **Documentation** — Makes it clear that `Maybe<User>` is conceptually `Some<User> | None`, not a mysterious opaque type.

```typescript
// Working with the concrete types directly
const process = (user: Maybe<User>) => {
  if (isSome(user)) {
    // user is Some<User> — TypeScript knows this
    console.log(user.value.name);
  } else {
    // user is None — TypeScript knows this
    console.log('No user');
  }
};

// Maybe<User> === Some<User> | None
type Check = Maybe<User> extends Some<User> | None ? true : false;
// true
```

### Mapping

Transform the value inside a Maybe:

```typescript
const result = some(2).map(x => x * 2);
// Some(4)

const failed = none().map(x => x * 2);
// None
```

Pipeable style:

```typescript
const doubled = Maybe.map(x => x * 2)(some(2));
// Some(4)
```

### Chaining (flatMap)

Chain operations that can return Maybe:

```typescript
interface User {
  id: number;
  name: string;
}

const findUser = (id: number): Maybe<User> =>
  id > 0 ? some({ id, name: 'John' }) : none();

const getEmail = (user: User): Maybe<string> =>
  some(user.name.toLowerCase() + '@example.com');

const email = some(1).flatMap(findUser).flatMap(getEmail);
// Some('john@example.com')

const noEmail = some(-1).flatMap(findUser).flatMap(getEmail);
// None
```

Pipeable style:

```typescript
const email = pipe(
  some(1),
  Maybe.flatMap(findUser),
  Maybe.flatMap(getEmail)
);
```

### Observation (tap)

Execute side effects without changing the value:

```typescript
some(42).tap(value => console.log('Got:', value));
// Logs: "Got: 42"
// Returns: Some(42)

none().tap(value => console.log('Got:', value));
// Nothing logged
// Returns: None
```

Pipeable style:

```typescript
const logged = pipe(
  some(42),
  Maybe.tap(value => console.log('Got:', value))
);
```

### Filtering (filter)

Keep the Maybe only if the predicate passes:

```typescript
const age = some(25);

const adult = age.filter(age => age >= 18);
// Some(25)

const minor = some(15).filter(age => age >= 18);
// None

none().filter(user => user.active);
// None — predicate not called
```

Pipeable style:

```typescript
const adult = pipe(
  some(15),
  Maybe.filter(age => age >= 18)
);
// None
```

### Pattern Matching

```typescript
import { match } from '@deessejs/fp';

const message = match(
  some(42),
  value => `Got: ${value}`,
  () => 'No value'
);
// "Got: 42"

const message2 = match(
  none(),
  value => `Got: ${value}`,
  () => 'No value'
);
// "No value"
```

Can return different types:

```typescript
const value = match(
  none(),
  x => x * 2,  // Some: double the number
  () => -1      // None: return -1
);
// -1
```

### Extraction

```typescript
// getOrElse - Fallback value
const a = some(42).getOrElse(0);  // 42
const b = none().getOrElse(0);    // 0

// getOrCompute - Lazy fallback (for expensive defaults)
const a = some(42).getOrCompute(() => expensiveOperation());  // 42 (expensiveOperation never called)
const b = none().getOrCompute(() => 0);                     // 0 (computed on demand)
```

### Extraction Signatures

```typescript
// getOrElse - Synchronous fallback
function getOrElse<T>(defaultValue: T): (maybe: Maybe<T>) => T;
function getOrElse<T>(this: Maybe<T>, defaultValue: T): T;

// getOrCompute - Lazy synchronous fallback
function getOrCompute<T>(fn: () => T): (maybe: Maybe<T>) => T;
function getOrCompute<T>(this: Maybe<T>, fn: () => T): T;

// getOrElse (static)
Maybe.getOrElse<T>(defaultValue: T): (maybe: Maybe<T>) => T;
Maybe.getOrElse<T>(this: Maybe<T>, defaultValue: T): T;

// getOrCompute (static)
Maybe.getOrCompute<T>(fn: () => T): (maybe: Maybe<T>) => T;
Maybe.getOrCompute<T>(this: Maybe<T>, fn: () => T): T;
```

### Conversions

```typescript
// toNullable
toNullable(some(42));  // 42
toNullable(none());    // null

// toUndefined
toUndefined(some(42));  // 42
toUndefined(none());    // undefined

// toResult - Convert to Result with error for None
const result = some(42).toResult(NotFoundError({ id: '42' }));
// Ok<42>

const noneResult = none().toResult(NotFoundError({ id: 'missing' }));
// Err<NotFoundError>
```

### Conversion Signatures

```typescript
// toNullable - Convert to null
function toNullable<T>(this: Maybe<T>): T | null;

// toUndefined - Convert to undefined
function toUndefined<T>(this: Maybe<T>): T | undefined;

// toResult - Convert to Result with provided error for None
function toResult<T, E>(this: Maybe<T>, error: E): Result<T, E>;
// Some(v) → Ok(v), None → Err(error)

// toNullable (static)
Maybe.toNullable(maybe: Maybe<T>): T | null;

// toUndefined (static)
Maybe.toUndefined(maybe: Maybe<T>): T | undefined;

// toResult (static)
Maybe.toResult<T, E>(maybe: Maybe<T>, error: E): Result<T, E>;
```

### Combination

```typescript
// all - Combine multiple Maybes
const names: Maybe<string>[] = [some('Alice'), some('Bob'), some('Carol')];
const all = Maybe.all(names);
// Some(['Alice', 'Bob', 'Carol'])

// With None present
const mixed: Maybe<string>[] = [some('Alice'), none(), some('Carol')];
const combined = Maybe.all(mixed);
// None

// traverse - Map array to Maybes
const ids = [1, 2, 3];
const users = ids.traverse(id => findUser(id));
// Some<[User, User, User]> if all found

// race - First Some to resolve (for parallel operations)
const first = Maybe.race(some('fast'), some('slow'));
// Some('fast') — first one wins
```

### Combination Signatures

```typescript
// all - Combine array of Maybes (all must be Some)
function all<T>(maybes: Maybe<T>[]): Maybe<T[]>;
// All Some → Some(values), any None → None

// traverse - Map array to Maybes (fail-fast)
function traverse<T, U>(
  items: T[],
  fn: (item: T, index: number) => Maybe<U>
): Maybe<U[]>;
// All Some → Some(mapped), any None → None

// race - First Some to resolve
function race<T>(...maybes: Maybe<T>[]): Maybe<T>;
// First Some wins, all None → None
```

### Pipeable Functions (dual)

All functions support both data-first and data-last styles:

```typescript
import { Maybe, pipe } from '@deessejs/fp';

// Data-first (method style)
const doubled = some(2).map(x => x * 2);

// Data-last (pipeable style)
const doubled = pipe(
  some(2),
  Maybe.map(x => x * 2),
  Maybe.tap(console.log)
);
```

Available pipeable functions:

| Function | Description |
|----------|-------------|
| `Maybe.map(fn)` | Transform the value inside |
| `Maybe.flatMap(fn)` | Chain operations |
| `Maybe.tap(fn)` | Observe value without changing |
| `Maybe.filter(pred)` | Keep Some if predicate passes, else None |
| `Maybe.getOrElse(default)` | Extract or default |
| `Maybe.getOrCompute(fn)` | Extract or compute |
| `Maybe.match({ some, none })` | Pattern match |
| `Maybe.isSome()` | Type guard |
| `Maybe.isNone()` | Type guard |
| `Maybe.all(...maybes)` | Combine all (all must be Some) |
| `Maybe.traverse(items, fn)` | Map array to Maybe results |
| `Maybe.race(...maybes)` | First Some to resolve |
| `Maybe.fromNullable(value)` | Convert nullable |

### Generator Composition

Maybe integrates with generator-based composition patterns:

```typescript
// Using sequence helpers for cleaner chains
const result = pipe(
  some({ userId: '123' }),
  Maybe.flatMap(({ userId }) => findUser(userId)),
  Maybe.filter(user => user.active),
  Maybe.map(user => user.email)
);
```

## Maybe vs Result

Use `Maybe` when a value may or may not exist (no error context). Use `Result` when an operation may succeed or fail (with error context).

| Scenario | Type | Example |
|----------|------|---------|
| Value optional | `Maybe<T>` | `Maybe<User>` - user may not exist |
| Operation can fail | `Result<T, E>` | `Result<User, NotFoundError>` - fetch may fail |
| Validation error | `Result<T, E>` | `Result<User, ValidationError>` - invalid input |
| Network failure | `Result<T, E>` | `Result<Data, NetworkError>` - connection issue |
| Not found | `Maybe<T>` | `findUser(id)` - user not in database |

**Rule of thumb:** Use Maybe for optional values (null/undefined). Use Result for operations that can fail with an error.

## Complete Example

```typescript
import { some, none, fromNullable, match, Maybe, pipe } from '@deessejs/fp';

interface User {
  id: string;
  name: string;
  email?: string;
}

const findUser = (id: string): Maybe<User> =>
  fromNullable(users.find(u => u.id === id));

const findUsersByDomain = (domain: string): Maybe<User[]> =>
  fromNullable(users.filter(u => u.email?.endsWith(`@${domain}`)));

const getEmail = (user: User): Maybe<string> =>
  fromNullable(user.email);

const displayName = (user: Maybe<User>): string => match(
  user,
  u => u.name,
  () => 'Anonymous'
);

const adminEmail = pipe(
  some('admin-123'),
  Maybe.flatMap(findUser),
  Maybe.flatMap(getEmail)
);

const message = match(adminEmail, {
  some: email => `Admin: ${email}`,
  none: () => 'No admin email found'
});
```

## Relationship to Result

`Maybe` and `Result` serve complementary purposes:

- **Maybe<T>** — Represents the absence of a value (no error context)
- **Result<T, E>** — Represents success or failure (with error context)

Convert between them when needs change:

```typescript
// Maybe → Result (when failure becomes an error)
const user = findUser(id).toResult(NotFoundError({ id }));

// Result → Maybe (when you only care about presence/absence)
const maybeUser = result.ok ? some(result.value) : none();
```

See [DEP-0001](./DEP-0001-RESULT.md) for Result details and [DEP-0002](./DEP-0002-ERROR.md) for Error details.

## Open Questions

1. **Generator composition** — `Maybe` does not support generator composition. Unlike `Result.gen`, `Maybe` does not have a generator-based composition pattern. Use `flatMap` chains for sequential operations.

2. **Sequence/traverse API** — `Maybe.traverse` uses fail-fast behavior: if any item produces `None`, the entire traversal returns `None`. To preserve individual results, use `Maybe.all` on individually mapped results.

## References

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — Result type (sister document)
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Error type (sister document)
- [Rust Option](https://doc.rust-lang.org/std/option/)
- [fp-ts Option](https://gcanti.github.io/fp-ts/modules/Option.ts.html)
