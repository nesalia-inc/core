<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/icon.jpg">
    <source media="(prefers-color-scheme: light)" srcset="public/icon.jpg">
    <img src="public/icon.png" alt="Nesalia Logo" width="100%">
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

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| `@deessejs/core` | Functional programming patterns | [![](https://img.shields.io/npm/v/@deessejs/core)](https://www.npmjs.com/package/@deessejs/core) |

## Requirements

- TypeScript 5.0+
- Node.js 20+

## Installation

```bash
# Install core
npm install @deessejs/core

# Or using pnpm
pnpm add @deessejs/core

# Or using yarn
yarn add @deessejs/core
```

## Documentation

For full documentation, visit [core.deessejs.com](https://core.deessejs.com).

## Quick Start

```typescript
import { ok, err, isOk, isErr, Result } from '@deessejs/core'

// Ok - Normal Operation Result
const ok = ok({ id: 1, name: 'John' })

if (isOk(ok)) {
  console.log(ok.value.name)
}

// Err - Domain Errors
const notFound = err({
  name: 'NOT_FOUND',
  message: 'User not found',
  data: { id: 123 }
})
```

## Maybe Type

The `Maybe` type represents optional values - a value that may or may not be present. It's a safer alternative to `null`/`undefined`.

### Types

| Type | Description |
|------|-------------|
| `Maybe<T>` | Union of `Some<T>` or `None` |
| `Some<T>` | A present value (`{ ok: true, value: T }`) |
| `None` | An absent value (`{ ok: false }`) |

### Functions

```typescript
import {
  some, none,
  fromNullable, isSome, isNone,
  map, flatMap, getOrElse, getOrCompute,
  tap, match, toNullable, toUndefined
} from '@deessejs/core'

// Creation
const present = some(42)           // Some<number>
const absent = none()              // None

// From nullable
const value1 = fromNullable(42)    // Some<number>
const value2 = fromNullable(null)  // None
const value3 = fromNullable(0)     // Some<number> (0 is a valid value)

// Type guards
isSome(present)   // true
isNone(absent)    // true

// Transform
map(present, x => x * 2)           // Some<84>
flatMap(present, x => some(x * 2)) // Some<84>
flatMap(absent, x => some(x * 2))  // None

// Extract
getOrElse(present, 0)              // 42
getOrElse(absent, 0)               // 0

// Side effects
tap(present, console.log)           // logs 42, returns Some<42>
match(present, v => v * 2, () => 0) // 84
match(absent, v => v * 2, () => 0)  // 0

// Convert back
toNullable(present)  // 42
toNullable(absent)  // null
toUndefined(present) // 42
toUndefined(absent)  // undefined
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint
pnpm lint

# Type check
pnpm typecheck
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

- **Nesalia Inc.**

## Security

If you discover any security vulnerabilities, please send an e-mail to security@nesalia.com.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
