# Documentation Rewrite Plan for @deessejs/fp v4.0.0

## Objective

Completely rewrite the documentation in `apps/web/content/docs/` to reflect the new v4.0.0 API, aligning with the DEP system (DEP-0001 through DEP-0010).

## Current State

- **17 files** organized in 3 sections: Getting Started, Reference, Advanced
- Does not reflect v4.0.0 features (Result.gen, panic, matchError, etc.)
- Key features from DEPs are missing or scattered (Retry, Sleep, Timeout, Repeat, Serialization)

## Target Structure

```
docs/
├── meta.json
│
├── introduction.mdx          # Why @deessejs/fp, problem with try/catch
├── installation.mdx         # Install, requirements, TypeScript config
├── quick-start.mdx          # 5-minute getting started guide
│
├── core/
│   ├── result.mdx           # Result<T, E>, ok/err, map/flatMap, Result.gen
│   ├── error.mdx            # error(), TaggedError, enrichment, matchError, Panic
│   ├── maybe.mdx            # Maybe<T>, Some/None, fromNullable
│   ├── try.mdx             # Result.attempt(), Result.attemptAsync()
│   └── composition.mdx     # pipe(), flow(), tap/tapErr/tapBoth, dual()
│
├── async/
│   ├── retry.mdx           # retryPolicy, retry/retryAsync, backoff, jitter
│   ├── sleep.mdx            # sleep(), sleepUntil(), sleepRandom()
│   ├── timeout.mdx          # Result.timeout(), deadline, onTimeout
│   └── repeat.mdx           # Result.repeat(), repeatUntil()
│
├── serialization.mdx        # Result.serialize/deserialize, Error.reviver
└── conversions.mdx          # toResult, toMaybe, resultFromNullable
```

**Total: 13 files**

## Section Breakdown

### Root Level (4 files)

| File | Purpose | DEP Reference |
|------|---------|---------------|
| `introduction.mdx` | Why @deessejs/fp, comparison with try/catch, core principles | — |
| `installation.mdx` | Installation commands, requirements, TypeScript config | — |
| `quick-start.mdx` | First 5 minutes with the library, basic examples | DEP 0001-0005 |

### Core Types (5 files)

| File | Purpose | DEP Reference |
|------|---------|---------------|
| `core/result.mdx` | Result type, ok/err factories, map/flatMap/tap, Result.gen generator composition, pattern matching | **DEP-0001** |
| `core/error.mdx` | error() builder, TaggedError, notes/cause enrichment, matchError, Panic type, sensitive data redaction | **DEP-0002** |
| `core/maybe.mdx` | Maybe type, Some/None, fromNullable, map/flatMap/filter, getOrElse | **DEP-0003** |
| `core/try.mdx` | Result.attempt(), Result.attemptAsync(), catch transform | **DEP-0004** |
| `core/composition.mdx` | pipe(), flow(), tap/tapErr/tapBoth, dual() pattern for data-first/data-last | **DEP-0005** |

### Async Patterns (4 files)

| File | Purpose | DEP Reference |
|------|---------|---------------|
| `async/retry.mdx` | retryPolicy builder, retry/retryAsync, exponential/linear backoff, jitter, shouldRetry | **DEP-0006** |
| `async/sleep.mdx` | sleep(), sleepUntil(), sleepRandom(), AbortController integration | **DEP-0007** |
| `async/timeout.mdx` | Result.timeout(), deadline option, onTimeout fallback, AbortError | **DEP-0009** |
| `async/repeat.mdx` | Result.repeat(), repeatUntil(), RepeatedUntilError, batch/polling | **DEP-0010** |

### Data Handling (2 files)

| File | Purpose | DEP Reference |
|------|---------|---------------|
| `serialization.mdx` | Result.serialize/deserialize, Maybe.serialize/deserialize, Error.reviver, prototype pollution protection | **DEP-0008** |
| `conversions.mdx` | toResult, toMaybe, resultFromNullable, resultFromThrowable | — |

## Files to Delete

- `comparison.mdx` — Replace with content in `introduction.mdx`
- `reference/` directory — Content moved to `core/` and `async/` directories
- `examples.mdx` — Content integrated into core type pages
- `skill.mdx` — Out of scope
- `why-not-build-your-own.mdx` — Out of scope
- `reference/unit.mdx` — Content merged into core pages
- `reference/yield.mdx` — Content is Result.gen, merged into `core/result.mdx`
- `reference/utilities.mdx` — Split into `core/composition.mdx` and `async/*.mdx`

## Files to Modify

- `meta.json` — Update to new structure

## Content Mapping from DEPs

| DEP | New Location |
|-----|--------------|
| DEP-0001 (Result) | `core/result.mdx` |
| DEP-0002 (Error) | `core/error.mdx` |
| DEP-0003 (Maybe) | `core/maybe.mdx` |
| DEP-0004 (Try) | `core/try.mdx` |
| DEP-0005 (Composition) | `core/composition.mdx` |
| DEP-0006 (Retry) | `async/retry.mdx` |
| DEP-0007 (Sleep) | `async/sleep.mdx` |
| DEP-0008 (Serialization) | `serialization.mdx` |
| DEP-0009 (Timeout) | `async/timeout.mdx` |
| DEP-0010 (Repeat) | `async/repeat.mdx` |

## Implementation Order

1. **Create `meta.json`** — Define new navigation structure
2. **Create `core/` directory** — Core type documentation
   - `result.mdx` (DEP-0001)
   - `error.mdx` (DEP-0002)
   - `maybe.mdx` (DEP-0003)
   - `try.mdx` (DEP-0004)
   - `composition.mdx` (DEP-0005)
3. **Create `async/` directory** — Async utilities
   - `retry.mdx` (DEP-0006)
   - `sleep.mdx` (DEP-0007)
   - `timeout.mdx` (DEP-0009)
   - `repeat.mdx` (DEP-0010)
4. **Create root-level docs**
   - `introduction.mdx`
   - `installation.mdx`
   - `quick-start.mdx`
5. **Create data handling docs**
   - `serialization.mdx` (DEP-0008)
   - `conversions.mdx`
6. **Delete old files** — Remove obsolete documentation

## Notes

- Use Fumadocs UI components (Callout, Cards, Card) for formatting
- Include code examples with imports from `@deessejs/fp`
- Cross-link related types (Result ↔ Error, Maybe ↔ Result)
- Maintain consistent "Why X?" → "The Problem" → "The Solution" structure
