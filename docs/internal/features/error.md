# Error System

The Error system provides structured error handling inspired by Python's exception handling. It enables rich errors with validation, enrichment, chaining, and grouping.

## Why a Custom Error System?

JavaScript's built-in `Error` class is too limited for production applications:

```typescript
// Problem: Errors lose context as they propagate
throw new Error('Failed');  // What failed? Why?

// Solution: Structured errors with context
import { error } from '@deessejs/fp';
const SizeError = error({
  name: 'SizeError',
  schema: z.object({ current: z.number(), wanted: z.number() })
});
throw SizeError({ current: 3, wanted: 5 });
// Contains: name, args, notes[], cause
```

---

## Quick Start

```typescript
import { error, exceptionGroup, ok, err, isErr } from '@deessejs/fp';
import { z } from 'zod';

// Define error types (with optional Zod validation)
const SizeError = error({
  name: 'SizeError',
  schema: z.object({
    current: z.number(),
    wanted: z.number()
  })
});

const ValidationError = error({
  name: 'ValidationError',
  args: {} as { field: string }
});

// Create errors
const e = SizeError({ current: 3, wanted: 5 });
// Err { error: Error { name: 'SizeError', args: { current: 3, wanted: 5 }, notes: [], cause: null } }

// Use in Result
const result = ok(10).flatMap(n => {
  if (n > 5) return SizeError({ current: n, wanted: 5 });
  return ok(n);
});
```

---

## API Reference

### `error(options)` - Create an Error type

#### With Zod schema (recommended)

```typescript
import { error } from '@deessejs/fp';
import { z } from 'zod';

const SizeError = error({
  name: 'SizeError',
  schema: z.object({
    current: z.number(),
    wanted: z.number()
  })
});

// Args are validated
const e = SizeError({ current: 3, wanted: 5 });
// Ok { ok: false, error: Error { ... } }

// Invalid args throw a validation error
const invalid = SizeError({ current: 'not a number', wanted: 5 });
// Err with ErrorValidation
```

#### Without validation

```typescript
import { error } from '@deessejs/fp';

const ValidationError = error({
  name: 'ValidationError',
  args: {} as { field: string }
});

const e = ValidationError({ field: 'email' });
```

#### Error structure

```typescript
interface Error<T = unknown> {
  readonly name: string;       // Error type name
  readonly args: T;             // Structured error data
  readonly notes: readonly string[];  // Contextual notes
  readonly cause: Error | null; // Chained error
}
```

---

### Error Methods

#### `addNotes(...notes)` - Add context

```typescript
import { error } from '@deessejs/fp';

const ValidationError = error({
  name: 'ValidationError',
  args: {} as { field: string }
});

const e = ValidationError({ field: 'email' })
  .addNotes('Form submission failed', 'User input was invalid');
// error.notes = ['Form submission failed', 'User input was invalid']
```

#### `from(cause)` - Chain errors

```typescript
import { error } from '@deessejs/fp';

const NetworkError = error({
  name: 'NetworkError',
  args: {} as { host: string }
});

const SizeError = error({
  name: 'SizeError',
  args: {} as { current: number; wanted: number }
});

const cause = NetworkError({ host: 'api.example.com' });
const e = SizeError({ current: 3, wanted: 5 }).from(cause.error);
// e.error.cause = NetworkError { host: 'api.example.com' }
```

#### Builder methods

You can also add notes and causes before creating the error:

```typescript
import { error } from '@deessejs/fp';

const ValidationError = error({
  name: 'ValidationError',
  args: {} as { field: string }
});

// Add notes to builder
const ErrorWithNotes = ValidationError.addNotes('Operation: save');
const e = ErrorWithNotes({ field: 'email' });

// Add cause to builder
const ErrorWithCause = ValidationError.from(causeError);
const e2 = ErrorWithCause({ field: 'email' });

// Chain
const e3 = ValidationError.addNotes('Context').from(causeError)({ field: 'email' });
```

---

### `exceptionGroup(exceptions)` - Group multiple errors

```typescript
import { error, exceptionGroup } from '@deessejs/fp';

const SizeError = error({
  name: 'SizeError',
  args: {} as { value: number }
});

const ValidationError = error({
  name: 'ValidationError',
  args: {} as { field: string }
});

const group = exceptionGroup([
  SizeError({ value: 10 }),
  ValidationError({ field: 'email' }),
  SizeError({ value: 20 })
]);

// group.name = 'ExceptionGroup'
// group.exceptions = [SizeError, ValidationError, SizeError]
```

---

### `raise(error)` - Return error in transformations

```typescript
import { error, raise, ok } from '@deessejs/fp';

const SizeError = error({
  name: 'SizeError',
  args: {} as { current: number; wanted: number }
});

// Use in flatMap chain
const result = ok(10).flatMap(n => {
  if (n > 5) {
    return raise(SizeError({ current: n, wanted: 5 }));
  }
  return ok(n);
});
```

---

### Type Guards

#### `isError(value)` - Check if value is Error

```typescript
import { isError } from '@deessejs/fp';

const e = SizeError({ value: 10 });
isError(e.error); // true
isError('string'); // false
```

#### `isErrorGroup(value)` - Check if value is ErrorGroup

```typescript
import { isErrorGroup } from '@deessejs/fp';

const group = exceptionGroup([SizeError({ value: 10 })]);
isErrorGroup(group); // true
```

#### `isErrWithError(result)` - Check if Result contains Error

```typescript
import { isErrWithError } from '@deessejs/fp';

const e = SizeError({ value: 10 });
const result = err(e.error);

isErrWithError(result); // true
isErrWithError(ok(42)); // false
```

---

### Utility Functions

#### `getErrorMessage(error)` - Get human-readable message

```typescript
import { getErrorMessage } from '@deessejs/fp';

const e = SizeError({ current: 3, wanted: 5 });
getErrorMessage(e.error);
// 'SizeError: {"current":3,"wanted":5}'

const group = exceptionGroup([e.error, e.error]);
getErrorMessage(group);
// 'ExceptionGroup: 2 error(s)'
```

#### `flattenErrorGroup(group)` - Flatten nested groups

```typescript
import { flattenErrorGroup } from '@deessejs/fp';

const inner = exceptionGroup([SizeError({ value: 10 })]);
const outer = exceptionGroup([inner, ValidationError({ field: 'x' })]);

flattenErrorGroup(outer);
// [SizeError { value: 10 }, ValidationError { field: 'x' }]
```

#### `filterErrorsByName(group, name)` - Filter errors by type

```typescript
import { filterErrorsByName } from '@deessejs/fp';

const group = exceptionGroup([
  SizeError({ value: 10 }),
  ValidationError({ field: 'email' }),
  SizeError({ value: 20 })
]);

filterErrorsByName(group, 'SizeError');
// [SizeError { value: 10 }, SizeError { value: 20 }]
```

---

## Real-World Examples

### Validation with Zod

```typescript
import { error } from '@deessejs/fp';
import { z } from 'zod';

const ValidationError = error({
  name: 'ValidationError',
  schema: z.object({
    field: z.string().min(1),
    message: z.string()
  })
});

// This will fail validation
const e = ValidationError({ field: 123 }); // field must be string
// Error: 'ValidationErrorValidationError'
// notes: ['Expected string, received number']
```

### API Error Handling

```typescript
import { error, ok, err, isErr } from '@deessejs/fp';

const NetworkError = error({
  name: 'NetworkError',
  args: {} as { url: string; status?: number }
});

const NotFoundError = error({
  name: 'NotFoundError',
  args: {} as { resource: string }
});

const fetchUser = (id: number) => ok({ id, name: 'John' })
  .flatMap(user => {
    if (id < 0) {
      return NetworkError({ url: `/users/${id}` }).addNotes('Invalid ID');
    }
    return ok(user);
  });

// Usage
const result = fetchUser(-1);
if (isErr(result)) {
  console.log(result.error.name); // 'NetworkError'
  console.log(result.error.notes); // ['Invalid ID']
}
```

### Error Grouping

```typescript
import { error, exceptionGroup, flattenErrorGroup } from '@deessejs/fp';

const ValidationError = error({
  name: 'ValidationError',
  args: {} as { field: string }
});

const errors = [
  ValidationError({ field: 'email' }),
  ValidationError({ field: 'name' }),
  ValidationError({ field: 'age' })
];

const group = exceptionGroup(errors);
const allErrors = flattenErrorGroup(group);

// Process each error
allErrors.forEach(e => {
  console.log(`${e.name}: ${e.args.field}`);
});
```

---

## Comparison

| Feature | @deessejs/fp | Standard Error | fp-ts |
|---------|---------------|---------------|-------|
| Structured args | Yes | No | No |
| Zod validation | Yes | No | No |
| Notes/context | Yes | No | No |
| Error chaining | Yes | Limited | No |
| Error grouping | Yes | No | No |
| Bundle size | ~2KB | 0 | ~40KB |

---

## Best Practices

### 1. Define errors at module level

```typescript
// errors.ts
export const ValidationError = error({
  name: 'ValidationError',
  schema: z.object({ field: z.string(), message: z.string() })
});

export const NetworkError = error({
  name: 'NetworkError',
  schema: z.object({ url: z.string(), status: z.number().optional() })
});
```

### 2. Add notes for debugging

```typescript
const result = validateUser(input)
  .addNotes('Input validation failed')
  .addNotes(`Received: ${JSON.stringify(input)}`);
```

### 3. Chain errors for traceability

```typescript
const result = db.save(data).flatMap(saved =>
  api.notify(saved.id).mapErr(apiError =>
    apiError.from(dbError) // Chain the original error
  )
);
```

### 4. Use discriminated unions for error handling

```typescript
const handleError = (error: Error) => {
  switch (error.name) {
    case 'ValidationError':
      return formatValidation(error.args);
    case 'NetworkError':
      return formatNetwork(error.args);
  }
};
```

---

## Known Limitations & Future Improvements

### 1. Error vs Result Ambiguity

**Current behavior:** Calling the error factory (e.g., `SizeError({ ... })`) returns a `Result.Err`.

**Note:** This is intentional for convenience, but can be confusing. Future versions may separate:

```typescript
// Potential future API
const e = SizeError.create({ current: 3, wanted: 5 });  // Returns Error object
const result = SizeError.fail({ current: 3, wanted: 5 });  // Returns Result.Err
```

### 2. Zod Validation Errors

**Current behavior:** If Zod validation fails, a different error type is returned.

**Issue:** This can mask the original intent if args are malformed.

**Note:** Consider using `z.infer` for type-safe definitions without runtime validation:

```typescript
import { z } from 'zod';

const schema = z.object({ current: z.number(), wanted: z.number() });
type SizeErrorArgs = z.infer<typeof schema>;

const SizeError = error({
  name: 'SizeError',
  args: {} as SizeErrorArgs
});
```

### 3. `raise()` Semantics

**Current behavior:** `raise()` is an alias for returning an Err.

**Note:** Future versions may rename to `toErr()` for clarity, or be removed in favor of explicit `return err(...)`.

### 4. No Stack Trace

**Current behavior:** Errors don't capture stack traces.

**Issue:** Debugging in complex applications is difficult without stack traces.

**Workaround:** Wrap with `Try` to capture original exceptions:

```typescript
import { attempt, getErrorMessage } from '@deessejs/fp';

const result = attempt(() => mightThrow());
if (!result.ok) {
  // Original stack is preserved in the caught error
  console.log(result.error);
}
```

> **Note:** Stack trace support may be added in future versions.

### 5. Compatibility with AggregateError

**Current behavior:** `exceptionGroup` creates a custom `ErrorGroup` type.

**Note:** This is not directly compatible with native `AggregateError`. Future versions may add compatibility or conversion methods.

### 6. No Custom Message Template

**Current behavior:** `getErrorMessage` serializes `args` to JSON.

**Note:** Custom message templates may be added in future versions:

```typescript
// Potential future API
const SizeError = error({
  name: 'SizeError',
  message: (args) => `Expected ${args.wanted}, got ${args.current}`
});
```

### 7. Serialization

**Current behavior:** Errors are plain objects but don't have a `toJSON()` method.

**Note:** For network transmission, serialize manually:

```typescript
const serialize = (error: Error): object => ({
  name: error.name,
  args: error.args,
  notes: [...error.notes],
  cause: error.cause ? serialize(error.cause) : null
});
```

### 8. Zod as Peer Dependency

**Note:** Currently, Zod is a required dependency. In future versions, it may become a peer dependency for users who don't need schema validation.

---

## Related

- [Result](./result.md) - Works with structured errors
- [Try](./try.md) - Wrap throwing functions
- [AsyncResult](./async-result.md) - Async operations with error handling
