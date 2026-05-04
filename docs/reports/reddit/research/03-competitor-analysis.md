# Research: Competitor Analysis — Positioning Against Other Libraries

**Note:** Star counts are approximate figures verified as of 2026-04-10. Sources include GitHub and npm registries.

## Lightweight Libraries

### neverthrow
- **Stars**: ~7.4k
- **Philosophy**: Result type with `match()`, `map()`, `mapErr()`
- **Common Praise**: Easy to learn, good TypeScript support
- **Common Complaints**:
  - "No built-in AsyncResult — have to roll your own"
  - "Chaining gets nested and hard to read"
  - "No integrated support for combining multiple Results"
- **Positioning for @deessejs/fp**: "More features than neverthrow, same simplicity"

### ts-results
- **Stars**: ~1k
- **Philosophy**: Rust-inspired `Result` type
- **Common Praise**: Lightweight, no dependencies
- **Common Complaints**:
  - "Less maintained than neverthrow"
  - "API differs from Rust's Result (inconsistency with expectations)"
  - "Missing some utility functions for common patterns"
- **Positioning for @deessejs/fp**: "Active maintenance, React 19 support"

### oxide.ts
- **Stars**: ~500
- **Philosophy**: Minimal Result type
- **Common Praise**: Very simple, tree-shakeable
- **Common Complaints**: Few features beyond basics
- **Positioning for @deessejs/fp**: "More utilities, same simplicity"

### resulty
- **Stars**: ~200
- **Philosophy**: Lightweight Result
- **Common Praise**: Simple API
- **Common Complaints**: Less community adoption
- **Positioning for @deessejs/fp**: "More features, same footprint"

---

## Heavyweight FP Libraries

### fp-ts
- **Status**: DEPRECATED — development has merged into Effect-TS
- **Stars**: ~6k
- **Philosophy**: Comprehensive functional programming
- **Common Praise**: Powerful abstractions, theoretic foundation
- **Common Complaints**:
  - "Steep learning curve — requires learning monads, functors, applicatives"
  - "Overkill for simple use cases"
  - "Documentation assumes FP knowledge — hard for teams without FP background"
  - "Type errors produce massive inferred types that are hard to read"
- **Positioning for @deessejs/fp**: "You don't need a PhD to get type-safe errors"

### Effect
- **Stars**: ~13.8k
- **Philosophy**: Fiber-based async, typed errors
- **Common Praise**: Modern, powerful, typed concurrency
- **Common Complaints**:
  - "Very heavy dependency, complex"
  - "Overwhelming for simple use cases"
  - "Steep learning curve"
- **Positioning for @deessejs/fp**: "The power you need without the complexity you don't"

---

## What Developers Actually Want

The most sought-after features in a Result library:
1. `andThen` for chaining operations that can fail
2. `retry` with backoff for async operations
3. `fromPromise` to wrap promises cleanly
4. Zero or minimal dependencies

### Feature Comparison Table

| Feature | @deessejs/fp | neverthrow | ts-results | fp-ts |
|---------|---------------|------------|------------|-------|
| Result type | Yes | Yes | Yes | Yes |
| Maybe type | Yes | No | No | Yes |
| Try type | Yes | No | No | No |
| AsyncResult | Yes | No | No | Via Task |
| Retry with backoff | Yes | No | No | No |
| Active maintenance | Yes | Medium | Low | Deprecated |

*Note: Bundle sizes vary by version and change over time; check npm for current figures.*

---

## Positioning Statements

### vs fp-ts
**Don't say**: "We're simpler than fp-ts"
**Say**: "fp-ts is deprecated — use @deessejs/fp for type-safe errors without the FP overhead"

### vs neverthrow
**Don't say**: "We have more features than neverthrow"
**Say**: "neverthrow is great, but we also have AsyncResult built-in"

### vs ts-results
**Don't say**: "We're more maintained than ts-results"
**Say**: "Looking for active maintenance and React 19 support?"

### vs Effect
**Don't say**: "We're simpler than Effect"
**Say**: "Need typed errors without fiber-based concurrency? @deessejs/fp is lighter"

### vs DIY
**Don't say**: "Don't roll your own"
**Say**: "Why write the same error handling code for every project?"

---

## Honest Trade-offs to Admit

When people push back, be honest about:

1. **"It's more boilerplate than try/catch"**
   → Yes, upfront cost is higher. But you get compile-time safety and explicit error handling.

2. **"I can just use try/catch for most cases"**
   → For simple cases, try/catch is fine. Result types shine when errors need to propagate through multiple layers.

3. **"Another dependency?"**
   → ~2KB gzipped, zero runtime deps. The type safety is worth it.

4. **"fp-ts does more"**
   → Yes, Effect is more powerful. But fp-ts is deprecated and merged into Effect-TS. Most projects don't need fiber-based concurrency. @deessejs/fp covers 90% of use cases with 10% of the complexity.

---

*Research source: Community discussions, GitHub stars (approximate as of 2026-04-10), library documentation*
*Last updated: 2026-04-10*
