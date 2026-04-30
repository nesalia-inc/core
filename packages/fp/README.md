<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/icon.png">
    <source media="(prefers-color-scheme: light)" srcset="public/icon.png">
    <img src="public/icon.png" alt="@deessejs/fp" width="150" height="150" style="border-radius: 50%;">
  </picture>
</p>

<h1 align="center">@deessejs/fp</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@deessejs/fp">
    <img src="https://img.shields.io/npm/v/@deessejs/fp" alt="npm Version">
  </a>
  <a href="https://www.npmjs.com/package/@deessejs/fp">
    <img src="https://img.shields.io/bundlejs/size/@deessejs/fp" alt="Bundle Size">
  </a>
  <a href="https://github.com/nesalia-inc/fp/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/nesalia-inc/fp/ci?label=tests" alt="Tests">
  </a>
  <a href="https://github.com/nesalia-inc/fp/actions">
    <img src="https://img.shields.io/badge/coverage-100%25-brightgreen" alt="Coverage">
  </a>
  <a href="https://github.com/nesalia-inc/fp/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/nesalia-inc/fp" alt="License">
  </a>
</p>

> Functional programming patterns for TypeScript.

## Requirements

- TypeScript 5.0+

## Installation

```bash
# Install core
npm install @deessejs/fp

# Or using pnpm
pnpm add @deessejs/fp

# Or using yarn
yarn add @deessejs/fp
```

## Usage

```typescript
import { ok, err, isOk, isErr, Result } from '@deessejs/fp'

// Ok - Normal Operation Result
const ok = ok({ id: 1, name: 'John' })
if (isOk(ok)) {
  console.log(ok.value.name) // TypeScript knows this is User
}

// Err - Domain Errors (Business Logic)
const notFound = err({
  name: 'NOT_FOUND',
  args: { id: 123 }
})
if (isErr(notFound)) {
  console.log(notFound.error.name) // "NOT_FOUND"
  console.log(notFound.error.args.id) // 123
}

// Result - Union Type
function getUser(id: number): Result<User> {
  const user = findUser(id)
  if (!user) {
    return err({ name: 'NOT_FOUND', args: { id } })
  }
  return ok(user)
}

const result = getUser(123)
if (isOk(result)) {
  console.log(result.value.name)
} else if (isErr(result)) {
  console.log(result.name) // "NOT_FOUND"
}
```

## Features

- **Result Type** - Successful operation result with value or error
- **Maybe Type** - Optional values (Some/None)
- **Try Type** - Exception handling wrapper
- **Type Guards** - isOk, isErr, isSome, isNone for narrowing
- **Fully Typed** - Comprehensive TypeScript support
- **Minimal Dependencies** - Only Zod for runtime validation, no other external deps
- **100% Test Coverage** - Thoroughly tested

## API Reference

### Types

| Type | Description |
|------|-------------|
| `Result<T, E>` | Successful operation result with value or error |
| `Maybe<T>` | Optional value (Some or None) |
| `Try<T>` | Exception handling wrapper |

### Functions

| Function | Description |
|----------|-------------|
| `ok<T>(value)` | Create an Ok result |
| `err<E>(options)` | Create an Err result |
| `some<T>(value)` | Create a Some |
| `none()` | Create a None |
| `try<T>(fn)` | Wrap a function in Try |
| `flattenMaybe(maybe)` | Flatten a nested Maybe |

### Type Guards

| Guard | Description |
|-------|-------------|
| `isOk(result)` | Check if result is Ok (narrows type) |
| `isErr(result)` | Check if result is Err (narrows type) |
| `isSome(maybe)` | Check if maybe is Some (narrows type) |
| `isNone(maybe)` | Check if maybe is None (narrows type) |

## TypeScript Signature Examples

```typescript
// Ok result
ok<T>(value: T): Ok<T>

// Err with typed args
err<E>(options: { name: string; args: E }): Err<Error<E>>

// Result type
type Result<T, E = Err<unknown>> = Ok<T> | Err<E>
```

## Why This Package?

These patterns are useful in any TypeScript project:

- Backend services
- CLI tools
- Workers
- Even frontend (with care)

Having them as a separate package means:

- Users can use FP patterns without the full API framework
- Smaller bundle size for simple projects
- The patterns are well-tested and reusable
- Can be used in any project, not just @deessejs ecosystem

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

- **Nesalia Inc.**

## Security

If you discover any security vulnerabilities, please send an e-mail to security@nesalia.com.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
