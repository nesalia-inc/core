# traverse Implementation Design for Result and Maybe

## Issue Summary

Issue #299: Generic traverse for Result and Maybe types. Currently `traverse` only exists for `AsyncResult`. Users need it for `Result` and `Maybe` to process arrays with fallible transformations.

## Analysis

### Current State

1. **AsyncResult.traverse** (existing):
   ```typescript
   // packages/fp/src/async-result/builder.ts:597-607
   export const traverse = async <T, U, E>(
     items: T[],
     fn: (item: T) => AsyncResult<U, E>
   ): Promise<AsyncResult<U[], E>> => {
     const results = await Promise.all(items.map(fn));
     const firstErr = results.find((r) => isErr(r)) as AsyncErr<E> | undefined;
     if (firstErr) {
       return createAsyncResult<U[], E>(Promise.resolve({ ok: false as const, error: firstErr.error }));
     }
     return createAsyncResult<U[], E>(Promise.resolve({ ok: true as const, value: results.map((r) => (r as AsyncOk<U>).value) }));
   };
   ```
   - Fail-fast: returns first error

2. **Result.all** (existing):
   ```typescript
   // packages/fp/src/result/builder.ts:282-288
   export const all = <T, E extends Error>(...results: Array<Result<T, E>>): Result<T[], E> => {
     const firstErr = results.find(isErr);
     if (firstErr) {
       return createErr(firstErr.error);
     }
     return createOk(results.map((r) => (r as Ok<T, E>).value));
   };
   ```
   - Fail-fast: returns first error

3. **Maybe.all** (existing):
   ```typescript
   // packages/fp/src/maybe/builder.ts:270-280
   export const all<T>(first: Maybe<T> | readonly Maybe<T>[], ...rest: Maybe<T>[]): Maybe<T[]> {
     const maybes: Maybe<T>[] = Array.isArray(first) ? first : [first, ...rest];
     const values: T[] = [];
     for (const maybe of maybes) {
       if (isNone(maybe)) {
         return none();
       }
       values.push(maybe.value);
     }
     return some(values);
   }
   ```
   - Fail-fast: returns None on first None

### Design Patterns Observed

1. **Standalone functions** (not methods on types) - consistent with FP rules
2. **Fail-fast by default** - `all` returns first error/None
3. **Curried signature for high-order usage** - e.g., `traverse(items, fn)` pattern

## Design Decisions

### 1. Fail-Fast vs Accumulate-All for Result.traverse

**Decision: Fail-Fast (return first error)**

**Rationale:**

| Aspect | Fail-Fast | Accumulate-All |
|--------|-----------|----------------|
| Performance | O(n) worst case, exits early | O(n) always |
| Error context | Limited - only first error | Rich - all errors |
| Use case alignment | Single failure = reject | Validation: collect all issues |
| Consistency | Matches existing `all()` | New capability |
| API complexity | Simple | Requires error accumulation type |

**Arguments for fail-fast:**
1. **Consistency with existing `all()`** - The existing `Result.all` uses fail-fast. `traverse` should behave the same way to avoid cognitive dissonance.
2. **Performance** - Fail-fast is strictly more efficient when errors are typically singular.
3. **Simplicity** - Single error return type matches the base `Result<T, E>` type.
4. **Industry standard** - fp-ts/neverthrow's `traverse` is fail-fast by default.
5. **For accumulation** - Users can use `allSettled` pattern (but we don't have that for Result yet) or they can map/reduce manually.

**Recommendation:** Implement fail-fast first. If users need accumulation, they can:
- Use a two-pass approach: first check all errors, then process
- Use `Result<[U[], E[]], E[]>` pattern (allSettled-like)
- This can be added later as `traverseAll` or `traverseSettled` if needed

### 2. Maybe.traverse Behavior

**Decision: Fail-Fast (return None on first None)**

This is the only sensible behavior because:
- `Maybe` has no error type to accumulate
- Returning `Some<Maybe<U>[]>` where some are `None` makes no semantic sense
- Matches the pattern of `Maybe.all()`

### 3. Placement

**Recommendation: Add to `builder.ts` files in each module, then export through `index.ts`**

For Result:
- Add to: `packages/fp/src/result/builder.ts`
- Export from: `packages/fp/src/result/index.ts`
- Re-export through: `packages/fp/src/index.ts` as `traverseResult`

For Maybe:
- Add to: `packages/fp/src/maybe/builder.ts`
- Export from: `packages/fp/src/maybe/index.ts`
- Re-export through: `packages/fp/src/index.ts` as `traverseMaybe`

### 4. Function vs Method

**Decision: Standalone function, not method on Result/Maybe**

Per the project's FP rules:
> All operations should be standalone functions, not methods on objects

The existing `traverse` for AsyncResult is also a standalone function.

## Implementation Designs

### Result.traverse

```typescript
/**
 * Transforms an array of items by applying a fallible function to each,
 * short-circuiting on the first error (fail-fast semantics).
 *
 * This is the monadic traverse operation for Result - it applies a function
 * that may fail to each element of an array, collecting successful results
 * or stopping at the first failure.
 *
 * @typeParam T - The type of input items
 * @typeParam U - The type of output items
 * @typeParam E - The type of error (must extend Error)
 * @param items - The array of items to traverse
 * @param fn - The fallible transformation function: (item: T) => Result<U, E>
 * @returns Result<U[], E> - Ok with transformed array if all succeed, Err with first error otherwise
 *
 * @example
 * import { ok, err, traverse } from '@deessejs/fp';
 * import { error } from '@deessejs/fp';
 *
 * const ValidationError = error({ name: "ValidationError" });
 *
 * // Successful case
 * const result = traverse([1, 2, 3], (x) => ok(x * 2));
 * // Result: Ok([2, 4, 6])
 *
 * // Failure case - stops at first error
 * const result = traverse([1, 2, 3], (x) =>
 *   x === 2 ? err(ValidationError({ value: x })) : ok(x)
 * );
 * // Result: Err(ValidationError({ value: 2 }))
 *
 * @example Using with pipe
 * import { pipe } from '@deessejs/fp';
 *
 * const processItems = (items: string[]) =>
 *   pipe(
 *     items,
 *     traverse(parseInt),  // Result<number[], Error>
 *     map(nums => nums.reduce((a, b) => a + b, 0))
 *   );
 */
export const traverse = <T, U, E extends Error>(
  items: readonly T[],
  fn: (item: T) => Result<U, E>
): Result<U[], E> => {
  const results: U[] = [];
  for (const item of items) {
    const result = fn(item);
    if (isErr(result)) {
      return result; // fail-fast
    }
    results.push(result.value);
  }
  return createOk(results);
};
```

### Maybe.traverse

```typescript
/**
 * Transforms an array of items by applying a function that may return None,
 * short-circuiting on the first None (fail-fast semantics).
 *
 * This is the monadic traverse operation for Maybe - it applies a function
 * that may be absent to each element of an array, collecting present results
 * or stopping at the first absence.
 *
 * @typeParam T - The type of input items
 * @typeParam U - The type of output items
 * @param items - The array of items to traverse
 * @param fn - The optional transformation function: (item: T) => Maybe<U>
 * @returns Maybe<U[]> - Some with transformed array if all return Some, None otherwise
 *
 * @example
 * import { some, none, traverse } from '@deessejs/fp';
 *
 * // Successful case
 * const result = traverse([1, 2, 3], (x) => some(x * 2));
 * // Result: Some([2, 4, 6])
 *
 * // Failure case - stops at first None
 * const result = traverse([1, 2, 3], (x) => (x === 2 ? none() : some(x)));
 * // Result: None
 *
 * @example Using with pipe
 * import { pipe } from '@deessejs/fp';
 *
 * const getLengths = (items: string[]) =>
 *   pipe(
 *     items,
 *     traverse(s => s.length > 0 ? some(s.length) : none()),
 *     map(lengths => lengths.reduce((a, b) => a + b, 0))
 *   );
 */
export const traverse = <T, U>(
  items: readonly T[],
  fn: (item: T) => Maybe<U>
): Maybe<U[]> => {
  const results: U[] = [];
  for (const item of items) {
    const result = fn(item);
    if (isNone(result)) {
      return result; // fail-fast
    }
    results.push(result.value);
  }
  return some(results);
};
```

### Alternative: Accumulating traverse (for future consideration)

If accumulation is needed later, a separate function could be added:

```typescript
/**
 * Transforms an array by applying a fallible function to each element,
 * collecting all errors instead of stopping at the first (full validation semantics).
 *
 * Use this when you want to validate an entire batch and report all failures.
 *
 * @typeParam T - The type of input items
 * @typeParam U - The type of output items
 * @typeParam E - The type of error
 * @param items - The array of items to traverse
 * @param fn - The fallible transformation function
 * @returns Result<U[], E[]> - Ok with results if all succeed, Err with all errors otherwise
 *
 * @example
 * const result = traverseAll(
 *   [1, 2, 3],
 *   (x) => x % 2 === 0 ? ok(x) : err(ValidationError({ value: x }))
 * );
 * // Result: Err([ValidationError({ value: 1 }), ValidationError({ value: 3 })])
 */
export const traverseAll = <T, U, E extends Error>(
  items: readonly T[],
  fn: (item: T) => Result<U, E>
): Result<U[], E[]> => {
  const results: U[] = [];
  const errors: E[] = [];

  for (const item of items) {
    const result = fn(item);
    if (isErr(result)) {
      errors.push(result.error);
    } else {
      results.push(result.value);
    }
  }

  return errors.length > 0 ? createErr(errors) : createOk(results);
};
```

## Comparison with fp-ts/neverthrow

### fp-ts (Result)

```typescript
// fp-ts Result.ts
export const traverse: <T, U, E>(
  f: (t: T) => HKT<ResultKind, U, E>
) => (ta: T[]) => Result<U[], E>
```

fp-ts uses HKT for abstraction. Their traverse is fail-fast.

### neverthrow

```typescript
// neverthrow - Result.ts
traverse<T, U, E>(
  this: Result<T[], E>,
  fn: (item: T) => Result<U, E>
): Result<U[], E>

// neverthrow also has:
traverseWithIndex()
and for AsyncResult:
unsafeTraverse() // throws on error
traverseAsync() // returns Promise
```

neverthrow's traverse is also fail-fast, matching our decision.

### Key Differences

| Aspect | @deessejs/fp | fp-ts | neverthrow |
|--------|--------------|-------|------------|
| Style | Simple generic | HKT-based | Direct generic |
| Fail-fast | Yes | Yes | Yes |
| Accumulating variant | No (proposed) | No | No |
| Maybe traverse | No (proposed) | Option.traverse | No |
| Async variant | Yes | Yes (Task) | Yes |

## Exports

### packages/fp/src/result/index.ts additions

```typescript
// Add to existing exports
export { traverse } from "./builder.js";
```

### packages/fp/src/maybe/index.ts additions

```typescript
// Add to existing exports
export { traverse } from "./builder.js";
```

### packages/fp/src/index.ts additions

```typescript
// Add to Result section exports
export { traverse as traverseResult } from "./result/index.js";

// Add to Maybe section exports
export { traverse as traverseMaybe } from "./maybe/index.js";
```

## Usage Examples

### Result.traverse

```typescript
import { ok, err, traverse, pipe } from '@deessejs/fp';
import { error } from '@deessejs/fp';

const ValidationError = error({
  name: "ValidationError",
  message: (args) => `${args.field} is invalid`
});

// Parse an array of strings that may fail
const parseNumbers = (inputs: string[]): Result<number[], Error> =>
  traverse(inputs, (str) => {
    const num = parseInt(str, 10);
    return isNaN(num)
      ? err(ValidationError({ field: str }))
      : ok(num);
  });

// Validate user registrations
interface UserInput { name: string; age: number; email: string }

const validateUsers = (inputs: UserInput[]): Result<ValidUser[], Error> =>
  traverse(inputs, (input) =>
    validateName(input.name)
      .flatMap(() => validateAge(input.age))
      .flatMap(() => validateEmail(input.email))
  );

// With pipe for composition
const sumParsedNumbers = (inputs: string[]) =>
  pipe(
    inputs,
    traverse(parseInt),
    map(nums => nums.reduce((a, b) => a + b, 0))
  );
```

### Maybe.traverse

```typescript
import { some, none, traverse, pipe } from '@deessejs/fp';

// Find all users by IDs, where some IDs might not exist
const findUsers = (ids: string[]): Maybe<User[]> =>
  traverse(ids, (id) => findUserById(id));

// Extract and normalize all config values
const getConfigValues = (keys: string[]): Maybe<ConfigValue[]> =>
  traverse(keys, (key) => {
    const value = config.get(key);
    return value !== undefined ? some(value) : none();
  });

// With pipe
const getTotalLength = (items: string[]): Maybe<number> =>
  pipe(
    items,
    traverse(s => s.length > 0 ? some(s.length) : none()),
    map(lengths => lengths.reduce((a, b) => a + b, 0))
  );
```

## Testing Strategy

```typescript
// packages/fp/tests/unit/result.test.ts

describe("traverse", () => {
  it("should transform all items when all results are Ok", () => {
    const result = traverse([1, 2, 3], (x) => ok(x * 2));
    expect(isOk(result)).toBe(true);
    expect(result.value).toEqual([2, 4, 6]);
  });

  it("should return Err on first error (fail-fast)", () => {
    const result = traverse([1, 2, 3], (x) =>
      x === 2 ? err(ValidationError({ value: x })) : ok(x)
    );
    expect(isErr(result)).toBe(true);
    expect(result.error).toEqual(ValidationError({ value: 2 }));
  });

  it("should handle empty array", () => {
    const result = traverse([], (x: number) => ok(x * 2));
    expect(isOk(result)).toBe(true);
    expect(result.value).toEqual([]);
  });

  it("should work with pipe", () => {
    const result = pipe(
      [1, 2, 3],
      traverse((x) => ok(x * 2)),
      map((xs) => xs.reduce((a, b) => a + b, 0))
    );
    expect(result).toEqual(ok(12));
  });
});

// packages/fp/tests/unit/maybe.test.ts

describe("traverse", () => {
  it("should transform all items when all are Some", () => {
    const result = traverse([1, 2, 3], (x) => some(x * 2));
    expect(isSome(result)).toBe(true);
    expect(result.value).toEqual([2, 4, 6]);
  });

  it("should return None on first None (fail-fast)", () => {
    const result = traverse([1, 2, 3], (x) =>
      x === 2 ? none() : some(x)
    );
    expect(isNone(result)).toBe(true);
  });

  it("should handle empty array", () => {
    const result = traverse([], (x: number) => some(x * 2));
    expect(isSome(result)).toBe(true);
    expect(result.value).toEqual([]);
  });
});
```

## Summary of Recommendations

1. **Implement `Result.traverse`** - Fail-fast, standalone function, added to `result/builder.ts`
2. **Implement `Maybe.traverse`** - Fail-fast, standalone function, added to `maybe/builder.ts`
3. **Export through index files** - As `traverseResult` and `traverseMaybe`
4. **Consider `traverseAll` later** - For accumulating all errors (not in initial implementation)
5. **Add comprehensive tests** - Cover success, fail-fast, empty array, and composition with `pipe`
6. **Add JSDoc documentation** - With examples matching the project style
