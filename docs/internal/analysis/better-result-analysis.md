# better-result Analysis for @deessejs/fp

**Date:** 2026-04-08
**Source:** [npm: better-result](https://www.npmjs.com/package/better-result), [GitHub: dmmulroy/better-result](https://github.com/dmmulroy/better-result)
**Version Analyzed:** 2.8.1

---

## 1. What is better-result?

**Description:** A lightweight TypeScript Result type library with generator-based composition for safer error handling. It provides a Rust-like `Result<A, E>` discriminated union with `Ok` and `Err` variants.

**Purpose:** Provides type-safe error handling without exceptions, featuring generator-based composition that allows chaining multiple Results without nested callbacks.

**Key Metrics:**
- **Version:** 2.8.1
- **License:** MIT
- **Dependencies:** None (zero runtime dependencies)
- **Type:** ES Module
- **Repository:** https://github.com/dmmulroy/better-result

---

## 2. API Design Analysis

### 2.1 Core Types

better-result uses **class-based** architecture:

```typescript
// Ok class - success variant
class Ok<A, E = never> {
  readonly status = "ok" as const;
  constructor(readonly value: A) {}

  isOk(): this is Ok<A, E> { return true; }
  isErr(): this is Err<A, E> { return false; }
  map<B>(fn: (a: A) => B): Ok<B, E> { ... }
  andThen<B, E2>(fn: (a: A) => Result<B, E2>): Result<B, E | E2> { ... }
  tap(fn: (a: A) => void): Ok<A, E> { ... }
  tapError(_fn: (e: never) => void): Ok<A, E> { return this; }
  *[Symbol.iterator](): Generator<Err<never, E>, A, unknown> { return this.value; }
}

// Err class - error variant
class Err<T, E> {
  readonly status = "error" as const;
  constructor(readonly error: E) {}
  // ...
}
```

@deessejs/fp uses **functional object-based** architecture:

```typescript
// Ok as frozen object type
export type Ok<T, E extends Error = Error> = {
  readonly ok: true;
  readonly value: T;
  isOk(): true;
  isErr(): false;
  map<U>(fn: (value: T) => U): Ok<U, E>;
  // ...
};

// Created via factory function (not class)
const createOk = <T, E extends Error = Error>(value: T): Ok<T, E> => {
  const self: Ok<T, E> = {
    ok: true as const,
    value,
    // methods
  };
  return Object.freeze(self);
};
```

### 2.2 Result Creation

| Feature | better-result | @deessejs/fp |
|---------|--------------|--------------|
| Success | `Result.ok(value)` | `ok(value)` |
| Error | `Result.err(error)` | `err(error)` |
| Try sync | `Result.try(() => risky())` | No direct equivalent |
| Try async | `Result.tryPromise(async () => fetch(url), { retry: {...} })` | `fromPromise(fetch(url))` via AsyncResult |

### 2.3 Transformation Methods

Both libraries provide similar transformation methods, but with different naming:

| better-result | @deessejs/fp | Notes |
|--------------|--------------|-------|
| `.map(fn)` | `.map(fn)` | Same |
| `.andThen(fn)` | `.flatMap(fn)` | Different names |
| `.mapError(fn)` | `.mapErr(fn)` | Different names |
| `.tryRecover(fn)` | No equivalent | better-result only |
| `.tap(fn)` | `.tap(fn)` | Same |
| `.tapError(fn)` | `.tapErr(fn)` | Same |
| `.tapBoth({ ok, err })` | No equivalent | better-result has unified handler |
| `.match({ ok, err })` | `.match(ok, err)` | Different syntax |

### 2.4 Async Variants

better-result provides async variants for almost every method:

```typescript
// Async variants in better-result
.andThenAsync(fn)     // async chain
.tapAsync(fn)         // async side effect
.tapErrorAsync(fn)    // async error side effect
.tapBothAsync({})     // async both
.tryRecoverAsync(fn)  // async recovery
```

@deessejs/fp provides async handling through `AsyncResult` with Thenable pattern:

```typescript
// AsyncResult in @deessejs/fp
.flatMapAsync(fn)     // via AsyncResult
.fromPromise(fn)      // wraps Promise
.toPromise()          // converts to Promise
```

### 2.5 Pattern Matching

**better-result** uses object-based pattern matching:

```typescript
// Exhaustive match on Result
result.match({
  ok: (value) => `Got ${value}`,
  err: (error) => `Error: ${error.message}`
});

// Exhaustive match on TaggedError union
matchError(err, {
  NotFoundError: (e) => `Missing: ${e.id}`,
  ValidationError: (e) => `Invalid: ${e.field}`,
});

// Partial match with fallback
matchErrorPartial(err, {
  NotFoundError: (e) => `Missing: ${e.id}`,
}, (e) => `Unknown: ${e.message}`);
```

**@deessejs/fp** uses function-based pattern matching:

```typescript
// Pattern match on Result
match(result,
  (value) => `Got ${value}`,
  (error) => `Error: ${error.message}`
);
```

### 2.6 Generator Composition (Unique to better-result)

This is the most distinctive feature of better-result:

```typescript
const result = Result.gen(function* () {
  const a = yield* parseNumber(inputA);
  const b = yield* parseNumber(inputB);
  const c = yield* divide(a, b);
  return Result.ok(c);
});
```

Errors from all yielded Results automatically collect into a union type. This is similar to Rust's `?` operator but using generators instead of special syntax.

**@deessejs/fp** achieves similar results via functional composition with `pipe`:

```typescript
const result = pipe(
  inputA,
  parseNumber,
  flatMap((a) => pipe(
    inputB,
    parseNumber,
    map((b) => divide(a, b))
  ))
);
```

Or via AsyncResult's await pattern:

```typescript
const result = await fromPromise(fetchUser(id))
  .map(user => processUser(user))
  .mapErr(e => e.addNotes("Failed to fetch user"));
```

---

## 3. Unique Features in better-result

### 3.1 Generator-Based Composition (`Result.gen`)

Allows sequential operations without nested callbacks:

```typescript
const result = Result.gen(function* () {
  const user = yield* findUser(id);
  const permissions = yield* getPermissions(user.id);
  return Result.ok({ user, permissions });
});
```

**Type inference automatically collects error types from all yielded Results.**

### 3.2 TaggedError Factory

Creates typed error classes with discriminated unions:

```typescript
const NotFoundError = TaggedError("NotFoundError")<{
  id: string;
}>();

const ValidationError = TaggedError("ValidationError")<{
  field: string;
  message: string;
}>();

// Usage
const err = new NotFoundError({ id: "123" });
err._tag    // "NotFoundError"
err.id      // "123"

// Pattern matching with exhaustiveness
matchError(apiError, {
  NotFoundError: (e) => `Missing: ${e.id}`,
  ValidationError: (e) => `Invalid ${e.field}: ${e.message}`,
});
```

### 3.3 Built-in Retry in `tryPromise`

```typescript
await Result.tryPromise(() => fetch(url), {
  retry: {
    times: 3,
    delayMs: 100,
    backoff: "exponential",
    shouldRetry: (e) => e._tag === "NetworkError"
  }
});
```

### 3.4 Serialization for RPC/Storage

```typescript
// Serialize to plain object
const serialized = Result.serialize(result);
// { status: "ok", value: ... } or { status: "error", error: ... }

// Deserialize back
const result = Result.deserialize(serialized);
```

### 3.5 `tapBoth` - Unified Side Effects

```typescript
result.tapBoth({
  ok: (v) => console.log("Success:", v),
  err: (e) => console.error("Failed:", e),
});
```

### 3.6 Panic Handling

```typescript
// Panic thrown when callbacks throw inside Result operations
Result.ok(1).map(() => { throw new Error("oops"); });  // Panic!

// Represents unrecoverable code defects, not domain errors
```

### 3.7 AI Agent Skills

better-result includes portable `SKILL.md` files:
- `better-result-adopt` - migrate existing codebases
- `better-result-migrate-v2` - update from v1 API

These are installable via `npx skills add dmmulroy/better-result@better-result-adopt`.

---

## 4. What better-result Does Better

### 4.1 Generator Composition

The `Result.gen()` pattern is more readable for sequential operations than function composition:

```typescript
// better-result - clearer intent
const result = Result.gen(function* () {
  const user = yield* findUser(id);
  const profile = yield* getProfile(user.id);
  const settings = yield* getSettings(profile.id);
  return Result.ok({ user, profile, settings });
});
```

vs @deessejs/fp's nested flatMap/map approach or lengthy pipe chains.

### 4.2 Error Type Union Inference

better-result's generator composition automatically collects error types:

```typescript
const result = Result.gen(function* () {
  const a = yield* parseNumber(inputA);  // Err<ParseError>
  const b = yield* parseNumber(inputB);  // Err<ParseError>
  return Result.ok(a + b);
});
// Result<number, ParseError | SomeOtherError>
```

### 4.3 Exhaustive Pattern Matching on Tagged Errors

```typescript
// TypeScript enforces all tags are handled
matchError(err, {
  NotFoundError: (e) => handleNotFound(e),
  ValidationError: (e) => handleValidation(e),
  // Error: Compilation error if any tag is missing!
});
```

### 4.4 Simpler API Surface

With classes, method chaining is natural and discoverable:

```typescript
Result.ok(1)
  .map(x => x + 1)
  .andThen(x => Result.ok(x * 2))
  .tap(value => console.log(value))
  .unwrap();
```

vs @deessejs/fp's standalone functions that require pipe or repeated parameter passing.

### 4.5 Zero Dependencies

better-result has zero production dependencies. @deessejs/fp depends on `zod`.

---

## 5. What @deessejs/fp Does Better

### 5.1 Functional Style Architecture

@deessejs/fp follows functional programming principles (no classes, no `this`):

```typescript
// @deessejs/fp - functional
import { map, flatMap, tap } from "@deessejs/fp";

const result = pipe(
  input,
  parse,
  flatMap(validate),
  map(transform),
  tap(log)
);
```

**better-result uses classes** which violates some functional programming principles.

### 5.2 Error Enrichment System

```typescript
// @deessejs/fp - rich error enrichment
const SizeError = error({
  name: "SizeError",
  schema: z.object({ current: z.number(), wanted: z.number() }),
  message: (args) => `"${args.field}" is invalid`,
});

result
  .mapErr(e => e.addNotes("Failed to process order"))
  .mapErr(e => e.from(underlyingError));
```

better-result has no equivalent enrichment - errors are plain.

### 5.3 Zod Schema Validation for Errors

```typescript
// @deessejs/fp - error args validated with Zod
const ValidationError = error({
  name: "ValidationError",
  schema: z.object({
    field: z.string(),
    message: z.string(),
  }),
  message: (args) => `"${args.field}": ${args.message}`,
});
```

### 5.4 Thenable Pattern for AsyncResult

@deessejs/fp's AsyncResult implements the Thenable interface, allowing direct `await`:

```typescript
// @deessejs/fp - natural await usage
const user = await fromPromise(fetchUser(id))
  .map(processUser)
  .mapErr(e => e.addNotes("Failed"));

// better-result requires .then() callbacks or async gen
const user = await Result.tryPromise(() => fetchUser(id))
  .then(result => result.map(processUser));
```

### 5.5 Comprehensive Error Group Handling

```typescript
// @deessejs/fp - error groups
const groupError = exceptionGroup("ValidationErrors", [
  SizeError({ field: "email" }),
  FormatError({ field: "phone" }),
]);
```

### 5.6 Broader Type Spectrum

@deessejs/fp provides more types:
- `Result` - sync error handling
- `AsyncResult` - async error handling
- `Maybe` - nullable value handling (with non-null invariant)
- `Try` - caught exception handling
- `Error` - structured domain errors

### 5.7 `raise()` for Controlled Rail-Breaking

```typescript
// @deessejs/fp - controlled raise for invariants
if (!config.requiredField) {
  raise(new Error("Required field missing - this is a bug"));
}
```

### 5.8 Sleep Utilities

```typescript
// @deessejs/fp - built-in sleep with abort
await sleep(1000);
await sleepWithSignal(1000, abortSignal);
await withTimeout(task, 5000);
```

---

## 6. Specific Ideas/Features to Potentially Incorporate

### 6.1 Generator-Based Composition (High Priority)

The `Result.gen()` pattern provides cleaner syntax for sequential operations. Consider adding:

```typescript
// Conceptual addition to @deessejs/fp
export const gen = <T, E>(
  body: () => Generator<Err<never, E>, Result<T, E>, unknown>
): Result<T, E> => {
  // Implementation using generator iteration
};
```

### 6.2 TaggedError with Exhaustiveness Checking

The `TaggedError` factory with `matchError` provides compile-time exhaustiveness:

```typescript
// Concept for @deessejs/fp
const NotFoundError = taggedError("NotFoundError")<{ id: string }>();
const ValidationError = taggedError("ValidationError")<{ field: string }>();

type ApiError = NotFoundError | ValidationError;

matchError(apiError, {
  NotFoundError: (e) => handle(e.id),
  ValidationError: (e) => handle(e.field),
  // TS error if any tag missing
});
```

### 6.3 Result Serialization

Add serialize/deserialize for RPC scenarios:

```typescript
// Conceptual addition
export const serialize = <T, E>(result: Result<T, E>): SerializedResult<T, E> => {
  if (isOk(result)) return { status: "ok", value: result.value };
  return { status: "error", error: result.error };
};

export const deserialize = <T, E>(value: unknown): Result<T, E> => { ... };
```

### 6.4 `tapBoth` for Unified Side Effects

Add a single handler for both success and error:

```typescript
// Conceptual addition
export const tapBoth = <T, E>(
  result: Result<T, E>,
  handlers: { ok: (value: T) => void; err: (error: E) => void }
): Result<T, E> => {
  if (isOk(result)) handlers.ok(result.value);
  else handlers.err(result.error);
  return result;
};
```

### 6.5 `tryRecover` for Error Recovery

```typescript
// Convert error to success, or pass through
export const tryRecover = <T, E, E2>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, E2>
): Result<T, E2> => {
  if (isOk(result)) return result;
  return fn(result.error);
};
```

### 6.6 Built-in Retry in Async Context

```typescript
// Enhanced fromPromise with retry
export const fromPromiseWithRetry = <T>(
  promise: () => Promise<T>,
  options: RetryOptions
): AsyncResult<T, Error> => {
  // Combines fromPromise with retryAsync
};
```

---

## 7. Competitor Positioning

**Is it a direct competitor?** Yes and no.

| Aspect | better-result | @deessejs/fp |
|--------|--------------|--------------|
| Error handling | Result<A, E> only | Result, Maybe, Try, AsyncResult |
| Error model | Simple tagged errors | Rich structured errors with enrichment |
| Architecture | Class-based | Functional |
| Async | Manual with callbacks | Thenable pattern with await |
| Dependencies | Zero | Zod |
| Scope | Result type focused | Comprehensive FP toolkit |

**When to choose better-result:**
- Need generator-based composition for sequential operations
- Want exhaustive pattern matching on error types
- Need lightweight, zero-dependency solution
- Only need Result type (not Maybe/Try)

**When to choose @deessejs/fp:**
- Need Maybe with non-null invariant
- Need error enrichment with `addNotes()` and `from()`
- Prefer functional programming style
- Want comprehensive FP toolkit (Result + Maybe + Try + AsyncResult)
- Need Zod validation for error arguments
- Need sleep utilities and timeouts

---

## 8. Bundle Size Comparison

| Library | Bundle Size | Dependencies |
|---------|-------------|--------------|
| better-result | ~3KB (estimated from source) | 0 |
| @deessejs/fp | Larger (multiple types) | zod (~30KB) |

better-result wins on pure bundle size due to zero dependencies and focused scope. However, @deessejs/fp's larger footprint includes comprehensive error handling, Maybe, Try, AsyncResult, and Zod integration.

---

## 9. TypeScript Type Safety Approaches

### 9.1 better-result's Approach

**Phantom types for proper inference:**

```typescript
// Phantom error type in Ok doesn't appear in Ok's public API
class Ok<A, E = never> {
  readonly value: A;
  // E is phantom - only used for union type inference
}

class Err<T, E> {
  readonly error: E;
  // T is phantom - only used for union type inference
}
```

**Exhaustive matching via mapped types:**

```typescript
type MatchHandlers<E extends AnyTaggedError, R> = {
  [K in E["_tag"]]: (err: Extract<E, { _tag: K }>) => R;
};
// TS error if handler is missing for any tag
```

**Generator type inference:**

```typescript
type InferYieldErr<Y> = Y extends Err<never, infer E> ? E : never;
// Extracts error type from yielded Err
```

### 9.2 @deessejs/fp's Approach

**Discriminated union with `ok` property:**

```typescript
export type Ok<T, E extends Error = Error> = {
  readonly ok: true;
  readonly value: T;
  // methods...
};

export type Err<E extends Error = Error> = {
  readonly ok: false;
  readonly error: E;
  // methods...
};
```

**Type guard functions:**

```typescript
export const isOk = <T, E extends Error>(result: Result<T, E>): result is Ok<T, E> =>
  result.ok === true;
```

**Error builder with ExtractError:**

```typescript
export type ExtractError<T extends ErrorBuilder<any>> =
  T extends ErrorBuilder<infer E> ? Error<E> : never;
```

---

## 10. Innovative Patterns Worth Stealing

### 10.1 `Result.gen()` Generator Composition

**Why:** Cleaner syntax for sequential error-handling operations. Currently @deessejs/fp requires nested flatMap or lengthy pipe chains.

**Implementation approach:** Would need to implement Generator iteration that:
1. Calls `next()` on the generator
2. Expects `yield*` to return `Err` values
3. Extracts value from `Ok` results
4. Collects all error types for proper union inference

### 10.2 TaggedError with `matchError` Exhaustiveness

**Why:** Compile-time guarantee that all error cases are handled.

**Implementation approach:**
```typescript
export const matchError: {
  <E extends AnyTaggedError, R>(err: E, handlers: MatchHandlers<E, R>): R;
} = (err, handlers) => {
  const handler = handlers[err._tag];
  return handler(err as any);
};
```

### 10.3 Serialization/Deserialization

**Why:** Useful for RPC, localStorage, server actions.

**Implementation approach:** Simple object transformation:
```typescript
export const serialize = <T, E>(result: Result<T, E>) =>
  isOk(result)
    ? { status: "ok" as const, value: result.value }
    : { status: "error" as const, error: result.error };
```

### 10.4 Dual Functions for Data-First/Data-Last

**Why:** better-result uses a `dual` helper that allows both:

```typescript
// Data-first
map(result, fn)

// Data-last (pipeable)
pipe(result, map(fn))
```

@deessejs/fp currently only supports data-first with standalone functions. The pipe approach works but requires importing `pipe` and the function separately.

### 10.5 `tapBoth` Unified Handler

**Why:** Convenience when you want to log regardless of success/failure.

---

## 11. Summary Recommendations

### High Priority (Consider Adding)

1. **`Result.gen()` generator composition** - Most innovative feature, solves sequential composition verbosity
2. **`tapBoth`** - Convenient unified side effect handler
3. **Result serialization** - Practical for RPC/storage use cases
4. **`tryRecover`** - Error recovery pattern

### Medium Priority (Nice to Have)

1. **`matchError` with TaggedError exhaustiveness** - Would enhance error handling type safety
2. **Dual function variants** - Data-first and data-last options

### Lower Priority (Would Require Significant Work)

1. **Replacing classes with objects** - Would break @deessejs/fp's functional style mandate
2. **Removing Zod dependency** - Would remove valuable error validation

### Key Takeaway

better-result is an excellent, focused library with innovative generator-based composition. @deessejs/fp is more comprehensive but could learn from better-result's elegant `Result.gen()` pattern and exhaustive error matching. The libraries are complementary rather than direct competitors - @deessejs/fp's scope is much broader.

---

## Sources

- [npm: better-result](https://www.npmjs.com/package/better-result)
- [GitHub: dmmulroy/better-result](https://github.com/dmmulroy/better-result)
- [GitHub README (raw)](https://raw.githubusercontent.com/dmmulroy/better-result/main/README.md)
- [Source: result.ts](https://raw.githubusercontent.com/dmmulroy/better-result/main/src/result.ts)
- [Source: error.ts](https://raw.githubusercontent.com/dmmulroy/better-result/main/src/error.ts)
