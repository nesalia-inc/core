---
name: type-testing-quality
description: Evaluate TypeScript type testing quality. Use when reviewing type tests, assessing type coverage, or asked "are our types properly tested?", "do we have type tests?". Checks type assertion quality, @deessejs/type-testing usage, coverage, and type safety. Generates markdown report to reports/types/type-report-<date>. Supports --path, --report, --focus flags.
disable-model-invocation: true
allowed-tools: Read,Grep,Glob,Bash
---

# Type Testing Quality Review Skill

Verify TypeScript types are properly tested and type safety is maintained.

## Quick Usage

```bash
/type-testing-quality
/type-testing-quality --path=src
/type-testing-quality --report
/type-testing-quality --focus=coverage
```

## Report Output

Reports are generated to: `reports/types/type-report-<YYYY-MM-DD>.md`

```bash
# Generate report with today's date
/type-testing-quality --report

# Generate for specific path
/type-testing-quality --path=src/types --report

# Generate with specific focus
/type-testing-quality --path=src --focus=types --report
```

## Overview

Type testing ensures TypeScript types behave as expected. Unlike runtime tests, type tests verify compile-time correctness.

**Why Type Testing Matters:**

| Without Type Tests | With Type Tests |
|-------------------|----------------|
| Types can silently break | Types verified at compile/test time |
| Refactoring risks type regressions | Refactoring is safe |
| `any` can creep in | `any` is detected and rejected |
| Complex types may be wrong | Complex types are proven correct |

## The @deessejs/type-testing Library

```bash
npm install @deessejs/type-testing
```

### Core Features

| Category | Types |
|----------|-------|
| **Equality** | `Equal<T, U>`, `NotEqual<T, U>`, `IsNeverEqual<T, U>` |
| **Special Types** | `IsAny<T>`, `IsNever<T>`, `IsUnknown<T>`, `IsNullable<T>` |
| **Structures** | `IsUnion<T>`, `IsTuple<T>`, `IsArray<T>` |
| **Property** | `HasProperty<T, K>`, `IsReadonly<T>`, `IsRequired<T>` |
| **Deep** | `DeepReadonly<T>`, `DeepPartial<T>`, `RequiredKeys<T>` |

### Usage Patterns

```typescript
import { Equal, check, assert, expect, IsAny, HasProperty } from '@deessejs/type-testing';

// Simple equality
type Test1 = Equal<string, string>;  // true

// Chainable API
check<string>().equals<string>();

// Assert with clear errors
assert<User>().hasProperty('id');

// Expect syntax
expect<string, string>().toBeEqual();

// Detect any
type T = IsAny<unknown>;  // false - good!
```

## Type Testing Quality Dimensions

### 1. Type Assertion Coverage (30%)

Measures whether types are explicitly tested.

| Check | Weight | Description |
|-------|--------|-------------|
| Public API types tested | 10 | Exported types have type tests |
| Utility types tested | 8 | Helper types verified |
| Complex types tested | 7 | Mapped types, generics verified |
| Edge cases covered | 5 | Boundary conditions tested |

### 2. Type Safety Verification (25%)

Measures whether dangerous types are detected.

| Check | Weight | Description |
|-------|--------|-------------|
| `any` detection | 10 | `IsAny` used to catch `any` |
| `unknown` handling | 8 | `unknown` properly handled |
| Null safety verified | 7 | Nullable types tested |

### 3. Type Transformation Tests (20%)

Measures whether type utilities work correctly.

| Check | Weight | Description |
|-------|--------|-------------|
| `DeepPartial` tested | 8 | Nested optional verified |
| `DeepReadonly` tested | 7 | Immutable types verified |
| `Pick`/`Omit` tested | 5 | Property selection verified |

### 4. Type Assertion Quality (15%)

Measures whether assertions are meaningful.

| Check | Weight | Description |
|-------|--------|-------------|
| Exact equality tested | 6 | `Equal<T, U>` not just assignable |
| Semantic testing | 5 | Tests verify intent, not syntax |
| Edge cases | 4 | Boundary types tested |

### 5. Tool Usage (10%)

Measures proper use of @deessejs/type-testing.

| Check | Weight | Description |
|-------|--------|-------------|
| Uses @deessejs/type-testing | 5 | Library used instead of manual types |
| Proper API usage | 3 | `check()`, `assert()`, `expect()` used |
| CI integration | 2 | Type tests in CI pipeline |

## Type Testing Anti-Patterns

### The "Assignability" Test

```typescript
// Bad - only tests assignability, not equality
type Test1 = string extends string ? true : false;

// Good - tests exact equality
type Test1 = Equal<string, string>;  // true
```

**Why it matters:** `string extends number` is false, but `Equal<string, number>` is also false. However, `Equal<string | number, string>` is false, while `string | number extends string` is true (covariance).

### The "Implicit Any" Problem

```typescript
// Bad - allows any to creep in
function process(data: any) {
  // ... no type safety
}

// Good - detects any
type Check = IsAny<typeof process>;  // Should be false
```

### The "Manual Equality" Trap

```typescript
// Bad - manual type equality can be wrong
type AssertEqual<T, U> = [T] extends [U] ? [U] extends [T] ? true : false : false;

// Good - use library
import { Equal } from '@deessejs/type-testing';
type Test = Equal<T, U>;
```

### The "Test Nothing" Test

```typescript
// Bad - proves nothing
type Test = string;  // No assertion!

// Good - explicit verification
type Test = Equal<string, string>;  // Proves string = string
```

## Analyzing Type Testing Quality

### Stage 1: Find Type Test Files

```bash
# Find type test files
find . -name "*.test-types.ts" -o -name "*.types.test.ts" -o -name "types.spec.ts"

# Find files using @deessejs/type-testing
grep -r "@deessejs/type-testing" --include="*.ts" -l

# Find files with type tests
grep -r "Equal\|IsAny\|check\|assert\|expect" --include="*.test-types.ts"
```

### Stage 2: Check Type Coverage

```bash
# Run type tests
npx vitest run --config vitest.config.types.ts

# Check type coverage with tsc
npx tsc --noEmit --pretty

# Find exported types without tests
grep -rh "^export" src --include="*.ts" | grep -v "test\|spec"
```

### Stage 3: Identify Type Safety Issues

```bash
# Find any usage (may be intentional)
grep -r ": any" src --include="*.ts" | grep -v "test\|spec\|// any"

# Find untyped parameters
grep -r "\.accepts\(" src --include="*.ts" 2>/dev/null | head -20

# Check for unknown handling
grep -r "unknown" src --include="*.ts" | grep -v "test\|spec"
```

## Type Testing Report Format

**Output:** `reports/types/type-report-YYYY-MM-DD.md`

```markdown
# Type Testing Quality Report

**Generated:** YYYY-MM-DD (from system clock)
**Report Location:** reports/types/type-report-YYYY-MM-DD.md

## Overall Score: 72/100 (Good)

### Grade: B (Good)

### Dimension Scores

| Dimension | Score | Weight | Weighted | Status |
|-----------|-------|--------|----------|--------|
| Type Assertion Coverage | 24/30 | 30% | 24.0 | Good |
| Type Safety Verification | 18/25 | 25% | 18.0 | Good |
| Type Transformation Tests | 14/20 | 20% | 14.0 | Good |
| Type Assertion Quality | 10/15 | 15% | 10.0 | Warning |
| Tool Usage | 6/10 | 10% | 6.0 | Warning |

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Type test files | 12 | Good |
| Types with tests | 45/60 (75%) | Warning |
| Uses @deessejs/type-testing | 8/12 (67%) | Warning |
| any escape hatches | 3 found | Critical |
| Complex types untested | 8 identified | Warning |

---

## Critical Issues

### 1. any Escape Hatch Detected

**File:** src/api/client.ts
**Line:** 23

```typescript
function processResponse(data: any) {
  // DANGER: any bypasses type safety
}
```

**Problem:** Using `any` allows any data through without type checking.

**Fix:** Use `unknown` and validate:

```typescript
import { IsAny } from '@deessejs/type-testing';

function processResponse(data: unknown) {
  type Check = IsAny<typeof data>;  // Should be false
  // Validate and narrow type
}
```

---

### 2. Missing Type Test for Critical Utility

**File:** src/types/user.ts
**Type:** `DeepPartial<User>`

**Current tests:** 0

**Impact:** High - incorrect DeepPartial could cause runtime errors

**Suggestion:**

```typescript
import { Equal, assert, DeepPartial } from '@deessejs/type-testing';
import type { User } from './user';

type TestUser = DeepPartial<User>;

// Should make all properties optional
type Assert = Equal<TestUser, {
  id?: string;
  name?: string;
  email?: string;
  address?: { city?: string; zip?: string };
}>;
```

---

## Type Coverage Matrix

| File | Exported Types | Tested Types | Coverage | Status |
|------|---------------|--------------|----------|--------|
| src/types/user.ts | 8 | 6 | 75% | Good |
| src/types/api.ts | 5 | 2 | 40% | **Poor** |
| src/types/order.ts | 12 | 10 | 83% | Good |
| src/utils/validation.ts | 4 | 1 | 25% | **Critical** |

---

## Missing Type Tests

### Critical Priority

| Type | File | Usage Count | Impact | Test Suggestion |
|------|------|------------|--------|-----------------|
| `DeepPartial<User>` | src/types/user.ts | 15 | High | Verify all fields optional |
| `IsAny<T>` checks | src/api/*.ts | 8 | Critical | Verify no any escape |
| `ReturnType<T>` | src/utils/*.ts | 12 | Medium | Verify return types |

### Medium Priority

| Type | File | Usage Count | Impact | Test Suggestion |
|------|------|------------|--------|-----------------|
| `Pick<User, 'id'>` | src/types/user.ts | 5 | Medium | Verify property selection |
| `Omit<User, 'password'>` | src/types/user.ts | 3 | High | Verify field removal |

---

## any Detection Report

| File | Line | Context | Severity |
|------|------|---------|----------|
| src/api/client.ts | 23 | `data: any` | Critical |
| src/utils/parser.ts | 45 | `result: any` | High |
| src/hooks/useData.ts | 12 | `any[]` | Medium |

**Recommendation:** Replace all `any` with `unknown` and add type narrowing.

---

## Recommendations

### High Priority

1. **Add type tests for DeepPartial<User>**
   - File: src/types/user.ts
   - Impact: Prevents runtime errors from incorrect optional chaining

2. **Fix all `any` escape hatches**
   - 3 files affected
   - Replace with `unknown` + type narrowing
   - Add `IsAny` checks

3. **Increase coverage for api.ts**
   - Current: 40%
   - Target: 80%

### Medium Priority

4. **Add `Equal<T, U>` for utility types**
   - Currently using manual equality
   - Should use @deessejs/type-testing

5. **Integrate type tests in CI**
   - Add to vitest config
   - Run on every PR

---

## GitHub Issue Draft

```markdown
## Improve type testing quality

### Problem

Type testing coverage is 75% with critical gaps:
- 3 `any` escape hatches detected
- DeepPartial<User> not tested
- API types at 40% coverage

### Impact

Without proper type tests:
- Refactoring can silently break types
- `any` can creep into codebase
- Complex types may be incorrect

### Current State

- Type test coverage: 75%
- @deessejs/type-testing usage: 67%
- any escape hatches: 3
- Critical untested types: 8

### Proposed Changes

1. Replace `any` with `unknown` in 3 files
2. Add DeepPartial<User> type test
3. Increase api.ts type coverage to 80%
4. Integrate @deessejs/type-testing in all type tests

### Effort

~3 hours across 5 files
```

---

## Confirmation

**This skill will NOT create issues without your confirmation.**

**This skill will NOT write report files without your confirmation.**
```

## Type Testing Scoring System

### Score Calculation

| Dimension | Weight | Max Score |
|-----------|--------|-----------|
| Type Assertion Coverage | 30% | 30 |
| Type Safety Verification | 25% | 25 |
| Type Transformation Tests | 20% | 20 |
| Type Assertion Quality | 15% | 15 |
| Tool Usage | 10% | 10 |
| **Total** | **100%** | **100** |

### Grade Scale

| Grade | Score | Interpretation |
|-------|-------|----------------|
| A+ | 95-100 | Exceptional - comprehensive type testing |
| A | 90-94 | Excellent - minimal gaps |
| A- | 85-89 | Very Good - minor improvements |
| B+ | 80-84 | Good - solid foundation |
| B | 75-79 | Good - some gaps to address |
| B- | 70-74 | Acceptable - improvements needed |
| C+ | 65-69 | Average - significant gaps |
| C | 60-64 | Below Average - major issues |
| D | 50-59 | Poor - critical gaps |
| F | <50 | Failing - no type safety |

### Score Interpretation

| Score Range | Status | Action |
|-------------|--------|--------|
| 85-100 | Excellent | Maintain quality |
| 70-84 | Good | Address minor gaps |
| 50-69 | Average | Significant work needed |
| <50 | Poor | Major overhaul |

## Type Testing Best Practices

### 1. Test Public API Types

```typescript
// Export your types
export interface User {
  id: string;
  name: string;
  email: string;
}

// Test them
import { assert, HasProperty, IsReadonly } from '@deessejs/type-testing';

type TestUser = assert<User>()
  .hasProperty('id')
  .hasProperty<'name', string>()
  .isReadonly('id');
```

### 2. Catch any Early

```typescript
import { IsAny } from '@deessejs/type-testing';

// At boundaries - verify no any escapes
function processExternalData(data: unknown) {
  type Check = IsAny<typeof data>;  // Must be false!
  // ...
}
```

### 3. Test Type Transformations

```typescript
import { Equal, DeepPartial, DeepReadonly } from '@deessejs/type-testing';

// Test DeepPartial
type Test1 = Equal<
  DeepPartial<{ id: string; name: string }>,
  { id?: string; name?: string }
>;

// Test DeepReadonly
type Test2 = Equal<
  DeepReadonly<{ id: string; nested: { name: string } }>,
  { readonly id: string; readonly nested: { readonly name: string } }
>;
```

### 4. Test Edge Cases

```typescript
import { IsNever, IsUnion } from '@deessejs/type-testing';

// Empty types
type Test1 = IsNever<never>;  // true

// Union detection
type Test2 = IsUnion<string | number>;  // true
type Test3 = IsUnion<string>;  // false
```

## CI Integration

### GitHub Actions

```yaml
# .github/workflows/types.yml
name: Type Tests

on: [push, pull_request]

jobs:
  type-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Run type tests
        run: npx vitest run --config vitest.config.types.ts

      - name: Type check
        run: npx tsc --noEmit
```

### Vitest Configuration

```typescript
// vitest.config.types.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    files: ['**/*.test-types.ts'],
    typecheck: {
      enabled: true
    }
  }
});
```

## Common Issues

### Issue: "Type tests don't run in CI"

**Solution:** Add to vitest config and CI workflow.

### Issue: "Manual type equality instead of library"

**Solution:**
```typescript
// Before
type AssertEqual<T, U> = [T] extends [U] ? [U] extends [T] ? true : false : false;

// After
import { Equal } from '@deessejs/type-testing';
type AssertEqual<T, U> = Equal<T, U>;
```

### Issue: "any keeps appearing"

**Solution:**
1. Enable `strict` mode in tsconfig
2. Add `IsAny` checks at boundaries
3. Use `unknown` instead of `any`

## Senior Advice

> "Type tests are compile-time insurance. They pay out when you refactor."

> "If your types aren't tested, they're assumptions. Assumptions become bugs."

> "The difference between `any` and `unknown` is the difference between hiding problems and facing them."

> "A type test that passes is not proof the type is correct. It's proof you haven't found the error yet."

> "Using manual type equality is like writing your own testing framework - reinventing the wheel with more bugs."

> "Type tests should be as rigorous as runtime tests. Types are code too."

## Additional Resources

- @deessejs/type-testing: https://github.com/deessejs/type-testing
- For code simplification, see [simplify-code-skill](../simplify-code-skill/SKILL.md)
- For test quality, see [test-quality-skill](../test-quality-skill/SKILL.md)
- For TypeScript best practices, see [typescript-master skills](../../typescript-master/5-best-practices/)
