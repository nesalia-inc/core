# Why @deessejs/fp Instead of fp-ts?

fp-ts is powerful, but most developers only need a fraction of what it offers. This guide shows why @deessejs/fp might be the right choice for your project.

## The Short Answer

| If you want... | Use |
|----------------|-----|
| Full Haskell-style FP with HKT, type classes, Category theory | fp-ts |
| Result/Option/Maybe that just works without learning a new paradigm | @deessejs/fp |
| Comprehensive ecosystem (SQL, CLI, AI, Cluster) | Effect-TS |

## Comparing Complexity

### Creating a Result

**fp-ts (Either):**
```typescript
import { either, of } from 'fp-ts';
import { pipe } from 'fp-ts/function';

const success = of<{ name: string }>({ name: 'John' });

// Or with right/left
import { right, left } from 'fp-ts/Either';
const success = right({ name: 'John' });
const failure = left(new Error('failed'));
```

**@deessejs/fp:**
```typescript
import { ok, err } from '@deessejs/fp';

const success = ok({ name: 'John' });
const failure = err(new Error('failed'));
```

### Mapping

**fp-ts:**
```typescript
import { pipe } from 'fp-ts/function';
import { map as mapEither } from 'fp-ts/Either';
import { map as mapOption } from 'fp-ts/Option';

const result = pipe(
  right({ name: 'John', age: 30 }),
  mapEither(user => user.name.toUpperCase())
);
```

**@deessejs/fp:**
```typescript
const result = ok({ name: 'John', age: 30 })
  .map(user => user.name.toUpperCase());
```

### Async Operations

**fp-ts (TaskEither):**
```typescript
import { taskEither, TaskEither } from 'fp-ts';
import { pipe } from 'fp-ts/function';
import { chain } from 'fp-ts/TaskEither';

const fetchUser = (id: string): TaskEither<Error, User> => {
  return pipe(
    taskEither.of(() => fetch(`/api/users/${id}`)),
    chain(response =>
      response.ok
        ? taskEither.of(() => response.json())
        : taskEither.left(() => new Error(`HTTP ${response.status}`))
    )
  );
};
```

**@deessejs/fp:**
```typescript
import { fromPromise, ok, err } from '@deessejs/fp';

const fetchUser = (id: string) =>
  fromPromise(fetch(`/api/users/${id}`))
    .andThen(async (response) => {
      if (!response.ok) {
        return err(new Error(`HTTP ${response.status}`));
      }
      return ok(await response.json());
    });
```

## Key Differences

| Feature | fp-ts | @deessejs/fp |
|---------|-------|--------------|
| Learning curve | High (HKT, type classes, pipe) | Low (direct methods, optional pipe) |
| Higher Kinded Types | Yes (core design) | No (TypeScript-native) |
| Type inference | Complex | Consistent |
| Bundle size | ~50KB | ~2KB (+ Zod if used) |
| Async support | Task, TaskEither | AsyncResult (thenable) |
| Maybe/Option | Yes | Yes |
| Error validation | No | Yes (Zod) |
| Error enrichment | No | Yes (addNotes, from) |
| ESM support | Ongoing issues | ESM-first |

## When to Choose fp-ts

Choose fp-ts if you:

1. **Are building a library** that needs HKT for maximum flexibility
2. **Are a FP purist** who wants Category theory abstractions
3. **Need Effect ecosystem** (SQL, CLI, AI, Cluster)
4. **Are migrating from Haskell/Scala** and want familiar patterns

Choose @deessejs/fp if you:

1. **Want Results/Options without ceremony** - just import and use
2. **Are adding error handling to an existing TypeScript project** - low friction
3. **Want Zod validation for errors** - unique among both
4. **Value bundle size** - 2KB vs 50KB matters for frontend
5. **Want React 19 compatibility** - fp-ts has ongoing ESM issues

## API Comparison Table

### Result Creation

| Operation | fp-ts | @deessejs/fp |
|-----------|-------|--------------|
| Create success | `right(value)` | `ok(value)` |
| Create failure | `left(error)` | `err(error)` |
| Wrap promise | `tryCatch(() => fn(), onError)` | `fromPromise(fn())` |
| From nullable | N/A (use Option) | `fromNullable(value)` |

### Result Operations

| Operation | fp-ts | @deessejs/fp |
|-----------|-------|--------------|
| Map value | `map(fn)` (requires pipe) | `.map(fn)` |
| Map error | `mapLeft(fn)` | `.mapErr(fn)` |
| Chain | `chain(fn)` (requires pipe) | `.flatMap(fn)` |
| Tap | N/A | `.tap(fn)` |
| Match | `fold(onLeft, onRight)` | `.match({ onSuccess, onError })` |
| Swap | N/A | `.swap()` |
| All (parallel) | `array.sequence(taskEither)` | `all([...])` |

## Migration Example

### Before (fp-ts)

```typescript
import { pipe } from 'fp-ts/function';
import { right, left, map, chain, mapLeft } from 'fp-ts/Either';
import { tryCatch } from 'fp-ts/TaskEither';

interface User {
  id: string;
  name: string;
  email: string;
}

const validateEmail = (email: string): Either<Error, string> => {
  return email.includes('@')
    ? right(email)
    : left(new Error('Invalid email'));
};

const fetchUser = (id: string) =>
  pipe(
    tryCatch<Error, User>(
      () => fetch(`/api/users/${id}`).then(r => r.json()),
      (e) => e instanceof Error ? e : new Error(String(e))
    ),
    chain(user =>
      pipe(
        validateEmail(user.email),
        map(() => user)
      )
    ),
    mapLeft(e => new Error(`Validation failed: ${e.message}`))
  );
```

### After (@deessejs/fp)

```typescript
import { ok, err, fromPromise, flatMap, map, mapErr } from '@deessejs/fp';

interface User {
  id: string;
  name: string;
  email: string;
}

const validateEmail = (email: string) => {
  return email.includes('@')
    ? ok(email)
    : err(new Error('Invalid email'));
};

const fetchUser = (id: string) =>
  fromPromise(fetch(`/api/users/${id}`).then(r => r.json()))
    .flatMap(user =>
      validateEmail(user.email).map(() => user)
    )
    .mapErr(e => new Error(`Validation failed: ${e.message}`));
```

## The Pipe Problem

fp-ts requires `pipe` for most operations:

```typescript
// fp-ts - every operation needs pipe
import { pipe } from 'fp-ts/function';
import { map as mapEither, flatMap as chainEither } from 'fp-ts/Either';

const result = pipe(
  someValue,
  mapEither(x => x * 2),
  chainEither(x => x > 0 ? right(x) : left('negative'))
);
```

@deessejs/fp supports both patterns:

```typescript
// Method chaining (often cleaner)
const result = someValue
  .map(x => x * 2)
  .flatMap(x => x > 0 ? ok(x) : err('negative'));

// Or standalone functions with pipe
import { pipe, map, flatMap } from '@deessejs/fp';

const result = pipe(
  someValue,
  map(x => x * 2),
  flatMap(x => x > 0 ? ok(x) : err('negative'))
);
```

## Bundle Size Reality

| Library | Minified + Gzipped | Notes |
|---------|-------------------|-------|
| fp-ts | ~50KB | Tree-shakeable but rarely used light |
| @deessejs/fp | ~2KB | Without Zod |
| @deessejs/fp + Zod | ~50KB | With optional Zod validation |

If you already use Zod, the incremental cost is minimal.

## fp-ts Future Uncertainty

fp-ts is [merging with Effect-TS](https://github.com/Effect-TS/Effect). This means:

1. **fp-ts is in maintenance mode** - no new features
2. **Effect-TS is the successor** - heavy (~15KB runtime), full ecosystem
3. **Migration path unclear** - Effect API differs from fp-ts

If you're starting a new project or migrating, this is the time to consider alternatives.

## Next Steps

- Read the [Result documentation](../features/result.md)
- Read the [AsyncResult documentation](../features/async-result.md)
- Read the [Maybe documentation](../features/maybe.md)
- Read the [migration from neverthrow](./neverthrow.md)
