---
paths:
  - "**/*.ts"
---

# Error Handling Rules

## Use the Native Error System

Any feature related to error handling must use the native Error system from `@deessejs/fp` instead of JavaScript's native `Error`.

### Why This Matters

- The native Error system provides structured errors with `addNotes()`, `from()`, and `cause` chaining
- Native `Error` objects don't support enrichment methods
- Mixing native errors breaks the Result/AsyncResult pattern

### Requirements

1. **Use `error()` factory** to create domain-specific errors:
   ```typescript
   import { error } from "@deessejs/fp";

   const SizeError = error({
     name: "SizeError",
     schema: z.object({ current: z.number(), wanted: z.number() }),
   });
   ```

2. **Wrap all Promise rejections** in `fromPromise` which automatically converts to `PanicError`:
   ```typescript
   import { fromPromise } from "@deessejs/fp";

   // Good
   const result = fromPromise(fetch("/api"));

   // Bad - native Error in async contexts
   ```

3. **Use `AbortError`** from the error system for cancellation:
   ```typescript
   import { error } from "@deessejs/fp";
   const AbortError = error({ name: "AbortError", message: () => "Operation aborted" });
   ```

4. **Error enrichment** is only available on structured errors:
   ```typescript
   import { mapErr } from "@deessejs/fp";

   // Good - supports addNotes(), from()
   result.mapErr(e => e.addNotes("Additional context"));

   // Bad - native Error has no addNotes()
   result.mapErr(e => new Error(e.message));
   ```

### When Creating New Error Types

Always use the `error()` factory with optional Zod validation:

```typescript
import { error } from "@deessejs/fp";
import { z } from "zod";

const ValidationError = error({
  name: "ValidationError",
  schema: z.object({ field: z.string() }),
  message: (args) => `"${args.field}" is invalid`,
});
```

### Anti-patterns to Avoid

- Do not use `new Error()` for domain errors
- Do not use `throw new Error()` in Result-returning functions - use `raise()` instead
- Do not let native errors leak from wrapped promises

### Reference

See `packages/fp/src/error/` for the complete Error system implementation.