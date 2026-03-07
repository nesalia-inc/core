# Type Conversions Guide

This example demonstrates conversions between Result, Maybe, and Outcome.

## What You'll Learn

- **Result ↔ Maybe**: Converting error handling to optional values
- **Result → Outcome**: Simple errors to rich error context
- **Maybe ↔ Outcome**: Optional to typed errors
- **When to use each**: Choosing the right type

## Running the Example

```bash
tsx examples/conversions/index.ts
```

## Conversion Patterns

### Result to Maybe

```typescript
import { toMaybeFromResult } from "@deessejs/core";

const result = ok(42);
const maybe = toMaybeFromResult(result); // Some(42)

const error = err("failed");
const noneMaybe = toMaybeFromResult(error); // None
```

### Maybe to Result

```typescript
import { toResult } from "@deessejs/core";

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

### Result to Outcome

```typescript
import { toOutcome } from "@deessejs/core";

const okResult = ok("data");
const outcome = toOutcome(okResult); // Success("data")

const errResult = err({ code: "INVALID" });
const causeOutcome = toOutcome(errResult); // Cause({ ... })
```

## Choosing the Right Type

| Type | Use When |
|------|----------|
| **Result** | Success/failure with error details |
| **Maybe** | Value may or may not exist |
| **Outcome** | Need to distinguish business vs system errors |

## Related Examples

- [Environment Configuration](../config/) - Maybe for optional config
- [Form Validation](../form-validation/) - Result for validation
- [Authentication Flow](../auth/) - Outcome for error types
