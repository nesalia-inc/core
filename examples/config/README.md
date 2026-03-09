# Environment Configuration

This example demonstrates type-safe environment configuration using `Maybe` and `Result`.

## What You'll Learn

- **Maybe**: Handling optional environment variables
- **Result**: Validating required configuration
- **Defaults**: Providing fallback values for missing config
- **Composition**: Building complex configuration objects

## Running the Example

```bash
# Set some environment variables for testing
export PORT=8080
export DEBUG=true
export NODE_ENV=production

tsx examples/config/index.ts
```

## Key Patterns

### 1. Optional Variables with Maybe

```typescript
function getEnvVar(key: string) {
  return fromNullable(process.env[key]);
}

const apiKey = getEnvVar("API_KEY");
// apiKey: Maybe<string>

const port = getEnvVarInt("PORT").getOrElse(3000);
```

### 2. Required Variables with Result

```typescript
const dbHost = getEnvVar("DB_HOST").toResult(
  new Error("DB_HOST is required")
);

if (dbHost.isOk()) {
  console.log("Host:", dbHost.value);
}
```

### 3. Chaining Configuration

```typescript
const dbConfig = getEnvVar("DB_HOST")
  .flatMap((host) =>
    getEnvVarInt("DB_PORT").map((port) => ({ host, port }))
  )
  .flatMap((config) =>
    getEnvVar("DB_USER").map((user) => ({ ...config, user }))
  );
```

### 4. Type-Safe Parsing

```typescript
function getEnvVarInt(key: string) {
  return fromNullable(process.env[key])
    .flatMap((value) => {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? none() : some(parsed);
    });
}
```

## When to Use

✅ **Use Maybe when:**
- Configuration is optional
- Sensible defaults exist
- Feature flags or toggles

✅ **Use Result when:**
- Configuration is required
- Application cannot start without it
- Validation errors should be reported

## Related Examples

- [Form Validation](../form-validation/) - Similar patterns for user input
- [CLI Argument Parsing](../cli-args/) - For command-line configuration
