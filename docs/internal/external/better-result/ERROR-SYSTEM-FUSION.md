# Error System Fusion: Technical Design

## Overview

This document provides the technical design for achieving the error system DX described in [EXPECTED-ERROR-DX.md](./EXPECTED-ERROR-DX.md). It details the implementation approach, migration strategy, and file structure changes needed.

---

## 1. Current State Summary

### @deessejs/fp Error System

**Location:** `packages/fp/src/error/`

**Architecture:** Plain frozen objects created via `error()` builder factory.

**Core Types (from `types.ts`):**
```typescript
export interface ErrorData<T> {
  readonly name: string;
  readonly args: T;
  readonly notes: readonly string[];
  readonly cause: Maybe<NativeError>;
  readonly stack?: string;
  readonly message: string;
}

export type Error<T = unknown> = Readonly<ErrorData<T>> & NativeError & ErrorMethods<T>;

export interface ErrorMethods<T> {
  addNotes(...notes: string[]): Error<T>;
  from(cause: Error | Maybe<Error>): Error<T>;
}
```

**Key Features:**
- **Builder pattern:** `error({ name, schema?, message? })` returns a `ErrorBuilder<T>` that creates Error instances
- **Zod validation:** Optional schema for input validation with automatic ValidationError creation
- **Enrichment:** `addNotes()` and `from()` methods for chaining context
- **Sensitive redaction:** Automatic redaction of password, token, secret, etc. fields
- **ErrorGroup:** Groups multiple errors with `exceptionGroup()`
- **Functional approach:** No classes, pure object factory pattern

**Limitations:**
- No `_tag` discriminator for exhaustive pattern matching
- No static `is()` type guard on error builders
- No `Symbol.iterator` for generator composition
- `match()` on Result does not support tagged error exhaustion

---

### better-result TaggedError

**Location:** `temp/better-result/src/error.ts`

**Architecture:** Class factory pattern via `TaggedError("Name")` Higher-Kinded Type (HKT) factory.

**Core Pattern (from `error.ts`):**
```typescript
export const TaggedError: {
  <Tag extends string>(
    tag: Tag,
  ): <Props extends Record<string, unknown> = {}>() => TaggedErrorClass<Tag, Props>;
  is(value: unknown): value is AnyTaggedError;
} = Object.assign(
  <Tag extends string>(tag: Tag) =>
    <Props extends Record<string, unknown> = {}>(): TaggedErrorClass<Tag, Props> => {
      class Base extends Error {
        readonly _tag: Tag = tag;
        static is(value: unknown): value is Base {
          return value instanceof Base;
        }
        *[Symbol.iterator](): Generator<Err<never, this>, never, unknown> {
          yield* err(this);
          return panic("Unreachable: Err yielded in TaggedError but generator continued", this);
        }
      }
      return Base as unknown as TaggedErrorClass<Tag, Props>;
    },
  { is: isAnyTaggedError },
);
```

**Key Features:**
- **`_tag` discriminator:** String tag for exhaustive pattern matching
- **Static `is()` type guard:** `NotFoundError.is(value)` narrows type precisely
- **`Symbol.iterator` yield:** Enables `yield* errorInstance` in `Result.gen` blocks to short-circuit with Err
- **`matchError()` / `matchErrorPartial()`:** Exhaustive tagged union matching with type narrowing
- **`toJSON()`:** Proper serialization support
- **Stack chaining:** Cause stack is indented and appended to wrapper stack

**Limitations:**
- No Zod validation support
- No enrichment (notes, cause chaining) on the error itself
- No sensitive field redaction
- Class-based API (violates project's "no class exports" rule)
- Error builders are classes, not plain object factories

---

## 2. Strengths and Weaknesses

| Feature | @deessejs/fp | better-result TaggedError |
|---------|--------------|---------------------------|
| **DX Philosophy** | Functional builder, plain objects | Class-like with HKT factory |
| **Discriminator** | None (uses `name` string) | `_tag` property |
| **Type Guard** | `isError()` guard function | Static `ErrorClass.is()` |
| **Zod Validation** | Built-in | Not supported |
| **Enrichment** | `addNotes()`, `from()` | Not supported |
| **Generator Composition** | Not supported | `yield* error` short-circuits Result.gen |
| **Pattern Matching** | Manual name checks | `matchError()` exhaustive |
| **Sensitive Redaction** | Automatic | Not supported |
| **ErrorGroup** | Yes | No |
| **Serialization** | Manual | `toJSON()` built-in |
| **Stack Chaining** | Via `cause` | Flattens into stack |

### @deessejs/fp Strengths
- Clean functional API - no classes exposed to users
- Zod validation with clear validation error messages
- Enrichment API for gradual error context building
- Automatic sensitive data redaction
- ErrorGroup for batch operations

### @deessejs/fp Weaknesses
- Cannot pattern match on error types exhaustively
- No `yield* error` in generator blocks
- Static `is()` pattern requires separate guard functions

### better-result Strengths
- Exhaustive `matchError()` with full type narrowing
- Static `is()` on each error class for precise type guards
- `yield* error` in Result.gen blocks enables elegant error propagation
- Clean class-like ergonomics with HKT factory (avoids manual class writing)

### better-result Weaknesses
- No Zod validation
- No enrichment API
- Error builders are classes (violates project's "no class exports" rule)
- No sensitive redaction
- No ErrorGroup equivalent

---

## 3. Proposed Unified Error System Design

### API Design Principles

1. **Keep `error()` builder** - Functional, no class exposure
2. **Add `_tag` discriminator** - Enable exhaustive matching
3. **Add static `is()` method** - But as a method on the builder, not class
4. **Add `Symbol.iterator`** - Enable `yield*` in Result.gen
5. **Preserve enrichment** - notes, cause chaining must remain
6. **Preserve Zod validation** - Must remain first-class
7. **Add sensitive redaction** - Carry over from current system

### New Type Design

```typescript
// New unified error type
export interface TaggedError<T extends string, Props extends Record<string, unknown> = {}>
  extends Error<Props> {
  readonly _tag: T;

  // Enrichment methods (preserved from @deessejs/fp)
  addNotes(...notes: string[]): TaggedError<T, Props>;
  from(cause: TaggedError<any, any> | Maybe<TaggedError<any, any>>): TaggedError<T, Props>;

  // Generator composition (from better-result)
  [Symbol.iterator](): Generator<Err<never, this>, never, unknown>;
}

// Error builder with static is() method
export interface TaggedErrorBuilder<T extends string, Props extends Record<string, unknown> = {}>
  extends ErrorBuilder<Props> {
  readonly _tag: T;

  // Static is() type guard method
  is(value: unknown): value is TaggedError<T, Props>;

  // Instance creation
  (props?: Props): TaggedError<T, Props>;
}
```

### Factory Function Signature

```typescript
// Unified error factory
export const error: {
  <T extends string>(
    options: ErrorOptions<T> & { tag: T }
  ): TaggedErrorBuilder<T>;

  // Backward compatible overload without tag
  <T>(
    options: ErrorOptions<T>
  ): ErrorBuilder<T>;
};
```

### Usage Examples

#### Creating Error Builders

```typescript
// With tag for pattern matching support
const NotFoundError = error({
  tag: "NotFoundError",
  name: "NotFoundError",
  schema: z.object({ id: z.string() }),
  message: (args) => `Resource not found: ${args.id}`
});

// Without tag (backward compatible)
const GenericError = error({
  name: "GenericError",
  schema: z.object({ reason: z.string() })
});
```

#### Creating Error Instances

```typescript
const err = NotFoundError({ id: "123" });
// TaggedError<"NotFoundError", { id: string }>

err._tag        // "NotFoundError"
err.id          // "123" (access via Props)
err.name        // "NotFoundError"
err.message     // "Resource not found: 123"
err.addNotes("DB query attempted")  // Enrichment preserved
err.from(previousError)             // Cause chaining preserved
```

#### Static is() Type Guard

```typescript
const err = NotFoundError({ id: "123" });

// Static is() on builder
if (NotFoundError.is(err)) {
  err.id  // Fully narrowed: string
}

// Generic TaggedError.is() for any tagged error
if (TaggedError.is(err)) {
  err._tag  // string
}
```

#### Pattern Matching

```typescript
const result = someOperation();

matchError(result.error, {
  NotFoundError: (e) => `Missing: ${e.id}`,
  ValidationError: (e) => `Invalid: ${e.field}`,
  NetworkError: (e) => `Network failed: ${e.url}`,
});

// With fallback for unhandled
matchErrorPartial(result.error, {
  NotFoundError: (e) => `Missing: ${e.id}`,
}, (e) => `Other error: ${e._tag}`);
```

#### Generator Composition (Result.gen)

```typescript
const result = await Result.gen(async function* () {
  const user = yield* Result.await(fetchUser(id));

  // yield* TaggedError short-circuits with Err
  // This works without wrapping in err()
  if (!user) {
    yield* NotFoundError({ id });  // Yields Err<never, NotFoundError>
  }

  return user;
});
```

---

## 4. Migration Path from @deessejs/fp

### Phase 1: Additive Changes (Backward Compatible)

1. **Add `_tag` property** to ErrorData - use same value as `name`
2. **Add `TaggedError.is()`** - Generic type guard function
3. **Add `matchError()` / `matchErrorPartial()`** - New utility functions

```typescript
// In types.ts - add _tag
export interface ErrorData<T> {
  readonly _tag: string;  // NEW: same as name
  readonly name: string;
  // ... existing fields
}

// New utility functions in index.ts
export const matchError: {
  <E extends Error, R>(err: E, handlers: Record<E["_tag"], (e: E) => R>): R;
} = dual(2, (err, handlers) => {
  const handler = handlers[err._tag as keyof typeof handlers];
  return handler(err);
});
```

### Phase 2: Deprecate and Rename

1. **Deprecate `name`** in favor of `_tag` for discrimination
2. **Add `tag` option** to `error()` builder

```typescript
export const error = <T>(options: ErrorOptions<T> & { tag?: string }): ErrorBuilder<T> => {
  const { tag, name, schema, message: messageFn } = options;
  const discriminator = tag ?? name;

  return (args?: T): Error<T> => {
    const self = createErrorObject<T>(
      name,
      args as T,
      Object.freeze([]),
      none(),
      customMessage,
      captureStack(),
      false,
      discriminator  // NEW: pass discriminator
    );
    return Object.freeze(self);
  };
};
```

### Phase 3: Add Static is() on Builders

```typescript
// Add is() method to ErrorBuilder type
export interface ErrorBuilder<T = object> {
  (args?: T): Error<T>;
  is(value: unknown): value is Error<T>;  // NEW
}

// Implement in error() factory
const createBuilder = <T>(name: string): ErrorBuilder<T> => {
  const builder = (args?: T) => createError(name, args);

  builder.is = (value: unknown): value is Error<T> => {
    return isError(value) && value._tag === name;
  };

  return builder;
};
```

### Phase 4: Add Symbol.iterator

```typescript
// In builder.ts, modify createErrorObject to include [Symbol.iterator]
const createErrorObject = <T>(/* existing params */, _tag?: string): Error<T> => {
  const self = {
    name: errName,
    _tag: _tag ?? name,  // NEW
    args,
    notes,
    cause,
    stack,
    message: errMessage,
    addNotes(/* existing */) { /* ... */ },
    from(/* existing */) { /* ... */ },
    // NEW: Generator for Result.gen composition
    *[Symbol.iterator](): Generator<Err<never, this>, never, unknown> {
      yield* err(this);
      return panic("Unreachable", this);
    },
  } as Error<T>;

  return Object.freeze(self);
};
```

---

## 5. Code Examples Showing Improved DX

### Before (@deessejs/fp current)

```typescript
import { error, err } from '@deessejs/fp';
import { z } from 'zod';

const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string(), message: z.string() }),
  message: (args) => `Invalid ${args.field}: ${args.message}`
});

const NotFoundError = error({
  name: "NotFoundError",
  schema: z.object({ id: z.string(), resource: z.string() })
});

// Create and use
const validationErr = ValidationError({ field: "email", message: "invalid format" });
const result = err(validationErr);

// Manual matching
if (result.error.name === "ValidationError") {
  console.log(`Invalid field: ${result.error.args.field}`);
} else if (result.error.name === "NotFoundError") {
  console.log(`Not found: ${result.error.args.id}`);
}

// Enrichment
const enriched = validationErr.addNotes("User submitted form at /register");
```

### After (Unified System)

```typescript
import { error, matchError, TaggedError } from '@deessejs/fp';
import { z } from 'zod';

// Error builders with tags
const ValidationError = error({
  tag: "ValidationError",
  name: "ValidationError",
  schema: z.object({ field: z.string(), message: z.string() }),
  message: (args) => `Invalid ${args.field}: ${args.message}`
});

const NotFoundError = error({
  tag: "NotFoundError",
  name: "NotFoundError",
  schema: z.object({ id: z.string(), resource: z.string() })
});

// Static is() type guard
const err = ValidationError({ field: "email", message: "invalid" });
if (ValidationError.is(err)) {
  console.log(`Invalid field: ${err.field}`);  // Fully narrowed
}

// Exhaustive pattern matching
const result = someOperation();
const message = matchError(result.error, {
  ValidationError: (e) => `Invalid ${e.field}: ${e.message}`,
  NotFoundError: (e) => `${e.resource} not found: ${e.id}`,
  NetworkError: (e) => `Network error at ${e.url}`,
});

// Generator composition (NEW!)
const data = await Result.gen(async function* () {
  const user = yield* Result.await(fetchUser(id));

  if (!user.active) {
    yield* ValidationError({ field: "user.active", message: "inactive" });
  }

  return user;
});

// Enrichment preserved
const enriched = err.addNotes("User submitted form at /register");
const withCause = enriched.from(previousError);

// Generic TaggedError.is() for any tagged error
if (TaggedError.is(result.error)) {
  console.log(result.error._tag);  // string
}
```

### Result.gen Yielding TaggedError (Key Improvement)

The most significant DX improvement is the ability to yield TaggedError directly without wrapping in `err()`:

```typescript
// CURRENT: Must wrap in err()
const result = Result.gen(function* () {
  const user = yield* Result.ok(fetchUser(id));
  if (!user) {
    yield* err(NotFoundError({ id }));  // Wrapping required
  }
  return user;
});

// PROPOSED: Can yield TaggedError directly
const result = Result.gen(function* () {
  const user = yield* Result.ok(fetchUser(id));
  if (!user) {
    yield* NotFoundError({ id });  // Direct yield!
  }
  return user;
});
```

---

## 6. Implementation Notes

### File Structure Changes

```
packages/fp/src/error/
├── types.ts          # Add _tag, TaggedError<T, Props>, TaggedErrorBuilder
├── builder.ts       # Add _tag support, Symbol.iterator implementation
├── guards.ts        # Add isTaggedError (existing isError covers _tag check)
├── utils.ts         # Unchanged
├── raise.ts         # Unchanged
├── match.ts         # NEW: matchError, matchErrorPartial
└── index.ts         # Export new utilities
```

### Key Type Changes

```typescript
// types.ts additions
export interface TaggedError<T extends string, Props extends Record<string, unknown>>
  extends Error<Props> {
  readonly _tag: T;
  addNotes(...notes: string[]): TaggedError<T, Props>;
  from(cause: TaggedError<any, any> | Maybe<TaggedError<any, any>>): TaggedError<T, Props>;
  [Symbol.iterator](): Generator<Err<never, this>, never, unknown>;
}

export interface TaggedErrorBuilder<T extends string, Props extends Record<string, unknown>>
  extends ErrorBuilder<Props> {
  readonly _tag: T;
  is(value: unknown): value is TaggedError<T, Props>;
}
```

### Compatibility Strategy

1. `error({ name: "X" })` continues to work - `_tag` defaults to `name`
2. `error({ tag: "X", name: "X" })` - explicit tag for pattern matching
3. All existing `Error<T>` are also `TaggedError<string, T>` with `_tag = name`
4. `TaggedError.is()` works on all errors (old and new)

---

## 7. Document Structure

This is a multi-document design. Refer to the complete specification:

- [EXPECTED-ERROR-DX.md](./EXPECTED-ERROR-DX.md) - **Source of truth** for error system DX and API design
- [EXPECTED-RESULT-DX.md](./EXPECTED-RESULT-DX.md) - **Source of truth** for result system DX and API design
- [ANALYSIS.md](./ANALYSIS.md) - Analysis of current implementation vs target
- [ERROR-SYSTEM-FUSION.md](./ERROR-SYSTEM-FUSION.md) - Technical design for error system

This design document proposes a unified error system that captures the best of both approaches: the developer experience of @deessejs/fp (simple builder, enrichment, Zod validation, sensitive redaction) and the power of better-result (tag discrimination, static is(), generator composition, exhaustive matching).