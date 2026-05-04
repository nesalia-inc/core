# Analysis Report: better-result vs @deessejs/fp

## 1. Overview of better-result Architecture

**better-result** is a lightweight TypeScript Result type library (v2.9.1) with approximately 2,000 lines of source code. It provides functional error handling via a discriminated union `Result<T, E> = Ok<T, E> | Err<T, E>` with generator-based composition.

### Core Architecture Components

| File | Purpose |
|------|---------|
| `src/core.ts` | Ok/Err classes, Result type, factory functions (ok, err, isOk, isError), Panic class |
| `src/result.ts` | Result namespace with static combinators (try, tryPromise, map, andThen, gen, etc.) |
| `src/error.ts` | TaggedError factory, UnhandledException, ResultDeserializationError, matchError functions |
| `src/dual.ts` | Arity-based data-first/data-last function helper |

### Key Design Decisions

1. **Class-based Ok/Err with Phantom Types**: Both `Ok<A, E>` and `Err<T, E>` carry the "other" variant's type as phantom, enabling proper type inference in generator composition.

2. **TaggedError Factory Pattern**: Creates discriminated error classes with `_tag` property and static `is()` type guard method.

3. **Panic as Distinct Error Category**: Separates programmer defects (thrown callbacks) from recoverable domain errors. Panic is thrown, not returned.

4. **Generator-based Composition (Result.gen)**: Enables railway-oriented programming with `yield*` syntax, automatically collecting error union types.

5. **dual() Utility**: Creates functions that work both data-first and data-last (pipeable).

6. **UnhandledException Wrapper**: Wraps uncaught exceptions from `Result.try()` callbacks, preserving original error via `.cause`.

7. **Result.try/tryPromise with Retry**: Built-in retry with exponential backoff and conditional retry via `shouldRetry` predicate.

8. **Serialization Support**: `Result.serialize`/`Result.deserialize` for RPC patterns with typed error boundaries.

---

## 2. Key Patterns and Design Decisions in better-result

### 2.1 Phantom Type Pattern

```typescript
export class Ok<A, E = never> {
  readonly status = "ok" as const;
  constructor(readonly value: A) {}
  // E is phantom - not used at runtime but carries type info
}

export class Err<T, E> {
  readonly status = "error" as const;
  constructor(readonly error: E) {}
  // T is phantom - not used at runtime but carries type info
}

export type Result<T, E> = Ok<T, E> | Err<T, E>;
```

The dual-phantom approach allows TypeScript to properly infer error unions in generator composition. When yielding `Err<never, A>` and `Err<never, B>`, the union becomes `A | B`.

### 2.2 TaggedError Factory

```typescript
export const TaggedError: {
  <Tag extends string>(tag: Tag): <Props extends Record<string, unknown> = {}>() => TaggedErrorClass<Tag, Props>;
  is(value: unknown): value is AnyTaggedError;
} = Object.assign(
  <Tag extends string>(tag: Tag) =>
    <Props extends Record<string, unknown> = {}>(): TaggedErrorClass<Tag, Props> => {
      class Base extends Error {
        readonly _tag: Tag = tag;
        static is(value: unknown): value is Base { return value instanceof Base; }
        constructor(args?: Props) {
          super();
          Object.assign(this, args);
        }
        *[Symbol.iterator](): Generator<Err<never, this>, never, unknown> {
          yield* err(this);
        }
      }
      return Base as unknown as TaggedErrorClass<Tag, Props>;
    },
  { is: isAnyTaggedError }
);
```

Key features:
- Factory function returns class constructor
- Each error class has `_tag` discriminator and static `is()` method
- Implements `[Symbol.iterator]` to be yieldable in Result.gen
- Static `is()` on class enables type-narrowed equality checks

### 2.3 Panic (Unrecoverable Error)

```typescript
export class Panic extends Error {
  readonly _tag = "Panic" as const;
  static is(value: unknown): value is Panic { return value instanceof Panic; }
  constructor(args: { message: string; cause?: unknown }) {
    super(args.message, args.cause ? { cause: args.cause } : undefined);
    Object.assign(this, args);
  }
}

export const panic = (message: string, cause?: unknown): never => {
  throw new Panic({ message, cause });
};
```

Panic represents programmer defects (thrown callbacks), not recoverable domain errors. This distinction is critical:
- `Result.try()` catches exceptions and returns `Err<UnhandledException>`
- If a user callback throws during map/andThen/tap/etc., that throws `Panic`
- This prevents type pollution: `Result<T, E>` stays `Result<T, E | unknown>` only if we panic on callback throws

### 2.4 Generator Composition (Result.gen)

```typescript
const gen: {
  <Yield extends Err<never, unknown>, R extends AnyResult>(
    body: () => Generator<Yield, R, unknown>,
  ): Result<InferOk<R>, InferYieldErr<Yield> | InferErr<R>>;
} = (body) => {
  const iterator = body();
  let state = iterator.next();
  if (!state.done) {
    try { iterator.return?.(undefined as unknown as R); }
    catch (cause) { throw panic("generator cleanup threw", cause); }
  }
  return state.value;
};
```

The generator protocol enables:
- `yield* result` unwraps Ok or short-circuits on Err
- Multiple yields collect error unions via `InferYieldErr<Yield>`
- Cleanup (finally blocks) runs via `iterator.return()`

### 2.5 dual() Utility

```typescript
export function dual<DataLast extends (...args: Array<any>) => any, DataFirst extends (...args: Array<any>) => any>(
  arity: Parameters<DataFirst>["length"],
  body: DataFirst
): DataLast & DataFirst {
  if (arity === 2) {
    return ((...args: Array<any>) => {
      if (args.length >= 2) return body(args[0], args[1]);
      return (self: any) => body(self, args[0]);
    }) as DataLast & DataFirst;
  }
  // ... handles arity 3, 4, and generic
}
```

Enables functions to work in both styles:
```typescript
Result.map(result, fn)  // data-first
Result.map(fn)(result)  // data-last (pipeable)
```

### 2.6 Retry with Conditional Backoff

```typescript
const tryPromise: {
  <A, E>(options: { try: () => Promise<A>; catch: (cause: unknown) => E }, config?: RetryConfig<E>): Promise<Result<A, E>>;
} = async (options, config) => {
  const getDelay = (attempt: number): number => {
    switch (config.retry.backoff) {
      case "exponential": return delayMs * 2 ** attempt;
      case "linear": return delayMs * (attempt + 1);
      case "constant": return delayMs;
    }
  };
  // ... implementation with shouldRetry predicate
};
```

Supports conditional retry based on error type via `shouldRetry: (e: E) => boolean`.

---

## 3. Comparison with @deessejs/fp Modules

### 3.1 Result Module (`packages/fp/src/result`)

**Current Implementation:**
- Plain object literals created by `createOk()`/`createErr()` factory functions
- No class-based implementation, no phantom types
- Methods: map, flatMap, mapErr, getOrElse, tap, tapErr, match, unwrap, swap, all, traverse

**vs better-result:**
| Aspect | better-result | @deessejs/fp |
|--------|---------------|--------------|
| Type definition | Class `Ok<A, E>`, `Err<T, E>` | Type alias `{ ok: true, value: T, ... }` |
| Phantom types | Yes, dual phantom | No |
| Generator composition | Result.gen with yield* | Not implemented |
| Panic on callback throw | Yes | No (errors are returned) |
| dual() pipeable functions | Yes | No (data-first only) |
| Error transformation | mapError method | mapErr function |
| try/tryPromise | Result.try, Result.tryPromise | Not in Result module (in Try) |

**What could be borrowed:**

1. **Phantom types for better error union inference** - The dual-phantom pattern would enable proper error union type inference in composed operations.

2. **Panic concept** - Distinguishing between recoverable domain errors and programmer defects (callback throws) would improve type safety.

3. **Result.gen generator composition** - This is a major missing feature that enables clean sequential composition with automatic error union collection.

4. **dual() pipeable functions** - `map`, `mapErr`, `tap`, `tapErr` etc. could support both calling conventions.

### 3.2 AsyncResult Module (`packages/fp/src/async-result`)

**Current Implementation:**
- Thenable wrapper that resolves to `AsyncResultInner<T, E> = AsyncOk<T> | AsyncErr<E>`
- Methods: map, flatMap, mapErr, tap, tapErr, match, getOrElse, unwrap, etc.
- Factory: ok, err, fromPromise, fromPromiseWithOptions, withSignal
- Combinators: race, all, allSettled, traverse

**vs better-result:**
| Aspect | better-result | @deessejs/fp |
|--------|---------------|--------------|
| Async pattern | Result.gen with Result.await (generators) | Thenable (Promise-based) |
| Async error handling | tryPromise with retry | fromPromise with PanicError |
| Error type | UnhandledException wraps caught errors | PanicError wraps native errors |
| Conditional retry | shouldRetry predicate | Not implemented |
| AbortSignal | Not in core | withSignal combinator |

**What could be borrowed:**

1. **Result.gen async support with Result.await** - Instead of just Thenable, async generator support would provide cleaner async composition.

2. **Conditional retry with shouldRetry** - The predicate-based retry is missing.

3. **Better error typing** - Using a distinct `UnhandledException` instead of generic `PanicError` for uncaught exceptions.

4. **tapBoth for symmetric observation** - `tapBoth` and `tapBothAsync` for observing both success and failure paths.

### 3.3 Try Module (`packages/fp/src/try`)

**Current Implementation:**
- Deprecated module - now redirects to Result and AsyncResult
- Exports only `attempt()` and `attemptAsync()` which return Result/AsyncResult
- Maps to: `ok(fn())` or `okAsync(null).then(() => ok(await fn()))`

**vs better-result:**
| Aspect | better-result | @deessejs/fp |
|--------|---------------|--------------|
| Error on throw | UnhandledException | generic Error cast to FpError |
| Custom catch handler | Result.try({ try, catch }) | attempt(fn, onError) |
| Retry support | tryPromise with retry config | Not in Try |
| Panic on catch handler throw | Yes | No |

**What could be borrowed:**

1. **Custom catch handler that can transform error type** - better-result's `{ try, catch }` pattern is more ergonomic.

2. **Panic on catch handler throw** - If the user's catch handler throws, that's a defect and should panic.

3. **Retry with exponential backoff** - The retry configuration (times, delay, backoff, shouldRetry) is a well-designed API.

---

## 4. Specific Recommendations for Each Module

### 4.1 Result Module Recommendations

**High Priority:**

1. **Add Result.gen for generator composition**
   ```typescript
   // Target API
   const result = Result.gen(function* () {
     const user = yield* getUser(id);    // Err short-circuits
     const posts = yield* getPosts(user.id);
     return Result.ok({ user, posts });
   });
   // Result<{ user: User, posts: Post[] }, UserError | PostsError>
   ```

2. **Add dual() utility and make functions pipeable**
   ```typescript
   const map = dual(2, <A, B, E>(result: Result<A, E>, fn: (a: A) => B) => result.map(fn));

   // Usage
   const piped = pipe(result, Result.map(fn), Result.tap(console.log));
   ```

3. **Consider Panic on callback throws**
   - Add `tryOrPanic` wrapper for map/andThen/tap callbacks
   - This keeps `Result<T, E>` type clean and prevents `E | unknown`

**Medium Priority:**

4. **Add unwrapOr with lazy fallback** (already exists as getOrCompute)

5. **Add partition utility**
   ```typescript
   const [oks, errs] = Result.partition([ok(1), err("a"), ok(2)]);
   // [1, 2], ["a"]
   ```

### 4.2 AsyncResult Module Recommendations

**High Priority:**

1. **Add Result.gen async support with Result.await**
   ```typescript
   const result = await Result.gen(async function* () {
     const user = yield* Result.await(fetchUser(id));
     const posts = yield* Result.await(fetchPosts(user.id));
     return Result.ok({ user, posts });
   });
   ```

2. **Add retry with conditional shouldRetry**
   ```typescript
   const result = await AsyncResult.tryPromise(
     () => fetch(url),
     { retry: { times: 3, delayMs: 100, backoff: "exponential", shouldRetry: (e) => e._tag === "NetworkError" } }
   );
   ```

3. **Add tapBoth and tapBothAsync**
   ```typescript
   result.tapBoth({
     ok: (value) => log("success", value),
     err: (error) => log("error", error)
   });
   ```

**Medium Priority:**

4. **Distinguish UnhandledException from Panic** - Currently both use PanicError; separate them.

### 4.3 Try Module Recommendations

**High Priority:**

1. **Implement proper try/tryPromise with catch handler**
   ```typescript
   const result = Result.try({
     try: () => JSON.parse(input),
     catch: (e) => new ParseError(e)
   });
   ```

2. **Panic when catch handler throws**
   - If the user's catch transformation throws, that's a Panic

3. **Add retry support to tryPromise**
   ```typescript
   Result.tryPromise(
     () => riskyOperation(),
     { retry: { times: 3, delayMs: 100, backoff: "exponential" } }
   );
   ```

---

## 5. Potential Issues and Concerns

### 5.1 Architectural Mismatch: Error Systems

**better-result** uses `TaggedError` factory pattern which creates class-like error types with:
- `_tag` discriminator property
- Static `is()` type guard method
- Implements `[Symbol.iterator]` for generator composition

**@deessejs/fp** uses `error()` builder pattern which creates plain objects with:
- `name`, `args`, `notes`, `cause`, `message`, `stack`
- `addNotes()` and `from()` enrichment methods
- Zod validation support

**Concern:** These are fundamentally incompatible. Borrowing the `_tag` pattern would require either:
- Adding `_tag` to the existing error system (breaking change)
- Creating a parallel TaggedError system (increases complexity)

### 5.2 Panic Concept May Be Overkill

better-result's Panic is thrown (not returned) when user callbacks throw. This is a Rust-inspired pattern that cleanly separates:
- Recoverable domain errors (Err returned)
- Unrecoverable defects (Panic thrown)

**Concern:** @deessejs/fp currently catches exceptions and returns them as errors in Result. This keeps everything in the `Result` type but pollutes the error type with `unknown`. The Panic approach is cleaner but requires users to handle thrown exceptions.

### 5.3 AsyncResult Thenable vs Generator Pattern

AsyncResult is currently a Thenable (Promise-like) wrapper. better-result uses generators with `Result.await`.

**Concern:** Mixing these patterns would be confusing. If AsyncResult adopted generator composition, it would need to support both patterns or deprecate Thenable.

### 5.4 Backward Compatibility Risk

Many of these improvements involve breaking changes:
- Adding Panic would change behavior on callback throws
- Adding Result.gen would be new functionality
- Changing error types would break existing code

**Recommendation:** Consider these as part of a major version bump (v5.0.0 per the recent API redesign mentioned in git log).

### 5.5 Test Coverage Consideration

better-result has ~1600 lines of tests for core functionality and ~250 lines for error tests. The tests include:
- Functor/Monad law verification
- Type inference compile-time tests
- Generator composition tests
- Exhaustive matching tests

@deessejs/fp should ensure any borrowed patterns have equivalent test coverage.

---

## 6. Summary of Borrowing Priority

| Feature | Priority | Complexity | Risk |
|---------|----------|------------|------|
| Result.gen (generator composition) | High | High | Medium |
| dual() pipeable functions | High | Low | Low |
| UnhandledException distinct from Panic | Medium | Medium | Medium |
| tapBoth/tapBothAsync | Medium | Low | Low |
| Retry with shouldRetry | Medium | Medium | Low |
| TaggedError pattern | Low | High | High |
| Panic concept | Low | Medium | Medium |

The most valuable and lowest-risk improvements are:
1. **Result.gen** - enables cleaner sequential composition
2. **dual() functions** - improves ergonomics with pipeable API
3. **tapBoth variants** - symmetric observation of both branches
4. **Conditional retry** - missing piece in async error handling

The most architecturally significant but risky change would be adopting the TaggedError pattern, which would require fundamental changes to the existing error system.

---

## 7. Files Analyzed

**better-result source:**
- `temp/better-result/src/index.ts`
- `temp/better-result/src/result.ts`
- `temp/better-result/src/error.ts`
- `temp/better-result/src/core.ts`
- `temp/better-result/src/dual.ts`
- `temp/better-result/src/result.test.ts`
- `temp/better-result/src/error.test.ts`
- `temp/better-result/AGENTS.md`
- `temp/better-result/package.json`

**@deessejs/fp source:**
- `packages/fp/src/result/index.ts`
- `packages/fp/src/result/types.ts`
- `packages/fp/src/result/builder.ts`
- `packages/fp/src/async-result/index.ts`
- `packages/fp/src/async-result/types.ts`
- `packages/fp/src/async-result/builder.ts`
- `packages/fp/src/try/index.ts`
- `packages/fp/src/try/types.ts`
- `packages/fp/src/try/builder.ts`
- `packages/fp/src/error/index.ts`
- `packages/fp/src/error/types.ts`
- `packages/fp/src/error/builder.ts`