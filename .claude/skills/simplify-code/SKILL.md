---
name: simplify-code
description: Analyze code complexity and propose simplifications to minimize branching using @deessejs/core patterns. Use @deessejs/core Error, Result, Maybe, Try to replace conditionals with functional transformations. Use when reviewing PRs, refactoring, or asked "how can we simplify this code?". Proposes GitHub issues with actionable suggestions. Supports --path, --focus, --report flags.
disable-model-invocation: true
allowed-tools: Read,Grep,Glob,Bash
---

# Code Simplification Skill

Minimize branches using @deessejs/core functional patterns with structured domain errors.

## Quick Usage

```bash
/simplify-code
/simplify-code --path=src/features/auth
/simplify-code --focus=conditionals
/simplify-code --report
```

## Core Philosophy

### The Goal: Dumb-Simple Code

The purpose of simplification is not to write "clever" code. It is to write code that:

1. **Has as few execution paths as possible** - Every branch is a path that must be tested
2. **Is completely deterministic** - Same input always produces same output
3. **Reads in a straight line** - No mental gymnastics to follow logic
4. **Requires minimal tests for full coverage** - Fewer paths = fewer tests needed

### Why Branches Are Evil

Every branch you write asks these questions:

| Branch Type | Mental Cost | Testing Cost |
|-------------|-------------|--------------|
| `if` | Must trace both paths | 2 tests minimum |
| `if/else if/else` | Must trace all paths | N tests minimum |
| `&&` / `||` | Must understand precedence | 2^n combinations |
| `switch` | Must check all cases | N tests + default |
| `catch` | Must trace error path | 2 more tests |

**A function with 5 branches needs 2^5 = 32 tests for full path coverage.**

**A function with 1 branch needs only 2 tests.**

### The Ideal

```
Input -> Processing -> Output
```

No branches. No conditionals. No exceptions to track in your head.

### @deessejs/core: The Tool for Branch Minimization

@deessejs/core provides functional types that **eliminate branches**:

| Type | Use WHEN | Replaces |
|------|----------|----------|
| `Error<T>` | Domain errors with structured args | Custom error classes |
| `Result<T, E>` | Operation can succeed or fail | try/catch, if/else error handling |
| `Maybe<T>` | Value may or may not exist | null checks, undefined checks |
| `Try<T>` | Function might throw | try/catch blocks |
| `AsyncResult<T, E>` | Async operation with error handling | async/await with try/catch |

These types transform **branching logic** into **functional composition**.

## The @deessejs/core Error System

The `Error` type from @deessejs/core provides **structured domain errors** with:

- **Structured args** - domain-specific error data with Zod validation
- **Notes** - additional context for debugging
- **Cause chaining** - trace error provenance through the call stack
- **Enrichment** - add context without losing original error

### Why Use Error Over Native Error?

```typescript
// Native Error - limited information
throw new Error('Processing failed');

// @deessejs/core Error - structured with context
const error = ProcessingError({ input: 'user data' })
  .addNotes('Attempted to process at 14:32:00', 'User: john')
  .from(causeError);
```

### Creating Domain Errors with Zod

```typescript
import { error } from '@deessejs/core';
import { z } from 'zod';

// Define error with schema validation
const ValidationError = error({
  name: 'ValidationError',
  schema: z.object({
    field: z.string(),
    value: z.string().optional(),
    reason: z.string()
  }),
  message: (args) => `"${args.field}" is invalid: ${args.reason}`
});

const err = ValidationError({ field: 'email', reason: 'missing @' });
err.name;     // 'ValidationError'
err.args;     // { field: 'email', reason: 'missing @' }
err.message;  // '"email" is invalid: missing @'
```

## Simplification Patterns with @deessejs/core

### 1. Replace Null Checks with Maybe

**Before (Null checks everywhere):**

```typescript
function getCity(user: User | null): string {
  if (!user) return 'Unknown';
  if (!user.address) return 'Unknown';
  if (!user.address.city) return 'Unknown';
  return user.address.city;
}
```

**After (Maybe - no branches):**

```typescript
import { some, fromNullable, flatMap } from '@deessejs/core';

function getCity(user: Maybe<User>): Maybe<string> {
  return flatMap(user, u =>
    flatMap(fromNullable(u.address), a =>
      fromNullable(a.city)
    )
  );
}

// Usage:
const city = getCity(some(user)).getOrElse('Unknown');
```

### 2. Replace try/catch with Try + Error

**Before (try/catch branches):**

```typescript
function readConfig(): Config {
  try {
    const content = fs.readFileSync('config.json', 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error('Invalid JSON: ' + e.message);
    }
    if (e.message.includes('ENOENT')) {
      throw new Error('File not found');
    }
    throw e;
  }
}
```

**After (Try with Error enrichment - no branches):**

```typescript
import { attempt, getOrElse, error } from '@deessejs/core';
import { z } from 'zod';

const ConfigError = error({
  name: 'ConfigError',
  schema: z.object({
    path: z.string(),
    reason: z.enum(['PARSE_ERROR', 'NOT_FOUND', 'PERMISSION_DENIED'])
  }),
  message: (args) => `Config error [${args.reason}]: ${args.path}`
});

const readConfig = (path: string): Try<Config> =>
  attempt(
    () => JSON.parse(fs.readFileSync(path, 'utf-8')),
    (caught) => ConfigError({
      path,
      reason: caught instanceof SyntaxError ? 'PARSE_ERROR'
             : caught.message.includes('ENOENT') ? 'NOT_FOUND'
             : 'PERMISSION_DENIED'
    }).addNotes('Failed to load config file')
  );

const config = readConfig('config.json')
  .getOrElse({ defaults: true });
```

### 3. Replace if/else Chains with Result + Error

**Before (if/else chain):**

```typescript
function calculateDiscount(user: User, cart: Cart): number {
  if (user.isPremium) {
    if (user.years >= 5) {
      if (cart.total > 1000) return 0.3;
      return 0.2;
    }
    if (cart.total > 500) return 0.15;
    return 0.1;
  }
  if (user.isStudent) {
    if (cart.total > 500) return 0.2;
    return 0.1;
  }
  return 0;
}
```

**After (Data-driven with Result + Error - no branches):**

```typescript
import { ok, err, flatMap, error } from '@deessejs/core';
import { z } from 'zod';

const DiscountError = error({
  name: 'DiscountError',
  schema: z.object({
    userId: z.string(),
    reason: z.enum(['INVALID_USER', 'TIER_NOT_FOUND', 'AMOUNT_INVALID'])
  })
});

const DISCOUNT_RATES = {
  premium: {
    years5: { high: 0.3, low: 0.2 },
    years2: { high: 0.2, low: 0.15 },
    default: { high: 0.15, low: 0.1 }
  },
  student: {
    high: 0.2,
    low: 0.1
  },
  default: { high: 0, low: 0 }
} as const;

function calculateDiscount(user: User, cart: Cart): Result<number, ReturnType<typeof DiscountError>> {
  if (!user) return err(DiscountError({ userId: 'unknown', reason: 'INVALID_USER' }));

  const tier = user.isPremium ? 'premium' : user.isStudent ? 'student' : 'default';
  const bracket = user.isPremium && user.years >= 5 ? 'years5'
                 : user.isPremium && user.years >= 2 ? 'years2' : 'default';
  const threshold = cart.total > (tier === 'premium' ? 1000 : 500);

  const rate = DISCOUNT_RATES[tier]?.[bracket]?.[threshold ? 'high' : 'low']
             ?? DISCOUNT_RATES.default[threshold ? 'high' : 'low'];

  return ok(rate);
}
```

### 4. Replace Switch with Lookup Table

**Before (switch statement):**

```typescript
function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Awaiting review';
    case 'approved': return 'Ready to publish';
    case 'rejected': return 'Not approved';
    case 'draft': return 'Work in progress';
    case 'archived': return 'No longer active';
    default: return 'Unknown status';
  }
}
```

**After (Lookup table - no switch):**

```typescript
import { fromNullable } from '@deessejs/core';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting review',
  approved: 'Ready to publish',
  rejected: 'Not approved',
  draft: 'Work in progress',
  archived: 'No longer active'
};

function getStatusLabel(status: string): string {
  return fromNullable(STATUS_LABELS[status]).getOrElse('Unknown status');
}
```

### 5. Replace Promise Catch with AsyncResult + Error

**Before (async/await with try/catch):**

```typescript
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (e) {
    console.error('Fetch failed:', e);
    throw e;
  }
}
```

**After (AsyncResult with Error - no try/catch):**

```typescript
import { fromPromise, ok, err, isOk, error } from '@deessejs/core';
import { z } from 'zod';

const NetworkError = error({
  name: 'NetworkError',
  schema: z.object({
    url: z.string(),
    status: z.number().optional(),
    message: z.string()
  }),
  message: (args) => `Network error fetching ${args.url}: ${args.status ?? args.message}`
});

const fetchUser = (id: string): AsyncResult<User, ReturnType<typeof NetworkError>> =>
  fromPromise(
    fetch(`/api/users/${id}`)
      .then(async response => {
        if (!response.ok) {
          return err(NetworkError({ url: `/api/users/${id}`, status: response.status, message: '' }));
        }
        return ok(await response.json());
      })
  );

// Caller: functional composition, no try/catch
const result = await fetchUser(id);

if (isOk(result)) {
  console.log(result.value.name);
} else {
  console.error(result.error.message);
  // Access structured args: result.error.args.url, result.error.args.status
}
```

### 6. Replace Error Propagation with flatMap Chain + Error Chaining

**Before (error propagation with branches):**

```typescript
function processOrder(orderId: string): OrderResult {
  const order = findOrder(orderId);
  if (!order) throw new Error('ORDER_NOT_FOUND');

  const user = findUser(order.userId);
  if (!user) throw new Error('USER_NOT_FOUND');

  const payment = processPayment(order.total);
  if (!payment.success) throw new Error('PAYMENT_FAILED');

  return { success: true, order, user, payment };
}
```

**After (flatMap chain with Error cause chaining - linear flow):**

```typescript
import { ok, err, flatMap, error, fromNullable } from '@deessejs/core';
import { z } from 'zod';

const OrderError = error({
  name: 'OrderError',
  schema: z.object({
    orderId: z.string(),
    reason: z.enum(['NOT_FOUND', 'USER_NOT_FOUND', 'PAYMENT_FAILED'])
  }),
  message: (args) => `Order ${args.orderId}: ${args.reason}`
});

const processOrder = (orderId: string): Result<OrderSuccess, ReturnType<typeof OrderError>> => {
  const order = findOrder(orderId);
  if (!order) {
    return err(OrderError({ orderId, reason: 'NOT_FOUND' }));
  }

  const user = findUser(order.userId);
  if (!user) {
    return err(
      OrderError({ orderId, reason: 'USER_NOT_FOUND' })
        .addNotes(`User ${order.userId} not found while processing order`)
    );
  }

  const payment = processPayment(order.total);
  if (!payment.success) {
    return err(
      OrderError({ orderId, reason: 'PAYMENT_FAILED' })
        .addNotes(`Payment failed for order ${orderId}`, `Amount: ${order.total}`)
    );
  }

  return ok({ order, user, payment });
};
```

### 7. Error Enrichment with Notes and Cause

**Error enrichment adds context without creating branches:**

```typescript
import { error, err, ok } from '@deessejs/core';
import { z } from 'zod';

const ValidationError = error({
  name: 'ValidationError',
  schema: z.object({
    field: z.string(),
    value: z.string().optional()
  }),
  message: (args) => `Validation failed for "${args.field}"`
});

const ParsingError = error({
  name: 'ParsingError',
  schema: z.object({ raw: z.string() }),
  message: (args) => `Parse error: ${args.raw.slice(0, 50)}`
});

function validateAndParse(input: string) {
  // Step 1: Validate input format
  if (!input || input.length === 0) {
    return err(
      ValidationError({ field: 'input' })
        .addNotes('Empty input received at validateAndParse')
    );
  }

  // Step 2: Parse - if it fails, chain the error with cause
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    return err(
      ParsingError({ raw: input })
        .from(ValidationError({ field: 'input' })
          .addNotes('JSON.parse failed'))
    );
  }

  return ok(parsed);
}

// Accessing error chain:
// result.error.name           // 'ParsingError'
// result.error.cause          // Maybe<Error>
// result.error.cause.map(e => e.name)  // Some('ValidationError')
// result.error.notes          // ['JSON.parse failed']
```

## Metrics

### Complexity = Branch Count

| Score | Paths | Tests for Full Coverage |
|-------|-------|------------------------|
| 1 | 1 | 1 |
| 5 | 5 | 5 |
| 10 | 10 | 10 |
| 20 | 20 | 20 |
| 50 | 50 | 50 (impractical) |

### @deessejs/core Impact on Complexity

| Pattern | Branches Reduced | Complexity Reduction |
|---------|------------------|----------------------|
| Maybe for null | N null checks | N -> 1 |
| Try + Error for exceptions | try/catch blocks | 2N -> N |
| Result + Error for errors | if/else error checks | N -> 0 |
| Error cause chaining | error propagation branches | N -> 1 |
| all() for parallel | sequential if checks | N -> 1 |
| Lookup tables | switch/if chains | N -> 1 |

### Target: Complexity Under 5

| Complexity | Rating | Action |
|------------|--------|--------|
| 1-3 | Ideal | Ship it |
| 4-5 | Acceptable | Small improvements OK |
| 6-10 | Warning | Should simplify |
| 11-20 | High Risk | Must simplify |
| 21+ | Very High | Rewrite recommended |

## Analysis Process

### Step 1: Identify Branch Clusters

```bash
# Count try/catch blocks
grep -c "try\|catch" src/**/*.ts

# Count null checks
grep -c "=== null\|!== null\|=== undefined" src/**/*.ts

# Count if/else chains
grep -c "else if" src/**/*.ts

# Count switch statements
grep -c "switch\|case" src/**/*.ts
```

### Step 2: Categorize Simplification Opportunities

| Pattern | @deessejs/core Solution | Impact |
|---------|-------------------------|--------|
| Null checks | Maybe | High |
| try/catch | Try + Error | High |
| if/else errors | Result + Error | High |
| Error propagation | Error cause chaining | Medium |
| Promise catch | AsyncResult + Error | Medium |
| Switch chains | Lookup tables | Medium |
| Sequential awaits | all(), race() | Medium |

### Step 3: Prioritize

| Simplification | Risk | Benefit | Effort |
|----------------|------|---------|--------|
| Maybe for lookups | Low | High | 15 min |
| Try + Error for parsing | Low | High | 20 min |
| Result + Error for validation | Medium | High | 1 hour |
| AsyncResult + Error for API calls | Medium | High | 2 hours |

## Report Format

```markdown
# Code Simplification Report

## Executive Summary

**Goal:** Use @deessejs/core to eliminate branches using Error, Result, Maybe, and Try.

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Try/catch blocks | 24 | <5 | -80% |
| Null checks | 89 | <20 | -77% |
| if/else chains | 45 | <10 | -78% |
| Complexity > 10 | 6 files | 0 | -100% |

---

## Simplification Opportunities

### 1. Replace null checks with Maybe

**File:** src/user/profile.ts
**Null checks eliminated:** 8
**Pattern:** fromNullable + flatMap

```typescript
// Before: 8 branches for nested property access
function getCity(user) {
  if (!user) return null;
  if (!user.address) return null;
  return user.address.city;
}

// After: 0 branches
const getCity = (user: Maybe<User>) =>
  flatMap(user, u =>
    flatMap(fromNullable(u.address), a =>
      fromNullable(a.city)
    )
  ).getOrElse(null);
```

---

### 2. Replace try/catch with Try + Error

**File:** src/config/loader.ts
**try/catch blocks eliminated:** 3

```typescript
// Define domain errors with Zod
const ConfigError = error({
  name: 'ConfigError',
  schema: z.object({
    path: z.string(),
    reason: z.enum(['PARSE_ERROR', 'NOT_FOUND'])
  })
});

// Use Try with Error enrichment
const readConfig = (path: string): Try<Config> =>
  attempt(
    () => JSON.parse(fs.readFileSync(path, 'utf-8')),
    (caught) => ConfigError({ path, reason: 'PARSE_ERROR' })
      .addNotes('Failed to parse config')
  );
```

---

## GitHub Issue Draft

```markdown
## Simplify error handling with @deessejs/core Error system

### Problem

Functions have high cyclomatic complexity due to:
- 24 try/catch blocks
- 89 null checks
- 45 if/else error chains

Every branch is a potential bug shelter requiring tests.

### Solution

Use @deessejs/core types with Error to eliminate branches:

1. **Maybe** for null checks (89 -> 20)
2. **Try + Error** for exceptions with cause chaining (24 -> 5)
3. **Result + Error** for error handling with structured args (45 -> 10)
4. **AsyncResult + Error** for async errors (12 -> 3)

### Files to Update

- src/user/profile.ts (Maybe)
- src/config/loader.ts (Try + Error)
- src/api/client.ts (AsyncResult + Error)
- src/validation/*.ts (Result + Error)

### Effort

~6 hours across 8 files
```

---

## Confirmation

**This skill will NOT create issues without your confirmation.**
```

## When to Use Each Type

| Situation | Use | Why |
|-----------|-----|-----|
| Value may not exist | `Maybe<T>` | Null safety without branches |
| Operation can fail with structured error | `Result<T, Error<T>>` | Explicit errors with Zod validation |
| Function might throw | `Try<T>` | Wrap legacy code |
| Async operation fails | `AsyncResult<T, Error<T>>` | Async with typed errors |
| Multiple success values | Discriminated unions | Pattern matching without switch |
| Add context to error | `Error.addNotes()` | Debugging without branching |
| Chain error cause | `Error.from()` | Trace error provenance |

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Should Be |
|--------------|---------|-----------|
| Nested ifs | Creates 2^n paths | Maybe, early returns |
| try/catch everywhere | Hides errors in types | Try + Error |
| Custom Error classes | Boilerplate, no Zod | @deessejs/core Error |
| Error as string | No structured data | Error with Zod schema |
| Swallowing errors | Lost context | Error with cause chaining |
| Switch for lookup | OCP violation | Lookup table |
| Promise.then().catch() | Callback hell | AsyncResult with map/flatMap |

## Senior Advice

> "Every branch you add is a promise to test it. Every test you skip is a bug waiting to happen."

> "@deessejs/core is not about functional programming dogma. It's about eliminating branches that hide bugs."

> "The best code has no branches. Error, Result, Maybe, and Try exist to make that possible."

> "If you find yourself writing if (error) return error; that's not error handling - that's branch counting."

> "A function that returns Result<User, ValidationError> tells the caller everything. A function that throws tells them nothing."

> "Maybe is not about optional values. It's about making absence explicit in the type system."

> "Error.addNotes() and Error.from() are not for decoration. They're for debugging - so you can trace exactly where and why an error occurred."

> "Dumb-simple code is the hardest to write. It requires understanding the problem deeply enough that the solution becomes obvious."

## @deessejs/core API Reference

### Error

```typescript
import { error, err } from '@deessejs/core';
import { z } from 'zod';

// Create Error builder with Zod schema
const ValidationError = error({
  name: 'ValidationError',
  schema: z.object({
    field: z.string(),
    reason: z.string()
  }),
  message: (args) => `"${args.field}": ${args.reason}`
});

// Create error instance
const domainError = ValidationError({ field: 'email', reason: 'invalid format' });

// Enrich with notes
domainError.addNotes('Context: user registration', 'Timestamp: 2024-01-15');

// Chain cause
const causedError = NewError({ data: 'x' }).from(originalError);

// Use with Result
const result = err(domainError);
result.error.name;     // 'ValidationError'
result.error.args;     // { field: 'email', reason: 'invalid format' }
result.error.notes;    // ['Context: user registration', 'Timestamp: 2024-01-15']
result.error.cause;    // Maybe<Error> - the chained error
```

### Result

```typescript
import { ok, err, isOk, isErr, map, flatMap, getOrElse, match } from '@deessejs/core';

// Create
ok(value): Result<T, never>
err(error): Result<never, E>

// Transform
map(result, fn): Result
flatMap(result, fn): Result
mapErr(result, fn): Result

// Extract
getOrElse(result, default): T
match(result, onOk, onErr): R
```

### Maybe

```typescript
import { some, none, fromNullable, isSome, isNone, flatMap, getOrElse } from '@deessejs/core';

// Create
some(value): Maybe<T>
none(): Maybe<never>
fromNullable(value): Maybe<T>

// Transform
map(maybe, fn): Maybe
flatMap(maybe, fn): Maybe
filter(maybe, predicate): Maybe

// Extract
getOrElse(maybe, default): T
```

### Try

```typescript
import { attempt, isOk, isErr, map, getOrElse } from '@deessejs/core';

// Create
attempt(fn): Try<T>
attempt(fn, onError): Try<T>

// Transform
map(try, fn): Try
flatMap(try, fn): Try

// Extract
getOrElse(try, default): T
unwrap(try): T
```

### AsyncResult

```typescript
import { fromPromise, okAsync, errAsync, all, race, isOk, map, flatMap } from '@deessejs/core';

// Create
fromPromise(promise): AsyncResult<T, Error>
okAsync(value): AsyncResult<T, never>
errAsync(error): AsyncResult<never, E>

// Combine
all(...results): AsyncResult<T[], E>
race(...results): AsyncResult<T, E>

// Transform
map(result, fn): AsyncResult
flatMap(result, fn): AsyncResult
```

## Additional Resources

- @deessejs/core documentation: https://github.com/deessejs/core
- For architecture review, see [senior-review-skill](../senior-review-skill/SKILL.md)
- For dead code detection, see [dead-code-skill](../dead-code-skill/SKILL.md)
- For documentation scoring, see [doc-score-skill](../doc-score-skill/SKILL.md)
