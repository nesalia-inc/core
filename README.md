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

## Quick Start

```typescript
import { success, cause, exception, isSuccess, isCause, isException, Outcome } from '@deessejs/core'

// Success - Normal Operation Result
const ok = success({ id: 1, name: 'John' })

if (isSuccess(ok)) {
  console.log(ok.value.name)
}

// Cause - Domain Errors
const notFound = cause({
  name: 'NOT_FOUND',
  message: 'User not found',
  data: { id: 123 }
})

// Exception - System Errors
const crash = exception({
  name: 'DATABASE_ERROR',
  message: 'Connection failed'
})
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
