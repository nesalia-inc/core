# @deessejs/core Examples

This directory contains practical, runnable examples demonstrating how to use `@deessejs/core` for functional programming patterns in TypeScript.

## Running Examples

Each example can be run independently using `tsx`:

```bash
# Install tsx globally if needed
npm install -g tsx

# Run an example
tsx examples/http-api/index.ts
```

## Examples Overview

### 1. [HTTP API Error Handling](./http-api/)
Demonstrates wrapping fetch API calls with `AsyncResult`, implementing retry logic, and handling timeouts.

**Topics**: AsyncResult, retry, timeout, error categorization

### 2. [Environment Configuration](./config/)
Type-safe environment configuration using `Maybe` for optional values and `Result` for required settings.

**Topics**: Maybe, Result, defaults, validation

### 3. [Form Validation](./form-validation/)
Comprehensive form validation with error accumulation and business vs system error distinction.

**Topics**: Result, Outcome, sequential validation, error accumulation

### 4. [Database Operations](./database/)
Safe database queries with constraint handling and transaction-like behavior.

**Topics**: AsyncResult, Try, constraint violations, composition

### 5. [Safe JSON Parsing](./json-parsing/)
Safe JSON parsing using `Try/attempt` with schema validation.

**Topics**: Try, attempt, schema validation, nested data

### 6. [Parallel Data Fetching](./parallel-fetch/)
Concurrent async operations using `AsyncResult.all`, `race`, and `traverse`.

**Topics**: AsyncResult, parallel execution, race, traverse

### 7. [CLI Argument Parsing](./cli-args/)
Type-safe CLI argument parsing with validation and error messages.

**Topics**: Maybe, Result, type conversion, subcommands

### 8. [File System Operations](./file-system/)
Safe file system operations with specific error types (NOT_FOUND, PERMISSION).

**Topics**: Try, AsyncResult, error categorization

### 9. [Rate Limiting & Timeouts](./resilience/)
Resilience patterns including retry strategies, timeouts, and rate limiting.

**Topics**: retry, sleep, withTimeout, backoff strategies

### 10. [Type Conversions Guide](./conversions/)
Converting between Result, Maybe, and Outcome types.

**Topics**: Type conversions, when to use each type

### 11. [Logger with Side Effects](./logging/)
Adding observability to pipelines with `tap` and `tapErr`.

**Topics**: tap, tapErr, logging, metrics, timing

### 12. [Authentication Flow](./auth/)
Authentication using `Outcome` to distinguish business vs system errors.

**Topics**: Outcome, multi-stage auth, token validation

## Type Selection Guide

| Type | Best For | Error Context |
|------|----------|---------------|
| **Result** | Success/failure with error details | Simple error messages |
| **Maybe** | Optional values | No error needed |
| **Outcome** | Rich error context | Business vs system errors |
| **Try** | Exception safety | Any thrown error |
| **AsyncResult** | Async operations | Promise-based errors |

## Common Patterns

### Method Chaining

```typescript
ok(data)
  .map(transform)
  .flatMap(validate)
  .tap(log)
  .getOrElse(default);
```

### Error Handling

```typescript
result.match(
  value => console.log("Success:", value),
  error => console.error("Error:", error)
);
```

### Type Narrowing

```typescript
const results: Result<number, string>[] = [ok(1), err("error")];

const oks = results.filter(isOk); // Ok<number>[]
const errs = results.filter(isErr); // Err<string>[]
```

## Progression Path

We recommend exploring examples in this order:

1. **Start Here**: `json-parsing` - Simple introduction to Try
2. **Basics**: `config`, `form-validation` - Maybe and Result fundamentals
3. **Async**: `http-api`, `database` - AsyncResult usage
4. **Advanced**: `parallel-fetch`, `resilience` - Complex async patterns
5. **Expert**: `auth`, `logging` - Production-ready patterns

## Contributing

When adding new examples:

1. Create a new directory under `examples/`
2. Add an `index.ts` file with runnable code
3. Add a `README.md` explaining the patterns
4. Update this README with the new example
5. Ensure all code is well-commented

## License

These examples are part of the `@deessejs/core` project.
