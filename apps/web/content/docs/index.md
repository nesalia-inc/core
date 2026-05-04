---
title: Quick Start
description: Get started with @deessejs/fp in 5 minutes
icon: Zap
---

This guide will get you up and running with @deessejs/fp in about 5 minutes.

## Your First Result

The `Result` type represents either a success (`Ok`) or a failure (`Err`):

```typescript
import { ok, err, isOk } from '@deessejs/fp';

// Success
const success = ok(42);
// { ok: true, value: 42 }

// Failure
const failure = err('Something went wrong');
// { ok: false, error: 'Something went wrong' }

// Check which one
if (isOk(success)) {
  console.log(success.value); // 42
}
```

## Transform Values

Use `map` to transform the value inside Ok, and `flatMap` to chain operations:

```typescript
import { ok, err, map, flatMap, getOrElse } from '@deessejs/fp';

const divide = (a: number, b: number) =>
  b === 0 ? err('Division by zero') : ok(a / b);

// Transform the value
const doubled = map(ok(10), x => x * 2);
// Ok(20)

// Chain operations
const result = flatMap(ok(10), x => divide(x, 2));
// Ok(5)

const resultWithError = flatMap(ok(10), x => divide(x, 0));
// Err('Division by zero')

// Get the value or a default
const value = getOrElse(result, 0); // 5
const valueOrDefault = getOrElse(resultWithError, 0); // 0
```

## Handle Errors

Use `mapErr` to transform errors and `tapErr` to log them:

```typescript
import { ok, err, mapErr, tapErr } from '@deessejs/fp';

const result = err('original error')
  .mapErr(err => new Error(err)); // Err(Error: 'original error')

// Log without changing
err('error').tapErr(err => console.error(err));
```

## Work with Optional Values

Use `Maybe` instead of `null` or `undefined`:

```typescript
import { some, none, fromNullable, isSome, map, getOrElse } from '@deessejs/fp';

// Create from a nullable value
const user = fromNullable(findUserById(123));

// Transform if present
const upperName = map(user, u => u.name.toUpperCase());

// Get with default
const displayName = getOrElse(upperName, 'Anonymous');
```

## Async Operations

Use `fromPromise` to handle async operations with error tracking:

```typescript
import { fromPromise, isOk, map, flatMap } from '@deessejs/fp';

const fetchUser = (id: number) =>
  fromPromise(
    fetch(`/api/users/${id}`).then(r => r.json())
  );

// Chain async operations
const result = await flatMap(fetchUser(1), user =>
  flatMap(fetchPosts(user.id), posts =>
    ok({ user, posts })
  )
);

if (isOk(result)) {
  console.log(result.value.user.name);
  console.log(result.value.posts.length);
}
```

## Compose Functions

Use `pipe` for readable linear transformations:

```typescript
import { pipe } from '@deessejs/fp';

const result = pipe(
  '  hello world  ',
  s => s.trim(),
  s => s.toUpperCase(),
  s => s.split('').reverse().join('')
);
// 'DLROW OLLEH'
```

## Pattern Matching

Use `match` to handle both cases:

```typescript
import { ok, err, match } from '@deessejs/fp';

const message = match(
  ok(42),
  value => `Success: ${value}`,
  error => `Failed: ${error}`
);
// 'Success: 42'

const message2 = match(
  err('oops'),
  value => `Success: ${value}`,
  error => `Failed: ${error}`
);
// 'Failed: oops'
```

## Next Steps

- **[Result](/docs/core/result)** - Deep dive into Result
- **[Maybe](/docs/core/maybe)** - Handle optional values
- **[Error](/docs/core/error)** - Structured domain errors
- **[Composition](/docs/core/composition)** - pipe, flow, and more
