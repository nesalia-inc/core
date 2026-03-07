# CLI Argument Parsing

This example demonstrates type-safe CLI argument parsing using `Maybe` and `Result`.

## What You'll Learn

- **Maybe**: Optional flags and values
- **Result**: Required argument validation
- **Type conversion**: Parsing strings to numbers
- **Conflict detection**: Validating flag combinations

## Running the Example

```bash
# Basic usage
tsx examples/cli-args/index.ts --input in.txt --output out.txt

# With flags
tsx examples/cli-args/index.ts --input in.txt --output out.txt --verbose --threads 4

# Subcommands
tsx examples/cli-args/index.ts build --prod --verbose

# Show help
tsx examples/cli-args/index.ts --help
```

## Key Patterns

### 1. Optional Flags

```typescript
const verbose = args.includes("--verbose");
const config = parseOptionalValue(args, "--config").toUndefined();
```

### 2. Required Arguments

```typescript
const inputResult = parseRequiredArg(args, "--input");
if (inputResult.isErr()) {
  return err(inputResult.error);
}
```

### 3. Type Conversion

```typescript
const threadsResult = parseRequiredInt(args, "--threads");
```

### 4. Subcommands

```typescript
const command = args[0] as SubCommand;
if (!["build", "test", "deploy"].includes(command)) {
  return err({ arg: "command", message: "Unknown command" });
}
```

## When to Use

✅ **Use when:**
- Building CLI tools
- Need type-safe argument parsing
- Want clear error messages
- Complex flag interactions

## Related Examples

- [Environment Configuration](../config/) - Similar validation patterns
- [Form Validation](../form-validation/) - Input validation
