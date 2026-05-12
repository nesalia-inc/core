---
title: Homepage First Version
description: Initial design and structure for the @deessejs/fp homepage
createdAt: 2026-05-11
---

## Hero Section

**Tagline:** The framework-agnostic TypeScript library designed to help developers handle errors with confidence — and resilience — everywhere.

**Secondary tagline:** Functional programming for pragmatists. No Category Theory degree required.

## Installation Component

A single component with two tabs:

**Tab 1 (npm):** `npm install @deessejs/fp`
**Tab 2 (agents):** `npx skills add deessejs/fp`

Design notes:
- Component is prominent, above the fold
- Active tab should be visually distinct (follow DESIGN.md accent styling)
- Copy button changes to checkmark icon on click (visual feedback)
- Commands in monospace font (Geist Mono)
- Subtle link below: "Or `git clone` the starter template"
- No box shadows, sharp borders, minimal rounded corners

## Feature Examples (Before/After)

Tabs with comparative code examples:

**Result tab:** try/catch → ok/err
**Maybe tab:** null checks → fromNullable
**AsyncResult tab:** nested .then() → fluent chaining
**Retry tab:** manual retry loop → retry policy
**Serialization tab:** manual JSON → serializeResult

## Feature Cards

Bento grid layout with grouped benefits:

### Core (error handling)

**Card 1: Never try & catch again**
Errors become typed values you can map, flatMap, and chain — without breaking your flow.

**Card 2: Async errors without the boilerplate**
Fluent chaining for Promises. Same API as sync code. No more nested try/catch pyramids.

**Card 5: One API everywhere**
Same functions work with both sync and async. map, flatMap, tap, getOrElse — one API to learn, not two.

### Reliability

**Card 4: Errors that tell a story**
Structured domain errors with context, cause chains, and Zod validation. Errors that actually help debugging.

**Card 8: Production-ready by default**
debounce, throttle, memoize, timeouts. The utilities you need to ship resilient applications.

### DX

**Card 3: Make absence explicit**
Optional values as types. No more null checks — absence is visible in the type system from the start.

**Card 6: Retry without the mess**
Exponential backoff, jitter, predicates. Handle transient failures elegantly without custom logic.

**Card 7: Composable by design**
pipe, flow, tap — build readable transformation pipelines that feel like reading English.

## FAQ

**How does @deessejs/fp differ from fp-ts or neverthrow?**
Unlike fp-ts, there is no steep learning curve. Unlike neverthrow, sync and async paths are unified — eliminating "function color" fatigue. Results execute directly with no .unwrap() calls.

**Is @deessejs/fp a replacement for try/catch?**
Yes. Replace try/catch with ok/err — no more silent exceptions. Errors become explicit domain values you can map, flatMap, and handle elegantly.

**Does it work with React/Next.js?**
Yes. Framework-agnostic — works anywhere TypeScript runs. Perfect for API routes, server components, and client-side error boundaries.

**What is the bundle size?**
~2KB gzipped. Zero runtime dependencies.

**How do I handle async errors?**
Use AsyncResult with the same API as Result: map, flatMap, tap, getOrElse all work identically for sync and async operations.

**What's the performance overhead?**
Minimal. @deessejs/fp is optimized for tree-shaking and has zero runtime dependencies. The overhead is negligible compared to the safety guarantees.

## CTA

**Headline:** Ready to handle errors with confidence?

**Subtext:** Join developers who write resilient TypeScript without the complexity.

**Social proof:** Trusted by developers at [logos] — used in 500+ production projects.

**Primary button:** npm install @deessejs/fp
**Secondary button:** Read the docs
