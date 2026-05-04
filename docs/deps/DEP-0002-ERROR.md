---
dep: DEP-0002
title: "Error: Unified Error System with Tagged Errors"
stage: draft
tags:
  - area/core
  - type/feature
authors:
  - DeesseJS Team <support@nesalia.com>
created: 2026-05-04
updated: 2026-05-04
---

## Summary

A unified error system where errors are created via the `error()` builder factory, tagged for exhaustive pattern matching, enrichable with context, and integrated with `Result.gen` for generator-based composition. The API is expressive, composable, and ergonomic — errors are first-class citizens of the library.

## Motivation

Errors are not exceptional cases to be caught and forgotten. They are values that flow through the system, carry context, and deserve first-class treatment in the type system.

The error system design centers on six principles:

1. **Errors are values** — Errors flow through the system like any other value
2. **Errors are enrichable** — Add context without losing the original error
3. **Errors are matchable** — Exhaustive pattern matching with full type narrowing
4. **Errors are composable** — Work seamlessly with `Result.gen` generator composition
5. **Errors are typed** — Zod schemas validate error data at creation
6. **Errors respect sensitivity** — Automatic redaction of sensitive fields

## Detailed Design

### Creating Errors

Errors are created via the `error()` builder factory. No classes exposed to users.

```typescript
import { error } from '@deessejs/fp';
import { z } from 'zod';

// Define error with Zod validation and custom message
const NotFoundError = error({
  name: "NotFoundError",
  schema: z.object({
    id: z.string(),
    resource: z.string().optional()
  }),
  message: (args) => args.resource
    ? `${args.resource} not found: ${args.id}`
    : `Resource not found: ${args.id}`
});

const err = NotFoundError({ id: "123", resource: "user" });
// err.message === "Resource not found: user"
```

### Without Message Function

If `message` is omitted, a default message is generated from the error name and args:

```typescript
const GenericError = error({
  name: "GenericError",
  schema: z.object({ reason: z.string() })
});

const err = GenericError({ reason: "something went wrong" });
// err.message === "GenericError: {\"reason\":\"something went wrong\"}"
```

### Without Schema

Errors can be created without a schema. Args will be an empty object unless provided:

```typescript
const SystemError = error({
  name: "SystemError"
});

const err = SystemError({ code: 500 });
err.args  // { code: 500 }
```

### Error Properties

Every error provides:

```typescript
err.name       // "NotFoundError" - error type identifier
err._tag       // "NotFoundError" - tag for pattern matching
err.args       // { id: "123", resource: "user" } - typed error data
err.message    // "Resource not found: user" - human-readable
err.stack      // string - stack trace
err.notes      // readonly string[] - enrichment notes
err.cause      // Maybe<Error> - chained previous error
err.code       // number | undefined - numeric error code
```

### Panic Type

`Panic` represents unrecoverable programmer defects — exceptions that should never occur in production. Panic is used by the library to signal violations of contract (e.g., `catch` handler throwing in `Result.attempt`):

```typescript
export type Panic = Readonly<{
  readonly _tag: "Panic";
  readonly error: Error;
  readonly reason: string;
}>;
```

Panic values are distinguishable from domain errors via the `_tag` discriminator.

### Matching Errors

#### Exhaustive Pattern Matching

The `matchError()` function provides exhaustive matching with full type narrowing:

```typescript
import { matchError } from '@deessejs/fp';

const result = getUserResource("u1", "r1");

const message = matchError(result.error, {
  NotFoundError: (e) => `Missing ${e.resource}: ${e.id}`,
  ValidationError: (e) => `Invalid ${e.field}: ${e.message}`,
  NetworkError: (e) => `Network failed: ${e.url}`,
  TimeoutError: (e) => `Timeout after ${e.ms}ms`,
});
// TypeScript ensures all cases are handled
```

#### Partial Matching with Fallback

For non-exhaustive matching, use `matchErrorPartial` with a default handler:

```typescript
const message = matchErrorPartial(result.error, {
  NotFoundError: (e) => `Missing: ${e.id}`,
  ValidationError: (e) => `Invalid: ${e.field}`,
}, (e) => `Unknown error: ${e._tag}`);
```

### Type Guards

#### Static is() on Builders

Each error builder has a static `is()` method for precise type narrowing:

```typescript
const err = NotFoundError({ id: "123" });

if (NotFoundError.is(err)) {
  err.id  // Fully narrowed to string
  err.resource  // string | undefined (based on schema)
}
```

#### Generic isError()

Check if any value is any error:

```typescript
import { isError } from '@deessejs/fp';

if (isError(err)) {
  console.log(err.name);  // All errors have name
  console.log(err.args);  // All errors have args
}
```

#### Generic TaggedError.is()

Check if any value is a tagged error (has `_tag` discriminator):

```typescript
import { TaggedError } from '@deessejs/fp';

if (TaggedError.is(result.error)) {
  result.error._tag  // string - the discriminator
}
```

### Enriching Errors

#### Adding Notes

```typescript
const err = NotFoundError({ id: "123" });

const enriched = err
  .addNotes("Database query attempted at line 42")
  .addNotes("User action: GET /api/users/123");

enriched.notes  // readonly ["Database query attempted...", "User action: GET..."]

err.notes  // readonly [] - original unchanged
```

#### Chaining Cause

```typescript
const previousError = NetworkError({ url: "/api/users" });

const err = NotFoundError({ id: "123" })
  .from(previousError);

err.cause  // Just<NetworkError>
err.cause.map(e => e.url)  // Just("/api/users")

// Empty cause
const noCause = NotFoundError({ id: "123" }).from(none());
noCause.cause  // None
```

#### Error Equality

Errors are compared by reference, not structure:

```typescript
const err1 = NotFoundError({ id: "123" });
const err2 = NotFoundError({ id: "123" });

err1 === err2  // false - different instances
err1 === err1   // true - same instance
```

### Generator Composition (Result.gen)

#### Direct Error Yield

Errors can be yielded directly without wrapping in `err()`:

```typescript
const result = await Result.gen(async function* () {
  const user = yield* ok({ id: "123", name: "Alice", active: true });

  if (!user.active) {
    yield* ValidationError({
      field: "user.active",
      message: "User account is inactive"
    });
  }

  return user;
});
```

#### Using panic()

For early termination outside of conditional yields:

```typescript
const result = await Result.gen(async function* () {
  const user = yield* fetchUser(userId);

  if (!user) {
    panic(NotFoundError({ id: userId, resource: "User" }));
  }

  // Execution stops here - panic never returns
  return user;
});
```

### Sensitive Data Handling

Errors automatically redact sensitive fields in `message` and `stack`:

```typescript
const AuthError = error({
  name: "AuthError",
  schema: z.object({
    userId: z.string(),
    password: z.string(),
    token: z.string(),
    apiKey: z.string(),
  })
});

const err = AuthError({
  userId: "123",
  password: "super_secret_123",
  token: "ghp_xxxxx",
  apiKey: "sk-xxxxx"
});

err.message  // "AuthError: {userId:123, password:[REDACTED], token:[REDACTED], apiKey:[REDACTED]}"
err.args.password  // "super_secret_123" - NOT redacted in args
```

Redacted fields are detected by name patterns:
- `password`, `passwd`, `pwd`
- `token`, `access_token`, `refresh_token`
- `secret`, `api_key`, `apikey`, `apiKey`
- `authorization`, `auth`
- `credential`, `private`

Redaction only applies to `message` and `stack`, not to `args`.

### Validation Errors

Zod validation happens at error creation:

```typescript
const ValidationError = error({
  name: "ValidationError",
  schema: z.object({
    field: z.string(),
    message: z.string(),
    value: z.unknown().optional()
  })
});

const valid = ValidationError({ field: "email", message: "invalid format" });
// Works

try {
  ValidationError({ field: 123 });
} catch (e) {
  e.name        // "ValidationError"
  e.args.value  // 123
  e.cause       // ZodError instance
}
```

### Error Serialization

Errors support JSON serialization for logging and RPC:

```typescript
const err = NotFoundError({ id: "123", resource: "user" });

const json = JSON.stringify(err);
// '{"name":"NotFoundError","_tag":"NotFoundError","args":{"id":"123","resource":"user"},"message":"Resource not found: user"}'

const restored = JSON.parse(json, Error.reviver);
// restored instanceof NotFoundError
```

### Error Groups

Group multiple errors for batch operations:

```typescript
import { exceptionGroup, error } from '@deessejs/fp';

const Errors = {
  parse: error({ name: "ParseError", schema: z.object({ input: z.string() }) }),
  validate: error({ name: "ValidateError", schema: z.object({ field: z.string() }) }),
};

const results = await Promise.allSettled(inputs.map(process));
const failures = results
  .filter((r): r is PromiseRejectedResult => r.status === "rejected")
  .map(r => ParseError({ input: r.reason }));

if (failures.length > 0) {
  throw exceptionGroup("Multiple parsing failures", failures);
}
```

Accessing group errors:

```typescript
try {
  // code that throws exceptionGroup
} catch (e) {
  if (ExceptionGroup.is(e)) {
    e.errors  // Array of errors in the group
    e.message // "Multiple parsing failures"
  }
}
```

### Error Codes

Errors can include numeric codes for programmatic handling:

```typescript
const NotFoundError = error({
  name: "NotFoundError",
  code: 404,
  schema: z.object({ id: z.string() })
});

const err = NotFoundError({ id: "123" });
err.code  // 404
```

Common error codes:

| Code | Name | Use Case |
|------|------|----------|
| 400 | BadRequest | Invalid input |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized |
| 404 | NotFound | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | ValidationError | Schema validation |
| 500 | InternalError | Server error |
| 503 | Unavailable | Service unavailable |

## Complete Example

```typescript
import { error, ok, err, matchError, Result, panic } from '@deessejs/fp';
import { z } from 'zod';

const NotFoundError = error({
  name: "NotFoundError",
  schema: z.object({ id: z.string(), resource: z.string() })
});

const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string(), message: z.string() })
});

const PermissionError = error({
  name: "PermissionError",
  schema: z.object({ action: z.string(), resource: z.string() })
});

async function getUserResource(userId: string, resourceId: string) {
  return Result.gen(async function* () {
    const user = yield* fetchUser(userId);

    if (!user) {
      panic(NotFoundError({ id: userId, resource: "User" }));
    }

    if (!user.canRead(resourceId)) {
      panic(PermissionError({ action: "read", resource: resourceId }));
    }

    const resource = yield* fetchResource(resourceId);

    if (!resource) {
      panic(NotFoundError({ id: resourceId, resource: "Resource" }));
    }

    return resource;
  });
}

const result = await getUserResource("u1", "r1");

matchError(result.error, {
  NotFoundError: (e) => console.log(`Not found: ${e.resource} ${e.id}`),
  ValidationError: (e) => console.log(`Validation failed: ${e.field} - ${e.message}`),
  PermissionError: (e) => console.log(`Permission denied: ${e.action} on ${e.resource}`),
});

const logEntry = JSON.stringify(result.error, Error.reviver);
```

## Relationship to Result

The Error system is designed to integrate seamlessly with `Result.gen` (see [DEP-0001](./DEP-0001-RESULT.md)). Errors are yielded directly in generator blocks to short-circuit with an `Err` result:

```typescript
// Errors created with error() can be yielded directly
yield* NotFoundError({ id: userId, resource: "User" });

// Or wrapped in err() for explicitness
yield* err(NotFoundError({ id: userId, resource: "User" }));

// Both produce Err<never, NotFoundError>
```

## Open Questions

1. **Panic integration** — Should errors thrown from callbacks in map/andThen/tap be caught as `Panic` errors (programmer defects) vs domain errors?

2. **Error hierarchy** — Should there be a base error class that all domain errors extend, or should errors be purely structural?

## References

- [EXPECTED-ERROR-DX.md](../internal/external/better-result/EXPECTED-ERROR-DX.md) — Source of truth for Error DX
- [ERROR-SYSTEM-FUSION.md](../internal/external/better-result/ERROR-SYSTEM-FUSION.md) — Technical design for achieving this DX
- [Rust RFC Process](https://github.com/rust-lang/rfcs)
