---
name: error-system
description: Use the library's error system, not native JS Error
paths:
  - "packages/fp/src/**/*.ts"
---

# Error System

This project has a structured domain error system. **Do not use native JavaScript `Error`**.

## The Library's Error System

Located in `packages/fp/src/error/`:

```typescript
import { error } from '@deessejs/fp';

// Create an error builder
const SizeError = error({ name: "SizeError" });

// Create an error instance
const domainError = SizeError({ current: 3, wanted: 5 });
// Error<{ current: number, wanted: number }>
```

## Error Properties

| Property | Description |
|----------|-------------|
| `name` | Error type identifier |
| `args` | Typed error data |
| `notes` | Additional context (can be added later) |
| `cause` | Chain to previous error |
| `message` | Human-readable message |
| `stack` | Stack trace |

## Error Methods

```typescript
// Enrich with notes
const enriched = domainError.addNotes("User input was validated here");

// Chain with cause
const withCause = domainError.from(previousError);
```

## Use With Result

```typescript
import { error, err, ok } from '@deessejs/fp';

const ParseError = error({ name: "ParseError" });

const parse = (input: string) => {
  if (!input) {
    return err(ParseError({ input }));
  }
  return ok(JSON.parse(input));
};
```

## With Zod Validation

```typescript
import { z } from 'zod';
import { error } from '@deessejs/fp';

const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string(), message: z.string() }),
  message: (args) => `Invalid: ${args.field}`
});

const err = ValidationError({ field: "email" }); // Validated
```

## Error Builders

- `error(options)` - Creates error type builder with optional Zod validation
- `exceptionGroup(errors)` - Groups multiple errors
- `raise(error)` - Functional throw

## Why Not Native Error?

Native JS `Error` has no type safety, no structured data, no enrichment. This library's error system provides:
- Typed error arguments
- Zod validation
- Note enrichment
- Cause chaining
- Sensitive data redaction

## When Creating New Error Types

```typescript
// In packages/fp/src/error/index.ts, export your error builders
export const ValidationError = error({ name: "ValidationError" });
export const NetworkError = error({ name: "NetworkError" });
```

Do not create custom error classes. Use `error()` builder.