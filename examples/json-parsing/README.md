# Safe JSON Parsing

This example demonstrates safe JSON parsing using `Try/attempt`.

## What You'll Learn

- **Try/attempt**: Wrapping unsafe operations
- **Schema validation**: Validating parsed structure
- **Default values**: Handling missing fields
- **Nested data**: Safely accessing nested properties

## Running the Example

```bash
tsx examples/json-parsing/index.ts
```

## Key Patterns

### 1. Basic Safe Parsing

```typescript
import { attempt } from "@deessejs/core";

const result = attempt(() => JSON.parse(jsonString))
  .mapErr(error => ({
    type: "INVALID_JSON",
    message: error.message
  }));
```

### 2. Parse and Validate

```typescript
attempt(() => JSON.parse(jsonString))
  .flatMap(data => validateSchema(data));
```

### 3. Parse with Defaults

```typescript
attempt(() => JSON.parse(jsonString))
  .map(parsed => ({
    ...defaultConfig,
    ...parsed
  }))
  .getOrElse(defaultConfig);
```

## When to Use

✅ **Use when:**
- Parsing JSON from external sources
- Reading configuration files
- Handling API responses
- Processing user input

❌ **Don't use when:**
- Data source is trusted and validated
- Performance is critical (use native JSON.parse directly)

## Related Examples

- [Environment Configuration](../config/) - Config file parsing
- [HTTP API Error Handling](../http-api/) - API response handling
