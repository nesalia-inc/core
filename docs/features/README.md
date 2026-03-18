# Features

Comprehensive documentation for all @deessejs/core features.

## Core Types

| Feature | Description |
|---------|-------------|
| [Result](./result.md) | Explicit error handling - success or failure with typed errors |
| [Maybe](./maybe.md) | Optional values - presence or absence without null/undefined |
| [Try](./try.md) | Wrap synchronous functions that might throw |
| [AsyncResult](./async-result.md) | Async operations with proper error handling |

## Utilities

| Feature | Description |
|---------|-------------|
| [Retry](./retry.md) | Resilience patterns - retry with exponential backoff |
| [Sleep](./sleep.md) | Delays and timeouts for async operations |

## Quick Decision Guide

**What type should I use?**

| Scenario | Use |
|----------|-----|
| Operation can fail with a specific error | **Result** |
| Value might be null/undefined | **Maybe** |
| Function might throw an exception | **Try** |
| Async operation that can fail | **AsyncResult** |
| Need to retry on failure | **Retry** |
| Need to wait or timeout | **Sleep** |

## Installation

```bash
npm install @deessejs/core
```

## Usage

```typescript
import { ok, err, some, none, attempt, fromPromise } from '@deessejs/core';
```
