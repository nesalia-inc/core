---
name: file-organization
description: Separate types and functions into their own files
paths:
  - "packages/fp/src/**/*.ts"
---

# File Organization: Types and Functions Separate

## One Concern Per File

Types and functions must not be mixed in the same file. Each file has a single responsibility:

```
result/
├── types.ts      # Type definitions only
├── builder.ts    # Factory functions only
└── index.ts      # Re-exports only
```

## File Responsibilities

| File | Contains |
|------|----------|
| `types.ts` | Interface definitions, type aliases, generic constraints |
| `builder.ts` | Factory functions, creators, utility functions |
| `index.ts` | Re-exports only (no logic) |
| `guards.ts` | Type guards and predicates |
| `utils.ts` | Helper utilities |

## Why

Separation makes code easier to:
- Navigate (types are where you expect)
- Maintain (changes are localized)
- Test (functions are isolated from type definitions)
- Read (single responsibility per file)

## Example Structure

```
error/
├── types.ts      # Error, ErrorData, ErrorBuilder, ErrorOptions
├── builder.ts    # error(), exceptionGroup()
├── guards.ts     # isError(), assertIsError()
├── utils.ts      # getErrorMessage(), flattenErrorGroup()
├── raise.ts      # raise() function
└── index.ts      # Re-exports

maybe/
├── types.ts      # Maybe, Some, None
├── builder.ts    # some(), none(), fromNullable()
├── guards.ts     # isSome(), isNone()
└── index.ts
```

## Rules

1. **Types in `types.ts`** - no implementation
2. **Functions in `builder.ts`** - no type definitions mixed in
3. **Re-exports in `index.ts`** - only, no new logic
4. **One type per file** - grouped by domain, not scattered

## Anti-pattern

```typescript
// BAD - mixed in same file
export const ok = <T>(value: T) => ({ ok: true, value });
export type Ok<T> = { ok: true; value: T };
```

```typescript
// GOOD - separated
// builder.ts
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

// types.ts
export type Ok<T> = { ok: true; value: T };
```