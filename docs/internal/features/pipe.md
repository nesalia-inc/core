# Pipe / Flow

Pipe and Flow provide fluent composition patterns for chaining operations. They enable linear, top-to-bottom code that avoids deep nesting.

## Why Pipe?

Traditional function composition leads to nested "callback hell":

```typescript
// Problem: Deep nesting, hard to read
const result = validate(
  transform(
    fetchUser(id)
  )
);

// Solution: Linear top-to-bottom flow
import { pipe } from '@deessejs/fp';

const result = pipe(
  id,
  fetchUser,
  transform,
  validate
);
```

With Pipe, your code reads like a recipe - each step transforms the previous result.

---

## Quick Start (Future API)

```typescript
import { pipe, flow, map, flatMap, match } from '@deessejs/fp';

// Using pipe - explicit value
const result = pipe(
  userId,
  findUser,           // Result<User, E>
  map(u => u.email),  // Result<string, E>
  match(
    email => sendEmail(email),
    err => handleError(err)
  )
);

// Using flow - creates a reusable function
const processUser = flow(
  findUser,
  map(u => u.email),
  match(sendEmail, handleError)
);

const result = processUser(userId);
```

---

## API Reference (Future)

### `pipe(value, ...fns)`

Passes a value through a chain of functions from left to right.

```typescript
// Current workaround without pipe
const result = map(findUser(id), u => u.email);

// Future: pipe
const result = pipe(
  id,
  findUser,
  u => map(u, user => user.email)
);
```

### `flow(...fns)`

Creates a new function that is the composition of the provided functions.

```typescript
const processUser = flow(
  findUser,
  validateUser,
  sendWelcomeEmail
);

const result = processUser(userId);
```

---

## Current Workarounds

Since `pipe` and `flow` are not yet implemented, here are workarounds:

### Method Chaining

Most types already support method chaining:

```typescript
import { ok } from '@deessejs/fp';

const result = ok(1)
  .map(x => x * 2)    // Ok(2)
  .map(x => x + 1)    // Ok(3)
  .flatMap(x => x > 10 ? ok(x) : ok(10)) // Ok(10)
  .getOrElse(0);
```

### Custom Pipe Implementation

```typescript
// Simple pipe implementation
const pipe = <T,>(value: T, ...fns: Array<(arg: T) => T>) =>
  fns.reduce((acc, fn) => fn(acc), value);

// Usage
const result = pipe(
  userId,
  findUser,
  validateUser,
  sendWelcome
);
```

### Generic Flow

```typescript
// Creates a composed function
const flow = <T, R>(...fns: Array<(arg: T) => T | R>) =>
  (value: T): R => fns.reduce((acc, fn) => fn(acc), value) as R;

// Usage
const processUser = flow(
  findUser,
  validateUser,
  sendWelcome
);
```

---

## Real-World Examples

### With Result

```typescript
import { ok, err, flatMap, map, getOrElse } from '@deessejs/fp';

// Current approach - method chaining
const result = ok(userId)
  .flatMap(findUser)
  .map(u => u.email)
  .getOrElse('unknown');

// With pipe (future)
const result = pipe(
  userId,
  findUser,
  map(u => u.email),
  getOrElse('unknown')
);
```

### With AsyncResult

```typescript
import { okAsync, mapAsync, flatMapAsync, match } from '@deessejs/fp';

// Current approach
const result = await okAsync(userId)
  .flatMapAsync(fetchUser)
  .mapAsync(u => u.email)
  .match(
    email => sendEmail(email),
    err => handleError(err)
  );
```

---

## Benefits

| Benefit | Description |
|---------|-------------|
| **Readability** | Code flows top-to-bottom, like a recipe |
| **Debuggability** | Easy to trace each transformation step |
| **Reusability** | `flow` creates reusable pipelines |
| **Declarative** | Focus on "what" not "how" |

---

## Comparison with Other Libraries

| Library | pipe | flow | Notes |
|---------|------|------|-------|
| @deessejs/fp | Future | Future | Not yet implemented |
| fp-ts | Yes | Yes | Part of fp-ts/pipeable |
| RxJS | Yes | Yes | In pipeable operators |
| lodash/fp | Yes | Yes | fp module |
| Ramda | Yes | Yes | Always functional |

---

## Related

- [Result](./result.md) - Works with pipe
- [Maybe](./maybe.md) - Works with pipe
- [AsyncResult](./async-result.md) - Works with pipe
