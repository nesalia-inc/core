# Type Conversions Guide

This example demonstrates conversions between Result, Maybe, and Try.

## What You'll Learn

- **Result ↔ Maybe**: Converting error handling to optional values
- **Result → Try**: Simple errors to exception handling
- **Maybe ↔ Result**: Optional to typed errors
- **When to use each**: Choosing the right type

## Running the Example

```bash
tsx examples/conversions/index.ts
```

## Conversion Patterns

### Result to Maybe

```typescript
import { toMaybeFromResult } from "@deessejs/fp";

const result = ok(42);
const maybe = toMaybeFromResult(result); // Some(42)

const error = err("failed");
const noneMaybe = toMaybeFromResult(error); // None
```

### Maybe to Result

```typescript
import { toResult } from "@deessejs/fp";

const maybe = some("value");
const result = toResult(maybe, {
  field: "value",
  message: "Value is required"
}); // Ok("value")

const none = none<string>();
const error = toResult(none, {
  field: "value",
  message: "Value is required"
}); // Err({ field, message })
```

### Result to Try

```typescript
import { toTry } from "@deessejs/fp";

const okResult = ok("data");
const tryOk = toTry(okResult); // Try("data")

const errResult = err({ code: "INVALID" });
const tryErr = toTry(errResult); // Failure({ ... })
```

## Choosing the Right Type

| Type | Use When |
|------|----------|
| **Result** | Success/failure with error details |
| **Maybe** | Value may or may not exist |
| **Try** | Need exception safety |

## Related Examples

- [Environment Configuration](../config/) - Maybe for optional config
- [Form Validation](../form-validation/) - Result for validation
- [JSON Parsing](../json-parsing/) - Try for exception handling
