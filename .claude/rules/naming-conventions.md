---
name: naming-conventions
description: Naming conventions - no useless prefixes/suffixes, entity-oriented reasoning
paths:
  - "packages/fp/src/**/*.ts"
---

# Naming Conventions

## No Useless Prefixes/Suffixes

Avoid Hungarian notation and redundant naming:

| Avoid | Prefer | Reason |
|-------|--------|--------|
| `IUser` (interface) | `User` | TypeScript `interface` keyword is sufficient |
| `UserHandler` | `User` | "Handler" is redundant - what else would it do? |
| `ResultImpl` | `Result` | "Impl" is implementation detail |
| `createUser` (when class exists) | `User` | Factory or class name is enough |

## Entity-Oriented Reasoning

Name things based on **what they are**, not what they do or how they're implemented:

```typescript
// Bad - describes implementation
const createOk = <T>(value: T): Ok<T> => ...
const handler = new UserHandler();

// Good - describes the entity
const ok = <T>(value: T): Ok<T> => ...
const user = new User();
```

## Rules

1. **No `I` prefix** for interfaces - use `interface` keyword instead
2. **No `Handler` suffix** - the class/function name should convey purpose
3. **No `Impl` suffix** - implementation details shouldn't appear in names
4. **No `create` prefix** when a simple name suffices - `ok()` not `createOk()`
5. **Nouns over verbs** for types, verbs for functions
6. **Error names** - use descriptive nouns: `NotFoundError`, `ValidationError`, `TimeoutError` - not `ErrorOfUser` or `UserErrorHandler`

## Examples

```typescript
// Factory functions - short and descriptive
ok(value)        // create an Ok result
err(error)       // create an Err result
some(value)      // create a Some maybe
none()           // create a None maybe

// Classes - noun-based
class RetryPolicy { ... }    // NOT RetryPolicyImpl
class Result { ... }         // NOT ResultImpl

// Interfaces - noun-based (no I prefix)
interface RetryOptions { ... }
interface Result<T, E> { ... }
```

## Rationale

Clean names reduce cognitive load. When reading code, `user.save()` reads naturally - `user.saveHandler()` adds nothing. The implementation suffix or prefix tells users "this is a workaround" which shouldn't be visible in the public API.