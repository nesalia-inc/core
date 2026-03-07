# File System Operations

This example demonstrates file system operations with `Try` and `AsyncResult`.

## What You'll Learn

- **Try/attempt**: Safe synchronous file operations
- **AsyncResult**: Async file operations
- **Error categorization**: NOT_FOUND, PERMISSION, etc.
- **Directory traversal**: Recursive file operations

## Running the Example

```bash
tsx examples/file-system/index.ts
```

## Key Patterns

### 1. Safe File Reading

```typescript
import { attempt } from "@deessejs/core";

const result = attempt(() =>
  require("fs").readFileSync(path, "utf-8")
).mapErr(error => ({
  type: error.code === "ENOENT" ? "NOT_FOUND" : "UNKNOWN",
  path,
  message: error.message
}));
```

### 2. Async File Operations

```typescript
const result = await fromPromise(
  fs.readFile(path, "utf-8")
).mapErr(error => ({
  type: "NOT_FOUND",
  path,
  message: error.message
}));
```

### 3. Read and Parse Config

```typescript
fromPromise(fs.readFile(path, "utf-8"))
  .flatMap(content => attempt(() => JSON.parse(content)))
  .flatMap(config => validateSchema(config));
```

## When to Use

✅ **Use when:**
- Reading config files
- Processing user uploads
- Need safe error handling
- Want specific error types

## Related Examples

- [Safe JSON Parsing](../json-parsing/) - Config file parsing
- [Environment Configuration](../config/) - Config management
