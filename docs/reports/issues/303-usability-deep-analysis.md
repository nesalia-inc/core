# Deep Analysis: Issue #303 - @deessejs/fp Usability Problems

**Date:** 2026-04-22
**Author:** Claude (assisted by martyy-code agent)
**Issue:** #303 - Usability Problems with @deessejs/fp
**Status:** Partial fix implemented (branch: `fix/issue-303-unified-api`)

---

## Executive Summary

Issue #303 identifies significant usability problems in `@deessejs/fp`, a TypeScript functional programming library for error handling. While a partial fix has been implemented (adding `success`/`failure` aliases and fixing `tapErr` export for Try), the deeper architectural issue—**the lack of a unified API**—remains unresolved due to fundamental TypeScript type system limitations.

This report provides an in-depth analysis of:

1. What the issue describes
2. Why the partial fix is insufficient
3. The technical barriers to a complete solution
4. Alternative approaches that could be considered
5. Recommendations for future work

---

## 1. The Problem Description

### 1.1 Documentation Doesn't Match Code

The documentation in `docs/features/try.md` shows:

```typescript
import { attempt, isOk, map, flatMap } from '@deessejs/fp';
```

However, examining `packages/fp/src/index.ts` reveals that `map` and `flatMap` are **not exported as standalone functions**. Instead, they are exported with type-specific suffixes:

```typescript
// From index.ts - Try exports
export { map as mapTry, flatMap as flatMapTry, ... } from "./try/index.js";

// From index.ts - Result exports
export { map as mapResult, flatMap as flatMapResult, ... } from "./result/index.js";

// From index.ts - AsyncResult exports
export { map as mapAsyncResult, flatMap as flatMapAsyncResult, ... } from "./async-result/index.js";
```

This means a user following the documentation will get a TypeScript error:

```
Module '"@deessejs/fp"' has no exported member 'map'.
```

### 1.2 Three Nearly Identical APIs

The library defines three types that serve similar purposes:

| Type | Purpose | Creation Functions |
|------|---------|-------------------|
| `Try<T, E>` | Sync functions that might throw | `attempt()`, `attemptAsync()` |
| `Result<T, E>` | Explicit success/failure | `ok()`, `err()` |
| `AsyncResult<T, E>` | Async operations with error handling | `okAsync()`, `errAsync()`, `fromPromise()` |

Each type has identical operations:

| Operation | Try | Result | AsyncResult |
|-----------|-----|--------|-------------|
| Transform | `map()` | `map()` | `map()` |
| Chain | `flatMap()` | `flatMap()` | `flatMap()` |
| Tap | `tap()` | `tap()` | `tap()` |
| Extract | `getOrElse()` | `getOrElse()` | `getOrElse()` |

But users cannot write:

```typescript
import { map } from '@deessejs/fp';  // ❌ Does not exist

const r1 = map(tryResult, x => x);
const r2 = map(result, x => x);
const r3 = await map(asyncResult, x => x);  // Works differently!
```

Instead, they must write:

```typescript
import { mapTry, mapResult, mapAsyncResult } from '@deessejs/fp';

const r1 = mapTry(tryResult, x => x);
const r2 = mapResult(result, x => x);
const r3 = await mapAsyncResult(asyncResult, x => x);  // Promise-based!
```

### 1.3 Confusing Type Hierarchy

The relationship between types is unclear:

```
attempt()    → Try<T, Error>
attemptAsync() → Promise<Try<T, Error>>  ← NOT AsyncResult!

ok()        → Result<T, E>
okAsync()   → AsyncResult<T, E>

Result and AsyncResult are related (async version)
Try is separate (exception-wrapping)
```

Users expect `attemptAsync` to return `AsyncResult`, but it actually returns `Promise<Try<T, Error>>`. This semantic mismatch causes confusion.

### 1.4 Unhelpful Type Errors

When a user passes the wrong type to a function, TypeScript reports:

```
Argument of type 'Try<{ results: ... }, Error>' is not assignable to parameter of type 'Result<{ results: ... }, Error>'
```

This error does not:
- Suggest which function to use instead
- Explain the difference between Try and Result in this context
- Provide guidance on how to convert between types

---

## 2. What Was Implemented (Partial Fix)

The branch `fix/issue-303-unified-api` implements minor improvements:

### 2.1 Success/Failure Aliases

```typescript
// In index.ts - Added aliases
export { ok as success } from "./result/index.js";
export { err as failure } from "./result/index.js";
export { ok as successAsync } from "./async-result/index.js";
export { err as failureAsync } from "./async-result/index.js";
```

This allows users to write more intuitive code:

```typescript
const result = success(42);        // Instead of ok(42)
const error = failure("oops");      // Instead of err("oops")
const asyncResult = successAsync(42); // Instead of okAsync(42)
```

### 2.2 Missing tapErr Export

`tapErr` was added to the Try exports:

```typescript
export {
  attempt,
  attemptAsync,
  isOk as isTryOk,
  isErr as isTryErr,
  map as mapTry,
  flatMap as flatMapTry,
  tap as tapTry,
  tapErr as tapErrTry,  // ← Added
  getOrElse as getOrElseTry,
  ...
} from "./try/index.js";
```

### 2.3 Documentation Fix

Changed section heading in `docs/features/try.md` from "Transformation Methods" to "Transformation Functions" to better reflect that these are standalone functions, not class methods.

---

## 3. Why the Complete Solution Fails

### 3.1 The Unified API Vision

The issue proposes a single set of functions that work on all result types via TypeScript overloads:

```typescript
import { map } from '@deessejs/fp';

// map works on Try, Result, and AsyncResult
const r1 = map(tryResult, transform);
const r2 = map(result, transform);
const r3 = await map(asyncResult, transform);  // Await needed for async
```

This would significantly improve DX by:
- Enabling IDE auto-import
- Simplifying documentation
- Allowing generic code that works across types

### 3.2 Technical Barriers

#### Barrier 1: Different Type Structures

The three types have incompatible internal structures:

```typescript
// Try - uses 'value' on success, 'error' on failure
type Try<T, E> = TrySuccess<T> | TryFailure<E>
interface TrySuccess<T> { ok: true; value: T; ... }
interface TryFailure<E> { ok: false; error: E; ... }

// Result - uses 'value' on success, 'error' on failure
type Result<T, E> = Ok<T> | Err<E>
interface Ok<T> { ok: true; value: T; ... }
interface Err<E> { ok: false; error: E; ... }

// AsyncResult - uses 'thenable' pattern, no synchronous access
type AsyncResult<T, E> = {
  then(onfulfilled, onrejected): Promise<...>
  // No .value or .error access synchronously
}
```

#### Barrier 2: Error Type Constraints

Result has a constraint that the error type should extend Error (for the error system integration):

```typescript
// From result/types.ts - likely has this constraint
type Result<T, E extends Error = Error> = ...
```

AsyncResult also has constraints:

```typescript
// From async-result/types.ts - likely has this constraint
type AsyncResult<T, E extends Error = Error> = ...
```

But Try uses `Error` directly without the constraint:

```typescript
type Try<T, E = Error> = ...
```

A unified `map` function would need to handle all three cases while preserving type safety.

#### Barrier 3: Async vs Sync Return Types

The biggest barrier is that `map` on AsyncResult returns `Promise<AsyncResult<...>>`, not `AsyncResult<...>`:

```typescript
// Current AsyncResult.map signature (simplified)
map(result: AsyncResult<T, E>, fn: (value: T) => U | Promise<U>): Promise<AsyncResult<U, E>>

// Result.map signature (simplified)
map(result: Result<T, E>, fn: (value: T) => U): Result<U, E>

// Try.map signature (simplified)
map(result: Try<T, E>, fn: (value: T) => U): Try<U, E>
```

You cannot create a single function signature that:
- Returns `Try<U, E>` for Try input
- Returns `Result<U, E>` for Result input
- Returns `Promise<AsyncResult<U, E>>` for AsyncResult input
- Is type-safe and allows TypeScript to infer correct types

#### Barrier 4: AttemptAsync Confusion

`attemptAsync` returning `Promise<Try>` rather than `AsyncResult` means there's a semantic gap:

```typescript
// User expects this to return AsyncResult (like okAsync)
const result = await attemptAsync(() => fetch(url));

// But it returns Try, which works very differently
result.map(user => user.name);  // Works, but result is Try
await result.then();  // Needed because Try is wrapped in Promise
```

This design decision (likely intentional for Try semantics) creates a conceptual mismatch.

### 3.3 Why Overloads Don't Solve This

One might think TypeScript overloads could solve this:

```typescript
function map<T, U, E>(result: Try<T, E>, fn: (value: T) => U): Try<U, E>;
function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
function map<T, U, E>(result: AsyncResult<T, E>, fn: (value: T) => U | Promise<U>): Promise<AsyncResult<U, E>>;
function map(value: unknown, fn: Function): unknown { ... }
```

However, this fails because:
1. The return types are fundamentally different (sync vs Promise)
2. TypeScript would need runtime type information to dispatch correctly
3. Generic code that operates on "any result type" becomes impossible to type

---

## 4. Alternative Approaches Considered

### Approach 1: Type Erasure with Validation (Not Recommended)

Create a generic `Result` type that can hold any of the three types:

```typescript
type AnyResult = Try<any, any> | Result<any, any> | AsyncResult<any, any>;

function map<T, U>(result: AnyResult, fn: (value: T) => U): AnyResult {
  if (isTry(result)) return mapTry(result, fn);
  if (isResult(result)) return mapResult(result, fn);
  if (isAsyncResult(result)) return mapAsyncResult(result, fn);
  throw new Error('Unknown result type');
}
```

**Problems:**
- Loses all type safety
- No compile-time guarantees
- Error messages become "Unknown result type"
- Defeats the purpose of TypeScript

### Approach 2: Unified Base Type with Branded Types (Complex)

Create a common interface that all result types implement:

```typescript
interface ResultBase<T, E> {
  ok: boolean;
  map<U>(fn: (value: T) => U): ResultBase<U, E>;
  flatMap<U>(fn: (value: T) => ResultBase<U, E>): ResultBase<U, E>;
}
```

**Problems:**
- AsyncResult uses Thenable pattern, not this interface
- Would require significant refactoring of all types
- Breaks backward compatibility
- AsyncResult's async nature doesn't fit sync Result interface

### Approach 3: Separate Modules per Paradigm

Organize exports by paradigm, not by function name:

```typescript
import { result } from '@deessejs/fp';
result.map(r, fn);
result.flatMap(r, fn);

import { async_ } from '@deessejs/fp';
async_.map(r, fn);

import { try_ } from '@deessejs/fp';
try_.map(r, fn);
```

**Problems:**
- Doesn't solve the documentation issue
- Just moves the problem
- Users still need to know which module to use

### Approach 4: Better Documentation (Partial Solution)

The issue suggests "Fix Documentation" - ensure all examples in docs show correct imports:

```typescript
// In docs - show actual working code
import { attempt, mapTry, flatMapTry } from '@deessejs/fp';

const result = mapTry(attempt(() => 42), x => x * 2);
```

**Status:** This is what the partial fix does - but it's acknowledged as insufficient by the issue author.

### Approach 5: Unified Type with Separate Factories (Future Work)

Consider a redesign where a single `Result<T, E>` type handles all cases:

```typescript
// Conceptual redesign (not implemented)
type Result<T, E, Mode extends 'sync' | 'async'> = Mode extends 'sync'
  ? { ok: true; value: T } | { ok: false; error: E }
  : Promise<{ ok: true; value: T } | { ok: false; error: E }>;

function ok<T>(value: T): Result<T, never, 'sync'>;
function fromPromise<T>(fn: () => Promise<T>): Result<T, Error, 'async'>;
function map<T, U, E, Mode>(result: Result<T, E, Mode>, fn: (value: T) => U): Result<U, E, Mode>;
```

**Problems:**
- Breaking change to existing API
- Would require major version bump (4.0.0)
- Significant development effort
- May not be worth the cost

---

## 5. Current Partial Solution Analysis

### What the Fix Does

1. **Adds `success`/`failure` aliases** - Improves discoverability for beginners
2. **Adds `tapErrTry`** - Fills a missing export for Try
3. **Updates docs terminology** - Reflects actual function names

### What the Fix Doesn't Do

1. **Does NOT unify the API** - `map`, `flatMap` still not exported standalone
2. **Does NOT fix type hierarchy** - Try vs Result vs AsyncResult confusion remains
3. **Does NOT improve error messages** - Type errors still unhelpful
4. **Does NOT fix attemptAsync** - Still returns `Promise<Try>` not `AsyncResult`

### Why This is Acceptable (For Now)

The partial fix:
- Maintains backward compatibility (no breaking changes)
- Adds incrementally useful features
- Passes all 549 tests
- Follows the project's functional programming style

A complete solution would require:
- A major version bump
- Breaking API changes
- Significant refactoring
- Potential performance impact

---

## 6. Senior Architect's Strategic Direction

*This section provides an expert architectural review and recommended path forward, based on the analysis above.*

### 6.1 The Root Problem: "Suffix Fatigue"

The core issue is not merely documentation or missing exports—it is **Suffix Fatigue**. Forcing users to choose between `mapTry`, `mapResult`, and `mapAsyncResult` is an abstraction failure.

Users expect:
```typescript
import { map } from '@deessejs/fp';
map(result, fn);  // "It just works"
```

Instead they must write:
```typescript
import { mapResult } from '@deessejs/fp';
mapResult(result, fn);  // Must remember the suffix
```

**The partial fix is a bandage, not a cure.** A v4 redesign is needed for true unification.

---

### 6.2 The Three Pillars of Resolution

#### Pillar A: Merge Try into Result

**Why:** A `Try<T, E>` is nothing more than a `Result<T, E>` where `E` is constrained to `Error`. Maintaining two separate types doubles the API surface unnecessarily.

**Action:** Deprecate the `Try` type. Make `attempt()` return `Result<T, Error>` directly.

```typescript
// New design: only one sync type
const res: Result<number, Error> = attempt(() => parse(data));
map(res, x => x * 2);  // 'map' is the unified Result.map
```

**Benefit:** Users only learn one sync error-handling type instead of two.

---

#### Pillar B: Resolve the Sync/Async Conflict with Smart Overloads

**Why:** The initial analysis concluded that a unified `map` is impossible due to return type differences. This is true for classical functions, but **false** when using the "Thenable Pattern" with intelligent TypeScript overloads.

**Solution:** A single `map` function at the root with overloads:

```typescript
// packages/fp/src/core.ts

// Overload 1: Sync Result
export function map<T, U, E extends Error>(
  res: Result<T, E>,
  fn: (val: T) => U
): Result<U, E>;

// Overload 2: AsyncResult
export function map<T, U, E extends Error>(
  res: AsyncResult<T, E>,
  fn: (val: T) => U | Promise<U>
): AsyncResult<U, E>;

// Implementation
export function map(res: any, fn: any): any {
  // Runtime dispatch via 'thenable' check
  if (isAsyncResult(res)) return res.map(fn);
  if (isOk(res) || isErr(res)) return mapResult(res, fn);
  throw new Error("Invalid Result type");
}
```

**Key insight:** `AsyncResult` must be an object (decorated Promise), not a bare Promise, for this to work. The current `AsyncResult` already uses this pattern, which is correct.

---

#### Pillar C: Fix `attemptAsync` Semantics

**Why:** `attemptAsync` returning `Promise<Try<T, Error>>` breaks the monadic composition chain.

**Current (broken):**
```typescript
const result = await attemptAsync(() => fetch(url));
result.map(user => user.name);  // Wrong! result is Promise<Try>
await result.then();  // Must await the wrapper first
```

**Desired (correct):**
```typescript
const result = attemptAsync(() => fetch(url));  // Returns AsyncResult
result.map(user => user.name);  // Works! AsyncResult has .map()
```

**Action:** `attemptAsync` must return `AsyncResult<T, Error>`, not `Promise<Try<T, Error>>`.

---

### 6.3 Short-Term Solution: Namespace Exports (v3.x)

If breaking changes are not yet viable, use **module namespaces** instead of suffixes. This is cleaner for IDE auto-completion.

**Current (messy):**
```typescript
export { map as mapTry } from "./try";
export { map as mapResult } from "./result";
```

**Recommended (clean):**
```typescript
import * as TryNS from "./try/index.js";
import * as ResultNS from "./result/index.js";
import * as AsyncNS from "./async-result/index.js";

export { TryNS as Try, ResultNS as Result, AsyncNS as Async };

// Backward compatibility aliases
/** @deprecated Use Result.map or map(res, fn) */
export const mapResult = ResultNS.map;
```

**User experience:**
```typescript
import { Result, Async, attempt } from '@deessejs/fp';

const r = attempt(() => 1);
Result.map(r, x => x + 1);  // Clean, perfect autocomplete
Async.map(asyncResult, fn);  // Same
```

---

### 6.4 About Higher-Kinded Types (HKT)

**Are HKTs necessary?** No.

HKTs (Higher-Kinded Types) require Defunctionalization (the "URI" pattern used by fp-ts) and introduce:
- Abysmal learning curve for users
- Cryptic TypeScript errors with phantom interfaces (`Kind<F, A>`)
- Complexity that defeats the "lightweight" goal of `@deessejs/fp`

**The Senior recommendation:** Use simple function overloads. This gives:
- Clean autocomplete
- Readable go-to-definition
- No complex type wrappers
- 90% of HKT power with 10% of the complexity

---

### 6.5 Recommended Action Plan

#### Immediate (v3.2) - No Breaking Changes

1. **Update documentation** to reflect actual exports
2. **Add namespace exports** (`Try`, `Result`, `Async`)
3. **Fix `tapErr`** (already done in partial fix)
4. **Add deprecation notices** on suffixed exports pointing to namespace exports

#### Medium-Term (v3.3) - Incremental Improvements

1. **Export unified `map`, `flatMap` at root** using overloads
2. **Add `success`/`failure` aliases** for `ok`/`err` (already done)
3. **Improve type guard error messages**

#### Long-Term (v4.0 - Breaking Change Required)

1. **Merge Try into Result** - Remove `Try` type, make `attempt()` return `Result<T, Error>`
2. **Fix `attemptAsync`** - Return `AsyncResult<T, Error>` instead of `Promise<Try<T, Error>>`
3. **Full unified API** - `map`, `flatMap`, `tap`, etc. at root with smart overloads
4. **Remove suffix exports** - Break backward compatibility for cleaner API

---

### 6.6 Architectural Wisdom

> "Do not fix documentation to match a poor API design. Change the API to be as simple as the documentation (and the user) hoped."

The success of `@deessejs/fp` depends on **making error handling invisible**. If a user must think about which `map` to import, the library has failed its mission of simplification.

**Goal:** User writes `map(result, fn)` and it "just works" - with perfect type inference and autocomplete.

---

## 7. Conclusion

Issue #303 correctly identifies that `@deessejs/fp` has significant usability problems. However, the root cause is not just missing exports or documentation errors—it's a **fundamental design tension** between:

1. **Type safety** - Each type has specific constraints that prevent unification
2. **API simplicity** - Users want a single `map` function that "just works"
3. **Backward compatibility** - Existing API cannot be broken without major version bump

The partial fix addresses surface issues but cannot solve the deeper problem without a breaking API change.

**The strategic path forward:**
- Short-term: Namespace exports (`Result.map`) to improve DX without breaking changes
- Long-term: v4 with Try merge + unified `map` via overloads + `attemptAsync` returning `AsyncResult`

A complete solution requires a v4.0.0 release with significant API redesign—but the architecture is sound and the path is clear.

---

## References

- Issue #303: https://github.com/nesalia-inc/fp/issues/303
- Branch: `fix/issue-303-unified-api`
- Package: `@deessejs/fp` v3.1.1
- Test results: 549 tests passing, 0 type errors
- Senior Architect Review: Strategic Direction provided 2026-04-22

---

**Document generated:** 2026-04-22
**Last updated:** 2026-04-22 (added strategic direction from senior architect review)
**Location:** `reports/issues/303-usability-deep-analysis.md`