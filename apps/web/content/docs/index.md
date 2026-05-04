---
title: Quick Start
description: Get started with @deessejs/fp in 5 minutes
icon: Zap
---

import { Cards, Card } from 'fumadocs-ui/components/card';

This guide walks you through the essentials of @deessejs/fp. You'll learn how to handle errors explicitly in your TypeScript code without relying on try/catch.

## What is @deessejs/fp?

@deessejs/fp is a TypeScript library that provides **type-safe error handling**. Instead of using exceptions that can crash your app, you work with `Result` types that make success and failure explicit in your code.

**Why is this important?** Traditional error handling with try/catch is invisible to TypeScript's type system. Functions can throw, but the type doesn't show it. @deessejs/fp fixes this by making errors part of the type signature.

## Key Features

<Cards>
  <Card title="Result" href="/docs/core/result">
    Explicit success and failure types
  </Card>
  <Card title="Maybe" href="/docs/core/maybe">
    Handle optional values without null/undefined
  </Card>
  <Card title="Try" href="/docs/core/try">
    Wrap throwing functions safely
  </Card>
  <Card title="Async" href="/docs/async/retry">
    Handle async operations with error tracking
  </Card>
</Cards>

## Terminology

Before you start, here are the key terms you'll encounter:

| Term | Description |
|------|-------------|
| **Result** | A type that represents either success (`Ok`) or failure (`Err`) |
| **Ok** | The success variant of Result, containing a value |
| **Err** | The failure variant of Result, containing an error |
| **Maybe** | A type that represents a value that may or may not exist (`Some` or `None`) |
| **Try** | A pattern for wrapping functions that might throw exceptions |
| **flatMap** | Chain operations that can fail without nesting |
| **pipe** | Compose functions in a readable linear flow |

## Requirements

Before you begin, make sure you have:

- **Node.js 18+** — Required for modern JavaScript features
- **TypeScript 5.0+** — For full type inference
- **pnpm, npm, or yarn** — For package management

## Installation

Install @deessejs/fp using your preferred package manager:

```bash
# pnpm (recommended)
pnpm add @deessejs/fp

# npm
npm install @deessejs/fp

# yarn
yarn add @deessejs/fp
```

## Your First Result

The `Result` type is the core of @deessejs/fp. It represents a value that can be either a success (`Ok`) or a failure (`Err`).

### Step 1: Create Results

You create Results using the `ok()` and `err()` factory functions:

```typescript
import { ok, err, isOk } from '@deessejs/fp';

// Create a success result
const success = ok(42);
// { ok: true, value: 42 }

// Create a failure result
const failure = err('Something went wrong');
// { ok: false, error: 'Something went wrong' }
```

### Step 2: Check and Extract Values

Use the `isOk()` type guard to narrow the type:

```typescript
if (isOk(success)) {
  console.log(success.value); // TypeScript knows this is 42
} else {
  console.log(failure.error); // TypeScript knows this is the error
}
```

### Step 3: Transform Values

Use `map` to transform the value inside Ok, and `flatMap` to chain operations:

```typescript
import { ok, err, map, flatMap, getOrElse } from '@deessejs/fp';

const divide = (a: number, b: number) =>
  b === 0 ? err('Division by zero') : ok(a / b);

// Transform the value (doubling 10 gives you 20)
const doubled = map(ok(10), x => x * 2);
// Ok(20)

// Chain operations (dividing 10 by 2 gives you 5)
const result = flatMap(ok(10), x => divide(x, 2));
// Ok(5)

// When you divide by zero, you get an error
const errorResult = flatMap(ok(10), x => divide(x, 0));
// Err('Division by zero')
```

### Step 4: Handle Errors Gracefully

Extract values safely with `getOrElse`:

```typescript
const value = getOrElse(result, 0); // 5
const safeValue = getOrElse(errorResult, 0); // 0 (uses default)
```

## Why Not Just Use try/catch?

You might be wondering: why not just use try/catch? Here's the problem:

```typescript
// ❌ The problem with try/catch
function parseJSON(input: string): User {
  return JSON.parse(input); // Type says returns User, but can throw!
}

// TypeScript has no idea this can fail
const user = parseJSON(data); // Might crash!
```

With @deessejs/fp, the type system forces you to handle errors:

```typescript
// ✅ Explicit error handling
import { ok, err, isOk } from '@deessejs/fp';

function parseJSON(input: string): Result<User, Error> {
  try {
    return ok(JSON.parse(input));
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

// Now TypeScript knows this can fail
const result = parseJSON(data);

if (isOk(result)) {
  console.log(result.value.name); // Safe!
} else {
  console.error('Parse failed:', result.error.message);
}
```

## Common Patterns

### Pattern 1: Safe Division

```typescript
import { ok, err, flatMap, getOrElse } from '@deessejs/fp';

const safeDivide = (a: number, b: number) =>
  b === 0
    ? err('Cannot divide by zero')
    : ok(a / b);

// Usage
const result = safeDivide(10, 2)
  .flatMap(x => safeDivide(x, 2))  // 10 / 2 = 5, then 5 / 2 = 2.5
  .flatMap(x => safeDivide(x, 0));   // Error!

console.log(getOrElse(result, 0)); // 0 (because of the error)
```

### Pattern 2: Optional Values with Maybe

When a value might be null or undefined, use `Maybe`:

```typescript
import { some, none, fromNullable, map, getOrElse } from '@deessejs/fp';

const user = fromNullable(findUserById(123));

// Transform if present
const upperName = map(user, u => u.name.toUpperCase());

// Get with default
const displayName = getOrElse(upperName, 'Anonymous');
```

### Pattern 3: Composing with pipe

Use `pipe` for readable transformations:

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

## Anti-Patterns

### ❌ Don't Forget to Handle Errors

```typescript
// ❌ Bad: Ignoring the error type
const result = parseJSON(data);
// If you forget to check isOk(), you might access .value on an Err!

// ✅ Good: Always handle both cases
const result = parseJSON(data);
if (isOk(result)) {
  console.log(result.value);
} else {
  console.error(result.error.message);
}
```

### ❌ Don't Use try/catch for Expected Errors

```typescript
// ❌ Bad: Using exceptions for expected failures
function findUser(id: string): User {
  const user = database.find(id);
  if (!user) throw new Error('User not found'); // Exceptions are for UNEXPECTED errors
  return user;
}

// ✅ Good: Use Result for expected failures
import { ok, err } from '@deessejs/fp';

function findUser(id: string): Result<User, Error> {
  const user = database.find(id);
  if (!user) return err(new Error('User not found'));
  return ok(user);
}
```

## FAQ

<Accordions>
  <Accordion title="When should I use Result vs Maybe?">

Use **Result** when an operation can fail and you need to know why. Use **Maybe** when a value simply might not exist (null/undefined) but there's no error condition.

**Example Result:** Fetching a user from an API might fail (network error, 404, etc.)
**Example Maybe:** Looking up a user in a cache where they simply might not be present

  </Accordion>
  <Accordion title="Does @deessejs/fp replace try/catch completely?">

No. Try/catch is still appropriate for truly unexpected errors — like programming bugs or system failures. Result is for expected failures that you want to handle explicitly.

  </Accordion>
  <Accordion title="What's the performance impact?">

@deessejs/fp has zero runtime dependencies and is optimized for minimal overhead. The type checking happens at compile time, so there's no performance penalty at runtime.

  </Accordion>
</Accordions>

## Next Steps

<Cards>
  <Card title="Result" href="/docs/core/result">
    Deep dive into Result type with all operations
  </Card>
  <Card title="Maybe" href="/docs/core/maybe">
    Handle optional values without null/undefined
  </Card>
  <Card title="Error" href="/docs/core/error">
    Create structured domain errors
  </Card>
  <Card title="Comparisons" href="/docs/comparisons">
    How @deessejs/fp compares to other libraries
  </Card>
</Cards>
