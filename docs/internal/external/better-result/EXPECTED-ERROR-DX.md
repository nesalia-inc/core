# Error System: Expected DeesseJS Core DX

This document defines the target Developer Experience for the unified error system in @deessejs/fp. It describes the ideal API and behavior that users should experience, serving as the source of truth for the error system redesign.

---

## 1. Expected DeesseJS Core DX

### Philosophy

Errors in @deessejs/fp should be **expressive, composable, and ergonomic**. The error system is a first-class citizen of the library, not an afterthought.

### Core Principles

1. **Errors are values** - Errors flow through the system like any other value
2. **Errors are enrichable** - Add context without losing the original error
3. **Errors are matchable** - Exhaustive pattern matching with full type narrowing
4. **Errors are composable** - Work seamlessly with Result.gen generator composition
5. **Errors are typed** - Zod schemas validate error data at creation
6. **Errors respect sensitivity** - Automatic redaction of sensitive fields

---

## 2. Creating Errors

### Error Builders

Errors are created via the `error()` builder factory. No classes exposed to users.

```typescript
import { error } from '@deessejs/fp';
import { z } from 'zod';

// Define error with Zod validation
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

// Use with validated args
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
err.message  // "GenericError: {\"reason\":\"something went wrong\"}"
```

### Without Schema

Errors can be created without a schema. Args will be an empty object unless provided:

```typescript
const SystemError = error({
  name: "SystemError"
});

const err = SystemError({ code: 500 });
err.args  // { code: 500 } - args passed at creation
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
```

---

## 3. Matching Errors

### Exhaustive Pattern Matching

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

### Partial Matching with Fallback

For non-exhaustive matching, use `matchErrorPartial` with a default handler:

```typescript
const message = matchErrorPartial(result.error, {
  NotFoundError: (e) => `Missing: ${e.id}`,
  ValidationError: (e) => `Invalid: ${e.field}`,
}, (e) => `Unknown error: ${e._tag}`);  // Fallback for unhandled cases
```

---

## 4. Type Guards

### Static is() on Builders

Each error builder has a static `is()` method for precise type narrowing:

```typescript
const err = NotFoundError({ id: "123" });

// Type guard on builder - narrows to this specific error type
if (NotFoundError.is(err)) {
  err.id  // Fully narrowed to string
  err.resource  // string | undefined (based on schema)
}

// Check against a specific error type
if (ValidationError.is(err)) {
  err.field  // Fully narrowed
}
```

### Generic isError()

Check if any value is any error:

```typescript
import { isError } from '@deessejs/fp';

if (isError(err)) {
  console.log(err.name);  // All errors have name
  console.log(err.args);  // All errors have args
}
```

### Generic TaggedError.is()

Check if any value is a tagged error (has `_tag` discriminator):

```typescript
import { TaggedError } from '@deessejs/fp';

if (TaggedError.is(result.error)) {
  result.error._tag  // string - the discriminator
}
```

---

## 5. Enriching Errors

### Adding Notes

```typescript
const err = NotFoundError({ id: "123" });

// Chain enrichment - notes accumulate
const enriched = err
  .addNotes("Database query attempted at line 42")
  .addNotes("User action: GET /api/users/123");

enriched.notes  // readonly ["Database query attempted...", "User action: GET..."]

// Original error unchanged
err.notes  // readonly [] - empty
```

### Chaining Cause

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

### Error Equality

Errors are compared by reference, not structure:

```typescript
const err1 = NotFoundError({ id: "123" });
const err2 = NotFoundError({ id: "123" });

err1 === err2  // false - different instances
err1 === err1   // true - same instance

// For structural comparison, compare _tag + args
const isSameError = (a: Error, b: Error) =>
  a._tag === b._tag && JSON.stringify(a.args) === JSON.stringify(b.args);
```

---

## 6. Generator Composition (Result.gen)

### Yielding Errors Directly

The key power feature: yield errors directly without wrapping in `err()`.

```typescript
import { Result, ok, error, raise } from '@deessejs/fp';

const result = await Result.gen(async function* () {
  // Normal flow
  const user = yield* ok({ id: "123", name: "Alice", active: true });

  // Short-circuit with direct error yield
  if (!user.active) {
    yield* ValidationError({
      field: "user.active",
      message: "User account is inactive"
    });
  }

  return user;
});
// Result<{ id, name }, ValidationError>
```

### Using raise() for Throwing

For early termination outside of conditional yields:

```typescript
const result = await Result.gen(async function* () {
  const user = yield* fetchUser(userId);

  if (!user) {
    raise(NotFoundError({ id: userId, resource: "User" }));
  }

  // Execution stops here - raise never returns
  return user;
});
```

### Why Direct Yield Matters

```typescript
// Direct yield is clearer and composes with error builder
yield* NotFoundError({ id });

// Equivalent but more verbose
yield* err(NotFoundError({ id }));

// Both short-circuit the generator and return Err<never, NotFoundError>
```

---

## 7. Sensitive Data Handling

Errors automatically redact sensitive fields:

```typescript
const AuthError = error({
  name: "AuthError",
  schema: z.object({
    userId: z.string(),
    password: z.string(),  // Redacted
    token: z.string(),      // Redacted
    apiKey: z.string(),     // Redacted
  })
});

const err = AuthError({
  userId: "123",
  password: "super_secret_123",
  token: "ghp_xxxxx",
  apiKey: "sk-xxxxx"
});

// Redacted fields show as [REDACTED] in message
err.message  // "AuthError: {userId:123, password:[REDACTED], token:[REDACTED], apiKey:[REDACTED]}"

// Full args still accessible for programmatic use
err.args.password  // "super_secret_123" - NOT redacted in args
err.args.token     // "ghp_xxxxx" - NOT redacted in args
```

### How Redaction Works

Redacted fields are detected by name patterns:
- `password`, `passwd`, `pwd`
- `token`, `access_token`, `refresh_token`
- `secret`, `api_key`, `apikey`, `apiKey`
- `authorization`, `auth`
- `credential`, `private`

Redaction only applies to `message` and `stack`, not to `args`.

---

## 8. Validation Errors

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

// Valid args - works
const valid = ValidationError({ field: "email", message: "invalid format" });

// Invalid args - throws ValidationError with details
try {
  ValidationError({ field: 123 });  // ZodError: expected string
} catch (e) {
  e.name        // "ValidationError"
  e.args.value  // 123
  e.cause       // ZodError instance
}
```

---

## 9. Error Serialization

Errors support JSON serialization for logging and RPC:

```typescript
const err = NotFoundError({ id: "123", resource: "user" });

const json = JSON.stringify(err);
// '{"name":"NotFoundError","_tag":"NotFoundError","args":{"id":"123","resource":"user"},"message":"Resource not found: user"}'

// Parse back
const parsed = JSON.parse(json, Error.reviver);
// Restore error object (when using Error.reviver)
```

### Error.reviver

Use `Error.reviver` as JSON.parse reviver to restore error objects:

```typescript
const json = JSON.stringify(err);
const restored = JSON.parse(json, Error.reviver);
// restored instanceof NotFoundError
```

---

## 10. Error Groups

Group multiple errors for batch operations:

```typescript
import { exceptionGroup, error } from '@deessejs/fp';

const Errors = {
  parse: error({ name: "ParseError", schema: z.object({ input: z.string() }) }),
  validate: error({ name: "ValidateError", schema: z.object({ field: z.string() }) }),
};

// Collect errors during parallel operations
const results = await Promise.allSettled(inputs.map(process));
const failures = results
  .filter((r): r is PromiseRejectedResult => r.status === "rejected")
  .map(r => ParseError({ input: r.reason }));

if (failures.length > 0) {
  throw exceptionGroup("Multiple parsing failures", failures);
}
```

### Accessing Group Errors

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

---

## 11. Error Codes

Errors can include numeric codes for programmatic handling:

```typescript
const NotFoundError = error({
  name: "NotFoundError",
  code: 404,  // Numeric code
  schema: z.object({ id: z.string() })
});

const err = NotFoundError({ id: "123" });
err.code  // 404
```

### Common Error Codes

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

---

## 12. Complete Example

```typescript
import { error, ok, err, matchError, Result, raise } from '@deessejs/fp';
import { z } from 'zod';

// Define domain errors
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

// Use in a Result.gen composition
async function getUserResource(userId: string, resourceId: string) {
  return Result.gen(async function* () {
    const user = yield* fetchUser(userId);

    if (!user) {
      raise(NotFoundError({ id: userId, resource: "User" }));
    }

    if (!user.canRead(resourceId)) {
      raise(PermissionError({ action: "read", resource: resourceId }));
    }

    const resource = yield* fetchResource(resourceId);

    if (!resource) {
      raise(NotFoundError({ id: resourceId, resource: "Resource" }));
    }

    return resource;
  });
}

// Handle with exhaustive matching
const result = await getUserResource("u1", "r1");

matchError(result.error, {
  NotFoundError: (e) => console.log(`Not found: ${e.resource} ${e.id}`),
  ValidationError: (e) => console.log(`Validation failed: ${e.field} - ${e.message}`),
  PermissionError: (e) => console.log(`Permission denied: ${e.action} on ${e.resource}`),
});

// Serialize for logging
const logEntry = JSON.stringify(result.error, Error.reviver);
```

---

## 13. Summary

| Feature | DX |
|---------|-----|
| **Creation** | `error({ name, schema?, message?, code? })` - no classes |
| **Type guard** | `NotFoundError.is(err)` - builder method |
| **Pattern matching** | `matchError(err, { NotFoundError: fn })` - exhaustive |
| **Enrichment** | `err.addNotes(...).from(cause)` - chainable |
| **Generator yield** | `yield* NotFoundError({ id })` - direct yield |
| **Throwing** | `raise(NotFoundError({ id }))` - never returns |
| **Validation** | Zod schema - at creation time |
| **Sensitive data** | Automatic redaction in message |
| **Cause chain** | `err.from(previousError)` - preserve context |
| **Serialization** | `JSON.stringify(err, Error.reviver)` |
| **Error codes** | `err.code` - numeric identifier |

---

## 14. Implementation Reference

This DX specification serves as the source of truth for the error system. See the companion documents:

- [ANALYSIS.md](./ANALYSIS.md) - Analysis of current implementation vs target
- [ERROR-SYSTEM-FUSION.md](./ERROR-SYSTEM-FUSION.md) - Technical design for achieving this DX