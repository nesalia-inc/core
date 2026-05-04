---
name: unit-tests
description: Write and run unit tests using Vitest. Use this skill when the user asks to add tests, write tests, create test file, run tests, or when implementing a feature requires adding tests.
disable-model-invocation: false
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# Unit Tests Guide with Vitest

Write unit tests following Marty conventions using Vitest.

## Testing Philosophy

These principles guide every test we write:

### 1. Tests as Documentation

A developer should understand a feature by reading its tests. Tests are the **living documentation** of behavior.

```typescript
// Good: Self-explanatory behavior
it('should return the total price including tax and discount')

// Bad: Implementation detail leaks
it('should call calculateTotal with 1.2 multiplier')
```

### 2. Implementation Agnostic

We test **inputs and outputs**, not internal implementation. This allows refactoring without breaking tests.

```typescript
// Good: Tests the contract
expect(formatDate(date)).toBe('2024-01-15')

// Bad: Couples test to implementation
expect(spy).toHaveBeenCalledWith('toISOString')
```

### 3. Fast Feedback Loop

Unit tests must run in **milliseconds**. If a test takes seconds, it's not a unit test.

- Keep tests independent
- Avoid real I/O, network, or filesystem
- Use `happy-dom` for DOM testing
- Mock external services

## When to Use

- User asks to "add tests", "write tests", "create test file"
- Implementing a feature that requires tests
- User asks to "run tests" or "test this"
- Fixing a bug that should have a regression test

## When NOT to Use Unit Tests

Avoid unit testing:
- Purely **declarative code** (type definitions, configs)
- **Glue code** that just connects things (prefer integration tests)
- **Trivial one-liners** with no logic
- Code that changes frequently (too costly to maintain tests)

## DAMP vs DRY in Tests

Tests favor **DAMP** (Descriptive And Meaningful Phrases) over DRY:

```typescript
// DRY approach (harder to read)
// Creates abstraction that obscures intent
const testUser = createTestUser();
expect(processUser(testUser)).toMatchObject({ ... });

// DAMP approach (clearer intent)
expect(processUser({
  id: '123',
  name: 'Alice',
  role: 'admin'
})).toMatchObject({ name: 'Alice' });
```

**DAMP is preferred** because test readability matters more than eliminating duplication.

## Test File Naming

```
src/
├── utils/
│   └── format.ts
└── utils.test.ts    # Test file alongside source
```

| Convention | Pattern |
|------------|---------|
| Test file | `*.test.ts` or `*.spec.ts` |
| Location | Same directory as source file |
| Fixture | `*.fixture.ts` |

## Test Structure

### Basic Test

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('should format date as YYYY-MM-DD', () => {
    const result = formatDate(new Date('2024-01-15'));
    expect(result).toBe('2024-01-15');
  });
});
```

### Group Related Tests

```typescript
describe('formatDate', () => {
  describe('when given a valid date', () => {
    it('formats as YYYY-MM-DD', () => {
      expect(formatDate(new Date('2024-01-15'))).toBe('2024-01-15');
    });
  });

  describe('when given invalid date', () => {
    it('returns fallback string', () => {
      expect(formatDate(new Date('invalid'))).toBe('N/A');
    });
  });
});
```

## Naming Conventions

### Test Descriptions

Use **descriptive names** that explain the behavior:

| Pattern | Example |
|---------|---------|
| `it('should <behavior>')` | `it('should return true when value is positive')` |
| `it('should not <behavior>')` | `it('should not throw when input is valid')` |
| `it('should <behavior> when <condition>')` | `it('should throw when input is null')` |

### Avoid

- ❌ `it('works')` - Too vague
- ❌ `it('test 1')` - No context
- ❌ `it('positive')` - Unclear what it tests

## Common Matchers

```typescript
// Equality
expect(value).toBe(expected)      // Strict equality (===)
expect(value).toEqual(expected)    // Deep equality

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()

// Arrays
expect(arr).toContain(item)
expect(arr).toHaveLength(3)

// Objects
expect(obj).toHaveProperty('name')
expect(obj).toMatchObject({ name: 'test' })

// Exceptions
expect(() => fn()).toThrow()
expect(() => fn()).toThrow(Error)

// Numbers
expect(n).toBeGreaterThan(5)
expect(n).toBeLessThanOrEqual(10)
```

## Boundary Isolation

> **Core Principle**: Mocks lie. They simulate behavior that may diverge from reality. We mock only at **system boundaries**, never internal logic.

### The No-Mock Rule

**Business logic should never be mocked.** If you need to mock internal functions to test something, your code is too tightly coupled. Refactor instead.

```typescript
// ❌ BAD: Mocking internal helper (Level: Junior)
// This test will break if you refactor internal-helper.ts
vi.mock('./internal-helper', () => ({
  calculateTax: vi.fn().mockReturnValue(20)
}));

// ✅ GOOD: Testing final behavior (Level: Principal)
// If internal helpers change but result is correct, test stays valid
it('should calculate final price including tax', () => {
  const result = calculateOrder(order);
  expect(result.total).toBe(120); // Uses REAL calculateTax internally
});
```

### What to Mock (Boundaries Only)

| Boundary | Mock With | Example |
|----------|-----------|---------|
| **Network/API** | MSW | `http.get('/api/users')` |
| **Time/Date** | `vi.useFakeTimers()` | `Date.now()`, `setTimeout` |
| **File System** | In-memory fs | `fs.readFile()` |
| **External Services** | MSW or stubs | Third-party SDKs |
| **Random/UUID** | `vi.fn()` | `Math.random()`, `crypto.randomUUID()` |

### What NOT to Mock

- ❌ Internal utility functions
- ❌ Helper modules within your codebase
- ❌ Pure business logic functions
- ❌ Type definitions or constants

**Warning Sign**: If you need **5+ mocks** to test one function, your function is doing too much. Break it apart.

### MSW for API Calls (Network Boundaries)

MSW intercepts requests at the network layer, not the function layer. This is more realistic than mocking `fetch`.

```typescript
import { http, HttpResponse } from 'vitest/http';
import { server } from '../setup';

it('should fetch user data', async () => {
  server.use(
    http.get('/api/user/:id', () => HttpResponse.json({ id: '1', name: 'Alice' }))
  );

  const user = await fetchUser('1');

  expect(user.name).toBe('Alice');
});
```

### Type-Safe Mocks

Use `vi.mocked()` to preserve TypeScript type inference on mocks:

```typescript
import { validateEmail } from './validator';

// Type-safe mock
vi.mock('./validator');
const mockedValidate = vi.mocked(validateEmail);

mockedValidate.mockReturnValue(true); // ✅ Type-checked!
mockedValidate.mockImplementation((email) => email.includes('@'));
```

### Resetting Mocks Between Tests

**Every test must start clean.** Flaky tests are caused by mock state leaking between tests.

```typescript
beforeEach(() => {
  vi.clearAllMocks();   // Clears call history only
  vi.resetAllMocks();   // Clears history + implementation
});

afterEach(() => {
  // Restore real timers if vi.useFakeTimers() was used
  vi.useRealTimers();
});
```

### Fake Timers for Date/Time

```typescript
it('should expire token after 24 hours', () => {
  vi.useFakeTimers();
  const now = new Date('2024-01-01T12:00:00Z');
  vi.setSystemTime(now);

  const token = createToken();

  vi.advanceTimersByTime(24 * 60 * 60 * 1000); // Advance 24 hours

  expect(token.isExpired()).toBe(true);

  vi.useRealTimers(); // Always restore!
});
```

### Stubs vs Mocks

Prefer **stubs** (simpler) over **mocks** (with assertions):

```typescript
// ❌ Mock with assertions (couples to implementation)
const mockFn = vi.fn().mockReturnValue(true);
expect(mockFn).toHaveBeenCalledWith('test@example.com');

// ✅ Stub (just provides value, doesn't assert calls)
const stubFn = vi.fn().mockReturnValue(true);
const result = processEmail(stubFn);
expect(result).toBe('valid');
```

### Design Pressure: Mocks Force Decoupling

If mocking is hard, your code needs redesign:

```
Too many mocks needed?
        ↓
Function has too many responsibilities
        ↓
Extract dependencies into separate modules
        ↓
Each module becomes independently testable
        ↓
No mocks needed for business logic
```

**Rule**: The need to mock is a **code smell**, not a testing problem.

## Factory Pattern for Fixtures

Use factory functions for complex test data:

```typescript
// Instead of big JSON objects
function createUser(overrides = {}) {
  return {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date('2024-01-01'),
    ...overrides
  };
}

// Easy to create variations
const admin = createUser({ role: 'admin' });
const deletedUser = createUser({ deletedAt: new Date() });
```

**Benefits:**
- Readable test cases
- Only specify what's different
- Single source of truth for structure

## Setup and Teardown

```typescript
beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

beforeAll(() => {
  // Run once before all tests (e.g., setup test database)
});

afterAll(() => {
  // Cleanup after all tests
});
```

## In-Source Testing (Vitest Feature)

For small utilities, Vitest supports **in-source testing** to avoid separate test files:

```typescript
// src/utils/format.ts

// Implementation
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// In-source test
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  describe('formatDate', () => {
    it('should format as YYYY-MM-DD', () => {
      expect(formatDate(new Date('2024-01-15'))).toBe('2024-01-15');
    });
  });
}
```

**When to use:**
- Small utility functions (< 20 lines)
- Functions that won't change often
- No external dependencies

## Running Tests

### Run All Tests

```bash
npx vitest
```

### Run Tests in Watch Mode

```bash
npx vitest watch
```

### Run Specific Test File

```bash
npx vitest src/utils/format.test.ts
```

### Run with Coverage

```bash
npx vitest run --coverage
```

### Run Tests by Pattern

```bash
npx vitest run -t "should format"
```

## Test-Driven Development (TDD) Workflow

```
1. Write a failing test
2. Run tests to verify failure
3. Implement minimal code to pass
4. Run tests to verify pass
5. Refactor if needed
6. Repeat
```

## Commit Tests

**Use `/commit` skill** for all test commits:

```bash
git add src/utils/format.test.ts
/commit "test(format): add tests for date formatting

- Tests for valid date formatting
- Tests for invalid date fallback
- Tests for edge cases (epoch, far future)

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

## Quick Reference

```
Test file:      src/utils/format.test.ts
Run tests:      npx vitest
Run coverage:   npx vitest run --coverage
Specific file:  npx vitest src/utils/format.test.ts
In-source test: if (import.meta.vitest) { ... }
```

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/commit` | Commit test changes |
| `/fix-issue` | Add tests when fixing bugs |
