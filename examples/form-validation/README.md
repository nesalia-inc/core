# Form Validation

This example demonstrates comprehensive form validation using `Result`.

## What You'll Learn

- **Sequential validation**: Fail-fast approach
- **Accumulate errors**: Show all validation errors at once
- **Result type**: Error handling with typed errors
- **Conditional validation**: Validate optional fields
- **Async validation**: Check against database/API

## Running the Example

```bash
tsx examples/form-validation/index.ts
```

## Key Patterns

### 1. Fail-Fast Validation

```typescript
return ok(form)
  .flatMap((data) => validateName(data.name).map(name => ({ ...data, name })))
  .flatMap((data) => validateEmail(data.email).map(email => ({ ...data, email })));
```

### 2. Accumulate All Errors

```typescript
const errors: ValidationError[] = [];

const nameResult = validateName(form.name);
if (nameResult.isErr()) errors.push(nameResult.error);

if (errors.length > 0) {
  return err({ errors });
}
```

### 3. Business vs System Errors

```typescript
// Business error (user-correctable)
if (!email.includes('@')) {
  return err({ field: 'email', code: 'INVALID' });
}

// System error (unexpected)
if (database.isDown()) {
  return err({ type: 'DATABASE_ERROR', internal: true });
}
```

### 4. Async Validation

```typescript
const syncResult = validateFormSequential(form);
if (syncResult.isErr()) return syncResult;

const exists = await emailExists(form.email);
if (exists) {
  return err({ field: 'email', code: 'ALREADY_EXISTS' });
}
```

## When to Use Each Pattern

| Pattern | Use When |
|---------|----------|
| Sequential | You want to stop at first error |
| Accumulate | Better UX to show all errors |
| Async | Validation requires external check |

## Related Examples

- [Environment Configuration](../config/) - Similar validation patterns
- [Authentication Flow](../auth/) - User validation in practice
