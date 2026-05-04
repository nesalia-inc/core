---
dep: DEP-0008
title: "Serialization: Converting Types to/from Plain Data"
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

A serialization system for converting `Result`, `Maybe`, and `Error` types to and from plain JavaScript objects. This enables safe persistence (localStorage, databases), network transmission (REST APIs, WebSockets), and inter-process communication with full type preservation.

## Motivation

Functional types like `Result`, `Maybe`, and `Error` need to cross boundaries where only plain data exists:

1. **Persistence** — Store operation results in databases or localStorage
2. **Network transmission** — Send results over HTTP APIs or WebSockets
3. **Inter-process communication** — Share data between workers or services
4. **Testing** — Serialize/deserialize for snapshot testing
5. **Debugging** — Log structured data with full type information

## Core Concept: Tagged JSON Format

All types use a consistent JSON format with a `_tag` discriminator for reliable reconstruction:

```typescript
// Result Ok serialized
{ "_tag": "Ok", "value": { ... } }

// Result Err serialized
{ "_tag": "Err", "error": { ... } }

// Maybe Some serialized
{ "_tag": "Some", "value": { ... } }

// Maybe None serialized
{ "_tag": "None" }

// Error serialized (TaggedError implements toJSON automatically)
{ "name": "NotFoundError", "_tag": "NotFoundError", "args": { ... }, "message": "..." }
```

**Note:** `TaggedError` implements `toJSON()` automatically, so errors serialize naturally via `JSON.stringify()`.

## Detailed Design

### Result Serialization

#### Result.serialize(result)

Serializes a Result to a plain object:

```typescript
import { ok, err, Result, error } from '@deessejs/fp';

const success = ok({ id: "123", name: "Alice" });
const serialized = Result.serialize(success);
// { "_tag": "Ok", "value": { "id": "123", "name": "Alice" } }

const failed = err(NotFoundError({ id: "123" }));
const serialized = Result.serialize(failed);
// { "_tag": "Err", "error": { "name": "NotFoundError", "_tag": "NotFoundError", "args": { "id": "123" }, "message": "..." } }
```

#### Result.deserialize(json)

Reconstructs a Result from a plain object. Returns `Err<ResultDeserializationError>` for malformed data:

```typescript
const json = { "_tag": "Ok", "value": { "id": "123", "name": "Alice" } };
const result = Result.deserialize(NotFoundError, json);
// Ok<{ id: string, name: string }>

const json = { "_tag": "Err", "error": { "name": "NotFoundError", "_tag": "NotFoundError", "args": { "id": "123" } } };
const result = Result.deserialize(NotFoundError, json);
// Err<NotFoundError>

// Invalid data
const invalid = { "_tag": "Unknown" };
const badResult = Result.deserialize(NotFoundError, invalid);
// Err<ResultDeserializationError>
```

### Maybe Serialization

#### Maybe.serialize(maybe)

Serializes a Maybe to a plain object:

```typescript
import { some, none, Maybe } from '@deessejs/fp';

const present = some({ id: "123", name: "Alice" });
const serialized = Maybe.serialize(present);
// { "_tag": "Some", "value": { "id": "123", "name": "Alice" } }

const absent = none();
const serialized = Maybe.serialize(absent);
// { "_tag": "None" }
```

#### Maybe.deserialize(json)

Reconstructs a Maybe from a plain object:

```typescript
const json = { "_tag": "Some", "value": { "id": "123", "name": "Alice" } };
const maybe = Maybe.deserialize(json);
// Some<{ id: string, name: string }>

const json = { "_tag": "None" };
const maybe = Maybe.deserialize(json);
// None
```

### Error Serialization

Errors serialize naturally to JSON-compatible objects:

```typescript
const NotFoundError = error({
  name: "NotFoundError",
  schema: z.object({ id: z.string(), resource: z.string() })
});

const err = NotFoundError({ id: "123", resource: "user" });

// JSON.stringify handles error serialization (TaggedError implements toJSON)
const json = JSON.stringify(err);
// '{"name":"NotFoundError","_tag":"NotFoundError","args":{"id":"123","resource":"user"},"message":"Resource not found: user"}'
```

#### Error.reviver

A standard JSON reviver function for reconstructing error instances with prototype pollution protection:

```typescript
const json = '{"name":"NotFoundError","_tag":"NotFoundError","args":{"id":"123","resource":"user"},"message":"Resource not found: user"}';

const restored = JSON.parse(json, Error.reviver);
// NotFoundError instance (instanceof check works)
```

**Security:** The reviver rejects keys that could cause prototype pollution (`__proto__`, `constructor`, `prototype`). Malicious JSON such as `{"__proto__": {"admin": true}}` is safely converted to a plain object without modifying the prototype chain.

**Reconstruction behavior:**
- Known error tags (registered in `ErrorRegistry`) → reconstruct as domain error
- Unknown error tags → reconstruct as base `Error` type

## Security Considerations

The serialization system handles untrusted input. Deserialized data should always be validated:

```typescript
// Re-validate with Zod for external data
const result = Result.deserialize(errorRegistry, json);
const validated = result.map(user => UserSchema.parse(user));
```

**Prototype pollution prevention:** When using `Error.reviver` with `JSON.parse`, malicious payloads attempting to inject properties via `__proto__`, `constructor`, or `prototype` keys are rejected. Only keys present in the original error definition are allowed through.

## ResultDeserializationError

When deserialization fails, the library returns a structured error:

```typescript
const ResultDeserializationError = error({
  name: "ResultDeserializationError",
  schema: z.object({
    reason: z.string(),
    input: z.unknown()
  })
});
```

**Causes of deserialization failure:**
- Invalid JSON structure
- Missing required fields (`_tag`, `value`)
- Unknown `_tag` value
- Invalid error tag in Err

## Schema Validation with Zod

The serialized JSON can be validated at runtime using Zod schemas. This provides compile-time type safety for the JSON structure and runtime validation for untrusted data.

### Typed Serialized JSON

The `ResultJSON<T, E>` type alias automatically preserves the value type:

```typescript
interface User {
  id: string;
  name: string;
}

// TypeScript knows the serialized shape
type UserResultJSON = ResultJSON<User, NotFoundError>;
// OkJSON<User> | ErrJSON<NotFoundError>
// Resolves to:
// | { _tag: "Ok"; value: User }
// | { _tag: "Err"; error: NotFoundError }
```

### Zod Schemas for Validation

Zod schemas can be derived from the JSON type definitions for runtime validation:

```typescript
import { z } from 'zod';

// Base schemas for tagged types
const OkJSONSchema = <T extends z.ZodType>(valueSchema: T) =>
  z.object({
    _tag: z.literal("Ok"),
    value: valueSchema,
    _version: z.number().optional()
  });

const ErrJSONSchema = <E extends z.ZodType>(errorSchema: E) =>
  z.object({
    _tag: z.literal("Err"),
    error: errorSchema,
    _version: z.number().optional()
  });

// Define domain error schema
const NotFoundErrorSchema = z.object({
  name: z.literal("NotFoundError"),
  _tag: z.literal("NotFoundError"),
  args: z.object({ id: z.string() }),
  message: z.string()
});

// Result schema for a specific type
const UserResultSchema = z.discriminatedUnion("_tag", [
  OkJSONSchema(z.object({ id: z.string(), name: z.string() })),
  ErrJSONSchema(NotFoundErrorSchema)
]);

// Validate serialized JSON
const validateUserResult = (json: unknown) => UserResultSchema.safeParse(json);
```

### Validation After Deserialization

Combine deserialization with validation for defense in depth:

```typescript
const NotFoundError = error({
  name: "NotFoundError",
  schema: z.object({ id: z.string() })
});

const NotFoundErrorSchema = z.object({
  name: z.literal("NotFoundError"),
  _tag: z.literal("NotFoundError"),
  args: z.object({ id: z.string() }),
  message: z.string()
});

const UserOkSchema = z.object({
  _tag: z.literal("Ok"),
  value: z.object({ id: z.string(), name: z.string() })
});

const UserResultSchema = z.discriminatedUnion("_tag", [
  UserOkSchema,
  z.object({ _tag: z.literal("Err"), error: NotFoundErrorSchema })
]);

// Deserialize and validate in one step
const result = Result.deserialize({ NotFoundError }, json)
  .map(val => UserResultSchema.parse(val)); // Throws if invalid

// Or use safeParse for non-throwing validation
const validated = UserResultSchema.safeParse(
  Result.serialize(deserialized)
);
```

### Deriving Schemas from Error Definitions

Schemas can be auto-generated from `error()` definitions:

```typescript
const NotFoundError = error({
  name: "NotFoundError",
  schema: z.object({ id: z.string(), resource: z.string() })
});

// Auto-derive the JSON schema for serialization validation
const NotFoundErrorJSONSchema = z.object({
  name: z.literal(NotFoundError.name),
  _tag: z.literal(NotFoundError.name),
  args: NotFoundError.schema,
  message: z.string()
});
```

## Schema Evolution

Types may evolve over time. Serialization supports schema migration through versioned formats:

```typescript
// Version 1: { name: string }
// Version 2: { name: string, email: string }

// Migration function
const migrateUser = (v1: { name: string }): { name: string, email: string } => ({
  ...v1,
  email: v1.name.toLowerCase() + "@example.com"
});

// Deserialize with migration
const json = { "_tag": "Ok", "value": { "name": "Alice" }, "_version": 1 };
const result = Result.deserialize(UserError, json, {
  migrations: { 1: migrateUser }
});
```

## Type Signatures

```typescript
// Result serialization
function Result.serialize<T, E>(result: Result<T, E>): ResultJSON<T, E>;
function Result.deserialize<E>(
  errorCtors: ErrorRegistry,
  json: unknown
): Result<unknown, E>;

// Maybe serialization
function Maybe.serialize<T>(maybe: Maybe<T>): MaybeJSON<T>;
function Maybe.deserialize<T>(json: unknown): Maybe<T>;

// Error reviver
function Error.reviver(key: string, value: unknown): unknown;

// Deserialization options
interface DeserializeOptions<T> {
  migrations?: Record<number, (v: unknown) => T>;
  schema?: z.ZodSchema<T>;
}

// Error registry for reconstructing domain errors
interface ErrorRegistry {
  [tag: string]: ErrorConstructor | ((args: unknown) => TaggedError);
}
```

## Type Definitions

```typescript
// JSON representation of Ok
interface OkJSON<T> {
  _tag: "Ok";
  value: T;
  _version?: number;
}

// JSON representation of Err
interface ErrJSON<E> {
  _tag: "Err";
  error: E;
  _version?: number;
}

// JSON representation of Result
type ResultJSON<T, E> = OkJSON<T> | ErrJSON<E>;

// JSON representation of Some
interface SomeJSON<T> {
  _tag: "Some";
  value: T;
}

// JSON representation of None
interface NoneJSON {
  _tag: "None";
}

// JSON representation of Maybe
type MaybeJSON<T> = SomeJSON<T> | NoneJSON;
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Method loss | `JSON.stringify` strips methods. Always use `serialize()` first, not direct `JSON.stringify` |
| Invalid input | `deserialize()` returns `Err<ResultDeserializationError>` for malformed data |
| `undefined` in value | Serialized as-is, may cause issues in some JSON parsers |
| `null` in value | Serialized as `null` correctly |
| Circular references | Throws `TypeError` - flatten your data first |
| `NaN` / `Infinity` | Serialized as `null` in JSON (JSON spec limitation) |
| `Date` object in value | Serialized as ISO string via `toISOString()` |
| `BigInt` in value | Throws `TypeError` - convert to string or number first |
| `Map` in value | Serialized as plain object (keys become stringified) |
| `Set` in value | Serialized as array (order preserved, duplicates allowed) |
| `RegExp` in value | Serialized as empty object `{}` - use custom serialization if needed |
| `Symbol` in value | Symbol lost in JSON - use string representation if needed |
| `ArrayBuffer` / `DataView` | Serialized as `0` - use base64 encoding if needed |
| Nested `Result` in value | Recursively serialized with preserved `_tag` structure |
| Nested `Maybe` in value | Recursively serialized with preserved `_tag` structure |
| Prototype pollution attempt | Rejected by reviver, returns plain object instead |
| Unknown error tag in JSON | Deserialized as base `Error` type |
| Missing version in migrated data | Treated as version 0, no migration applied |

## Recommended Patterns

### Roundtrip Workflow

Always use serialize/deserialize for full type preservation:

```typescript
// Serialize → JSON.stringify → JSON.parse → Deserialize
const serialized = Result.serialize(result);
const json = JSON.stringify(serialized);
const parsed = JSON.parse(json);
const restored = Result.deserialize(errorRegistry, parsed);
```

### Cache Failures

Serialize both `Ok` and `Err` results to avoid redundant operations for known failures:

```typescript
// Cache both success and failure
cache.set(key, Result.serialize(result));

// Later, restore and use
const cached = cache.get(key);
if (!cached) return;

const result = Result.deserialize(errorRegistry, cached);
```

### Validate After Deserialization

Re-validate values that originate from external sources:

```typescript
const result = Result.deserialize(errorRegistry, json);

// Re-validate with Zod for external data
const validated = result.map(user => UserSchema.parse(user));
```

## Error Reconstruction

When deserializing `Result` or `Maybe` containing errors, the error constructors must be provided:

```typescript
// Define error constructors
const NotFoundError = error({ name: "NotFoundError", schema: z.object({ id: z.string() }) });
const ValidationError = error({ name: "ValidationError", schema: z.object({ field: z.string() }) });

// Register error constructors for deserialization
const errorRegistry = { NotFoundError, ValidationError };

// Deserialize with error registry
const result = Result.deserialize(errorRegistry, json);
```

## Complete Example

```typescript
import { Result, Maybe, ok, err, some, none, error } from '@deessejs/fp';
import { z } from 'zod';

// Define domain errors
const NotFoundError = error({
  name: "NotFoundError",
  schema: z.object({ id: z.string() })
});

const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string(), message: z.string() })
});

const errorRegistry = { NotFoundError, ValidationError };

// Serialize operation result
async function fetchAndSerialize(userId: string): Promise<string> {
  const result = await fetchUser(userId);

  // Cache both success and failure
  return JSON.stringify(Result.serialize(result));
}

// Deserialize on the client
function deserializeResponse(json: string) {
  const parsed = JSON.parse(json);
  return Result.deserialize(errorRegistry, parsed);
}

// Maybe serialization for nested data
async function fetchAndSerializeWithEmail(userId: string): Promise<string> {
  const userResult = await fetchUser(userId);
  const emailMaybe = userResult.ok
    ? await fetchEmail(userResult.value.id)
    : none();

  return JSON.stringify({
    user: Result.serialize(userResult),
    email: Maybe.serialize(emailMaybe)
  });
}
```

## Relationship to Other DEPs

The serialization system works with all core types:

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — Result types serialize with full type preservation
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Error types include metadata for reconstruction (TaggedError implements toJSON)
- [DEP-0003-MAYBE](./DEP-0003-MAYBE.md) — Maybe types use tagged JSON format

## Benefits

| Benefit | Description |
|---------|-------------|
| **Type preservation** | Serialized data carries discriminator tags for reliable reconstruction |
| **Method safety** | `serialize()` handles methods correctly (unlike raw `JSON.stringify`) |
| **Error differentiation** | `ResultDeserializationError` distinguishes deserialization failures from domain errors |
| **Interoperability** | Plain JSON works across language boundaries |
| **Schema evolution** | Migration functions handle versioned data formats |
| **Error fidelity** | Domain errors reconstruct with full type information |

## Open Questions

1. **Binary serialization** — Should we support binary formats (MessagePack, Protocol Buffers) for efficiency? Or focus only on JSON?

2. **Streaming serialization** — For large arrays of Results, should there be a streaming serializer to avoid memory spikes?

3. **Compressed JSON** — Should we offer optional compression for large payloads (gzip, zstd)?

## References

- [DEP-0001-RESULT](./DEP-0001-RESULT.md) — Result type
- [DEP-0002-ERROR](./DEP-0002-ERROR.md) — Error type
- [DEP-0003-MAYBE](./DEP-0003-MAYBE.md) — Maybe type
- [better-result Serialization](https://better-result.dev/advanced/serialization) — Reference for serialization patterns
- [JSON.parse reviver](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#reviver)
