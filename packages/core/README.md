<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/icon.png">
    <source media="(prefers-color-scheme: light)" srcset="public/icon.png">
    <img src="public/icon.png" alt="@deessejs/core" width="150" height="150" style="border-radius: 50%;">
  </picture>
</p>

<h1 align="center">@deessejs/core</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@deessejs/core">
    <img src="https://img.shields.io/npm/v/@deessejs/core" alt="npm Version">
  </a>
  <a href="https://www.npmjs.com/package/@deessejs/core">
    <img src="https://img.shields.io/bundlejs/size/@deessejs/core" alt="Bundle Size">
  </a>
  <a href="https://github.com/nesalia-inc/core/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/nesalia-inc/core/ci?label=tests" alt="Tests">
  </a>
  <a href="https://github.com/nesalia-inc/core/actions">
    <img src="https://img.shields.io/badge/coverage-100%25-brightgreen" alt="Coverage">
  </a>
  <a href="https://github.com/nesalia-inc/core/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/nesalia-inc/core" alt="License">
  </a>
</p>

> Functional programming patterns for TypeScript.

## Requirements

- TypeScript 5.0+

## Installation

```bash
# Install core
npm install @deessejs/core

# Or using pnpm
pnpm add @deessejs/core

# Or using yarn
yarn add @deessejs/core
```

## Usage

```typescript
import { success, cause, exception, isSuccess, isCause, isException, Outcome } from '@deessejs/core'

// Success - Normal Operation Result
const ok = success({ id: 1, name: 'John' })
if (isSuccess(ok)) {
  console.log(ok.value.name) // TypeScript knows this is User
}

// Cause - Domain Errors (Business Logic)
const notFound = cause({
  name: 'NOT_FOUND',
  message: 'User not found',
  data: { id: 123 }
})
if (isCause(notFound)) {
  console.log(notFound.name) // "NOT_FOUND"
  console.log(notFound.data.id) // 123
}

// Exception - System Errors
const crash = exception({
  name: 'DATABASE_ERROR',
  message: 'Connection failed'
})
if (isException(crash)) {
  console.log(crash.name) // "DATABASE_ERROR"
  console.log(crash.stack) // Error stack trace
}

// Outcome - Union Type
function getUser(id: number): Outcome<User> {
  const user = findUser(id)
  if (!user) {
    return cause({ name: 'NOT_FOUND', message: 'User not found', data: { id } })
  }
  return success(user)
}

const result = getUser(123)
if (isSuccess(result)) {
  console.log(result.value.name)
} else if (isCause(result)) {
  console.log(result.name) // "NOT_FOUND"
} else if (isException(result)) {
  console.log(result.stack)
}
```

## Features

- **Unit Type** - Singleton representing "no meaningful value"
- **Success Type** - Successful operation result with value
- **Cause Type** - Domain errors (business logic failures)
- **Exception Type** - System errors (unexpected failures)
- **Outcome Type** - Union of Success, Cause, and Exception
- **Type Guards** - isSuccess, isCause, isException for narrowing
- **Fully Typed** - Comprehensive TypeScript support
- **Zero Dependencies** - Pure TypeScript, no external deps
- **100% Test Coverage** - Thoroughly tested

## API Reference

### Types

| Type | Description |
|------|-------------|
| `Unit` | Singleton type representing "no meaningful value" |
| `Success<T>` | Successful operation result with value |
| `Cause<T>` | Domain error with name, message, and data |
| `Exception<T>` | System error with name, message, data, and stack |
| `Outcome<T, C, E>` | Union of Success, Cause, and Exception |

### Functions

| Function | Description |
|----------|-------------|
| `unit` | The singleton Unit value |
| `success<T>(value)` | Create a Success |
| `cause<T>(options)` | Create a Cause (domain error) |
| `exception<T>(options)` | Create an Exception (system error) |
| `successUnit()` | Create Success with Unit value |
| `causeUnit(options)` | Create Cause with Unit data |
| `exceptionUnit(options)` | Create Exception with Unit data |
| `exceptionWithStack(options)` | Create Exception with auto-generated stack |

### Type Guards

| Guard | Description |
|-------|-------------|
| `isUnit(value)` | Check if value is Unit |
| `isSuccess(result)` | Check if result is Success (narrows type) |
| `isCause(value)` | Check if value is Cause (narrows type) |
| `isException(value)` | Check if value is Exception (narrows type) |

## TypeScript Signature Examples

```typescript
// Success
success<T>(value: T): Success<T>

// Cause with typed data
cause<T>(options: { name: string; message: string; data: T }): Cause<T>

// Exception with typed data
exception<T>(options: { name: string; message: string; data?: T; stack?: string }): Exception<T>

// Outcome with generics
type Outcome<T, C = Cause<unknown>, E = Exception<Unit>> = Success<T> | Cause<C> | Exception<E>
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
