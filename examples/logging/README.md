# Logger with Side Effects

This example demonstrates side effects and logging with `tap` and `tapErr`.

## What You'll Learn

- **tap**: Side effects on success paths
- **tapErr**: Side effects on error paths
- **Observability**: Adding logging to pipelines
- **Metrics**: Timing and counting operations

## Running the Example

```bash
tsx examples/logging/index.ts
```

## Key Patterns

### 1. Logging Success

```typescript
ok(42)
  .tap(value => logger.info(`Processing: ${value}`))
  .map(value => value * 2)
  .tap(value => logger.debug(`Result: ${value}`));
```

### 2. Logging Errors

```typescript
ok(data)
  .flatMap(validate)
  .tapErr(error => logger.error(`Validation failed`, error));
```

### 3. Timing Operations

```typescript
const timer = new Timer("operation");

ok(data)
  .tap(() => timer.start())
  .flatMap(process)
  .tap(() => timer.end());
```

### 4. Request Tracking

```typescript
ok(request)
  .tap(req => logger.info(`[${req.id}] ${req.method} ${req.path}`))
  .flatMap(handle)
  .tap(res => logger.info(`[${req.id}] Response: ${res.status}`));
```

## When to Use

✅ **Use when:**
- Adding observability without breaking pipelines
- Logging success/error paths
- Collecting metrics
- Debugging data flow

❌ **Don't use when:**
- Side effects should change return values
- Need to abort on errors (use tapErr)

## Related Examples

- [HTTP API Error Handling](../http-api/) - Request/response logging
- [Database Operations](../database/) - Query logging
