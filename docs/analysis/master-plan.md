# @deessejs/fp Master Growth Plan

**Version:** 1.0
**Date:** April 2026
**Status:** Ready for Implementation

---

## Executive Summary

@deessejs/fp has a **clear market window**. fp-ts is merging with Effect-TS creating uncertainty. neverthrow has unresolved maintenance concerns and React 19 incompatibility. ts-results is too basic. This creates an opening for "the well-maintained neverthrow alternative" -- a library with a simple API, modern TypeScript, and active development.

**The One Message:**
> "Your TypeScript types lie when you use exceptions. @deessejs/fp makes errors explicit in your types -- without the complexity of fp-ts."

**Target:** 500K weekly npm downloads within 12 months.

---

## Part 1: Internal Analysis -- What Makes @deessejs/fp Unique

### Technical Strengths

#### 1.1 API Design Patterns (vs competitors)

| Feature | @deessejs/fp | neverthrow | fp-ts | ts-results |
|---------|--------------|------------|-------|------------|
| Factory functions | `ok()`, `err()` standalone | `Result.ok()` static | `.right()`, `left()` | `Ok`, `Err` classes |
| Method chaining | Yes | Yes | Via pipe only | No |
| Dual API (fn + method) | Yes | Partial | No | No |
| Symmetric tap/tapErr | Yes | Partial | No | No |
| Unified match() interface | Yes | No | Via fold | No |

#### 1.2 TypeScript Type Safety

**Discriminated union Result type:**
```typescript
export type Ok<T, E extends Error = Error> = {
  readonly ok: true;
  readonly value: T;
  isOk(): true;
  isErr(): false;
};

export type Err<E extends Error = Error> = {
  readonly ok: false;
  readonly error: E;
  isOk(): false;
  isErr(): true;
};

export type Result<T, E extends Error = Error> = Ok<T, E> | Err<E>;
```

**Key innovation -- `never` type on Err.map():**
```typescript
map<U>(_fn: (value: never) => U): Err<E>;
```
This ensures compile-time errors if you try to transform an error as if it were a value.

**ExtractResultError utility type:**
```typescript
export type ExtractResultError<T> = T extends () => Result<unknown, infer E> ? E : never;
```

**Success<T> alias for infallible functions:**
```typescript
export type Success<T> = Result<T, never>;
```

#### 1.3 Zod Integration (Unique Among Competitors)

```typescript
const ValidationError = error({
  name: "ValidationError",
  schema: z.object({
    field: z.string(),
    value: z.union([z.string(), z.number()]),
  }),
  message: (args) => `"${args.field}" is invalid: ${args.value}`,
});
```

**Benefits:**
- Type safety at boundaries (external data validation)
- Distinguishable validation errors (`isValidationError` flag)
- Automatic sensitive field redaction (password, token, apikey)
- Rich error messages via Zod's detailed output

#### 1.4 AsyncResult Thenable Pattern

```typescript
export interface AsyncResult<T, E = Error> {
  [Symbol.toStringTag]: "AsyncResult";

  then<TResult1, TResult2>(
    onfulfilled?: (value) => TResult1,
    onrejected?: (reason) => TResult2
  ): Promise<TResult1 | TResult2>;
}
```

**Can be awaited directly:**
```typescript
const result = await fromPromise(fetchUser(id));
// No .toPromise() conversion needed
```

**Smart map() detects sync vs async:**
```typescript
map<U>(fn: (value: T) => U | Promise<U>) {
  const isAsync = fn.length > 0 || fn.constructor.name === "AsyncFunction";
  // ...
}
```

**First-class AbortSignal support:**
```typescript
fromPromise(fetch(url), { signal: abortController.signal })
  .withSignal(abortController.signal)
```

**allSettled -- returns all errors, never Err:**
```typescript
allSettled(...results): AsyncResult<[T[], E[]], E[]>
// Never returns Err -- allows processing ALL outcomes
```

#### 1.5 Production Utilities

| Utility | Description |
|---------|-------------|
| `addJitter` | Thundering herd prevention (full jitter or specific variance) |
| Exponential/linear/constant backoff | Configurable retry strategies |
| `yieldControl` | Event loop yielding (scheduler.yield, setImmediate, MessageChannel, setTimeout fallback) |
| `withTimeout` | Timeout with proper cleanup that rejects deferred promises |
| Unit type | `{ readonly [UNIT_BRAND]: true }` for void semantics |

#### 1.6 Code Quality Markers

- `Object.freeze()` on all returned objects
- Exhaustive switch statements with `never` type
- 100% test coverage
- Type-level testing with `@deessejs/type-testing`
- Zero runtime dependencies (Zod is optional peer dep)

---

## Part 2: Market Analysis

### NPM Landscape (Q1 2026)

| Package | Weekly Downloads | GitHub Stars | Last Major Commit |
|---------|-----------------|--------------|-------------------|
| fp-ts | 4,137,558 | 11,493 | Aug 2025 (uncertain future) |
| neverthrow | 1,467,767 | 7,400 | Feb 2026 (maintenance concerns) |
| ts-results | 168,535 | 1,392 | Basic features only |
| option-t | 103,891 | 355 | 11 years, low adoption |
| Effect | (bundled) | 13,800 | Merging with fp-ts |

### Critical Market Shift

**fp-ts is merging with Effect-TS.** A June 2024 GitHub discussion asked "Is this project dead?" indicating community concern. This creates significant market uncertainty for 4M+ weekly fp-ts users.

### Developer Pain Points by Competitor

#### neverthrow Pain Points
1. **Type inference failures** -- "Cannot preserve error types in nested function calls"
2. **ResultAsync.fromPromise fails with React 19** -- Unresolved since React 19 release
3. **Maintenance concerns** -- Users asking about stewardship, dead links in docs
4. **3-year-old `fromPromise` feature request** -- `errorFn` not optional despite community demand

#### fp-ts Pain Points
1. **ESM directory import failures** -- Multiple ongoing reports
2. **HKT complexity** -- "How HKT is actually working?" dominates discussions
3. **Type inference gaps** -- "Sequencing is incompatible with array.map"
4. **API inconsistencies** -- Between Either and TaskEither

### White Space Opportunity

The gap is clear: developers want **simple Result types** (like neverthrow) but with:
- Active maintenance
- Modern TypeScript inference
- ESM-first compatibility
- React 19 support
- Clean documentation

**Positioning:** "The well-maintained neverthrow alternative"

---

## Part 3: Competitive Positioning

### Positioning Matrix

| Against | Message |
|---------|---------|
| fp-ts | "You don't need HKT to get type-safe errors" |
| neverthrow | "Same simple API, actively maintained" |
| ts-results | "More features, same simplicity" |
| Effect | "Lightweight when you don't need the full ecosystem" |
| Zod | "Complementary -- Zod validates data, @deessejs/fp propagates errors" |

### Comparison Table

| Concern | neverthrow | fp-ts | @deessejs/fp |
|---------|-----------|-------|--------------|
| Last significant commit | Feb 14, 2026 | Aug 2025 (uncertain) | Actively maintained |
| React 19 support | Broken | Works | Works |
| `fromPromise` errorFn | Not optional | N/A | Optional |
| Type inference | Occasional failures | Complex HKT | Consistent |
| Bundle size (gzipped) | ~5KB | ~50KB | ~2KB |
| ESM compatibility | Works | Ongoing issues | ESM-first |
| Issue response time | Variable | Slow | < 48 hours |
| Zod integration | No | No | Yes (optional) |
| AsyncResult.allSettled | No | Via TaskEither | Yes |

---

## Part 4: Growth Execution Roadmap

### 30-60-90 Day Plan

#### Weeks 1-4: Quick Wins

**Week 1 -- npm SEO Fixes:**
- [ ] Fix `" Either"` keyword typo (leading space)
- [ ] Add 15 new keywords: `fp-ts-alternative`, `neverthrow-alternative`, `typescript-error-handling`, `typed-errors`, `result-type`, `error-handling-typescript`, `exception-handling`, `type-safe-errors`, `typescript-fp`, `either`
- [ ] Update description to: "TypeScript error handling that actually works. Result, Maybe, Try, and AsyncResult monads with perfect type inference, zero runtime deps, and React 19 support."
- [ ] Fix homepage URL mismatch (fp.nesalia.com vs core.deessejs.com)
- [ ] Update GitHub Actions badge URL

**Week 2 -- Migration Content:**
- [ ] Create: "Migrating from neverthrow to @deessejs/fp" page
- [ ] Create: "Migrating from fp-ts to @deessejs/fp" page
- [ ] Add comparison table to docs homepage
- [ ] Fix bundle size badge to link to actual bundlejs.com
- [ ] Answer 3 "TypeScript error handling recommendation" threads on Reddit/StackOverflow

**Week 3 -- First Blog Post + Conference Proposals:**
- [ ] Write: "TypeScript's Error Handling Is Broken. Here's the Fix" (Dev.to)
- [ ] Submit talk to TypeScript Congress
- [ ] Submit talk to TS Conf
- [ ] Reach out to 3 TypeScript meetups about speaking

**Week 4 -- Community Seeding:**
- [ ] Write: "Result Types vs Exceptions: A Practical Comparison"
- [ ] Cold outreach to 5 neverthrow GitHub issue authors
- [ ] Post "Ask HN: What's your TypeScript error handling strategy?"
- [ ] Add live code playground to docs homepage

#### Month 2: Building Momentum

**Weeks 5-6:**
- [ ] Write: "Why Your Error Handling Library Will Break in React 19"
- [ ] Outreach to React-focused content creators
- [ ] Create "AsyncResult vs Promise" docs page
- [ ] Submit @deessejs/fp to TypeScript-Community list
- [ ] File integration issues with Express, tRPC

**Weeks 7-8:**
- [ ] Write: "The Minimalist's Guide to TypeScript Functional Programming"
- [ ] Reach out to 3-5 tech bloggers (Axolo, falsifiable.dev)
- [ ] Create "TypeScript Error Handling: A Practical Guide" page
- [ ] Add repo topics: fp-ts-alternative, neverthrow-alternative, error-handling

#### Month 3: Bigger Plays

**Weeks 9-10:**
- [ ] Write: "Building a Type-Safe API with @deessejs/fp"
- [ ] Launch YouTube demo or GIF animation
- [ ] Approach 2 library maintainers with integration proposal
- [ ] Submit to JavaScript Weekly or TypeScript Weekly

**Weeks 11-12:**
- [ ] Analyze download data, adjust strategy
- [ ] Create benchmark comparison page
- [ ] Set up bi-weekly blog content calendar

---

## Part 5: Technical SEO Strategy

### Documentation Pages to Create

1. `/docs/comparison/fp-ts-alternative` -- Honest comparison, lead with HKT complexity
2. `/docs/comparison/neverthrow-alternative` -- Direct comparison on maintenance, React 19
3. `/docs/guides/typescript-error-handling` -- Comprehensive guide, target "typescript try catch alternative"
4. `/docs/migration/neverthrow` -- Step-by-step migration, map every API
5. `/docs/migration/fp-ts` -- "When you need Result without HKT"
6. `/docs/guides/async-error-handling` -- AsyncResult vs Promise comparison
7. `/docs/tutorials/api-routes` -- Express/Fastify/Next.js tutorial

### Blog Post Series: "TypeScript Error Handling That Doesn't Suck"

1. **"TypeScript's Error Handling Is Broken. Here's the Fix"** -- Lead with problem, before/after code
2. **"Result Types vs Exceptions: A Practical Comparison"** -- Real-world scenarios (API calls, DB queries)
3. **"Why Your Error Handling Library Will Break in React 19"** -- neverthrow incompatibility angle
4. **"The Minimalist's Guide to TypeScript FP"** -- No HKT needed
5. **"Building a Type-Safe API with @deessejs/fp"** -- End-to-end Express/Fastify tutorial

### GitHub Repo Checklist

- [ ] README header graphic
- [ ] Pinned "Why @deessejs/fp?" discussion
- [ ] Bug report template with TypeScript version, reproduction steps
- [ ] PR template with tests/types/docs checklist
- [ ] CONTRIBUTING.md with explicit guidelines
- [ ] Repo topics: `typescript`, `fp-ts-alternative`, `error-handling`, `result-type`

---

## Part 6: Cold Outreach Templates

### Template 1: Library Integration Proposal

```
Subject: Proposal: Native Result type support for [FRAMEWORK]

Hi [NAME],

I've been building @deessejs/fp -- a TypeScript error handling library
that's hit 3.0.0 with [X] weekly downloads.

I noticed [FRAMEWORK] currently uses throw/catch for error handling in
[SPECIFIC AREA]. This creates a gap: users lose type safety when errors
propagate across boundaries.

I'd like to propose adding @deessejs/fp as an optional dependency for
typed errors. Here's a concrete example:

  // Current
  function getUser(id: string): Promise<User> {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError(`User ${id} not found`);
    return user;
  }

  // With @deessejs/fp
  function getUser(id: string): AsyncResult<User, NotFoundError> {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return err({ name: 'NOT_FOUND', message: `User ${id} not found` });
    return ok(user);
  }

Benefits:
- Compile-time error checking -- no more unexpected exceptions
- Zero runtime deps (only Zod for optional validation)
- ESM-first, React 19 compatible
- Actively maintained -- 48hr response time on issues

Would you be open to a quick call or GitHub discussion?
```

**Targets:** Express, Fastify, Prisma, Drizzle, tRPC, NestJS maintainers

### Template 2: Content Collaboration Pitch

```
Subject: Story angle: TypeScript error handling that doesn't betray you

Hi [NAME],

I maintain @deessejs/fp -- a TypeScript error handling library that
just hit 3.0.0.

I think there's a story your audience would care about:

The angle: fp-ts is merging with Effect-TS. neverthrow has maintenance
concerns. TypeScript developers are looking for a clean, maintained
alternative.

Why now: The fp-ts/Effect merger creates uncertainty. Developers who
built on fp-ts are asking "what's next?"

What I'm offering:
- Technical deep dive on TypeScript error handling patterns
- Comparison video/post against neverthrow and fp-ts
- Original benchmarks on type inference
- Exclusive pre-release access to new features
- Genuine story about a library built by devs who got tired of
  uncaught exceptions

What I want: Honest review that shows real code. Freedom to correct
factual errors before publish. Credit with link to docs.

I can send a press kit with benchmarks, comparison code, and logo
assets if interested.
```

**Targets:** Jack Leg, Theo Browne, Web Dev Simplified, Axolo, falsifiable.dev

### Template 3: Discord Community Engagement

**Opening (genuine question):**
```
Hey everyone. Genuine question: how do you all handle errors that need
to propagate through multiple layers of async code?

I've been using try/catch but I'm hitting a wall where TypeScript
doesn't know what can throw. Looking for a type-safe approach that
doesn't require fp-ts-level complexity.

Has anyone tried Result-based error handling? Curious about real-world
experiences vs the academic treatment.
```

**If someone mentions neverthrow:**
```
yeah neverthrow is solid. I've been maintaining @deessejs/fp as an
alternative -- similar API but focused specifically on the error
handling case without trying to be a full FP framework. Happy to
answer questions if anyone wants to compare.
```

**Key rule:** Never drop links without context. Respond to something someone said. Never spam #showcase.

---

## Part 7: Community-Led Growth

### Reddit Strategy

| Subreddit | Strategy | Content |
|-----------|----------|---------|
| r/typescript | Long-form, genuine questions | "How do you handle multi-layer async errors?" |
| r/node | Backend-focused | "TypeScript backend error handling in 2026" |
| r/reactjs | React 19 angle | "React 19 server components broke my error handling" |
| r/ProgrammingLanguages | FP-curious | "Why Result types beat exceptions" |
| r/webdev | Broader audience | "The simplest TypeScript error handling library" |

**Rule:** Never spam links. Lead with value. Write posts that teach.

### Hacker News Strategy

**Content to post:**
- "How I built a type-safe API layer without fp-ts" (technical deep dive)
- "The TypeScript error handling landscape in 2026" (market analysis)
- "Why Result types should be in the standard library" (opinion with code)

**Ask HN format:**
- "Ask HN: What's your TypeScript error handling strategy?"
- Genuinely curious. Respond to every comment. Goal is discussion, not promotion.

**Timing:** Weekdays 6-8 AM Pacific (14:00-16:00 UTC). Avoid weekends.

### Conference Targets (Priority Order)

1. **TypeScript Congress** (Europe, annual) -- Submit: "Type-Safe Error Handling Without the PhD"
2. **TS Conf** (US, annual) -- Same talk
3. **NodeConf EU** -- Backend-focused
4. **React Summit** -- React 19 compatibility angle
5. **Local TypeScript meetups** (TypeScript NYC, TypeScript London, TypeScript Berlin) -- Lower barrier, 20-min talk

**Talk abstract:**
```
Title: Type-Safe Error Handling Without the PhD

TypeScript promises type safety, but error handling breaks that promise.
Exceptions can crash your app. Types don't reflect failure states.
try/catch chains become unreadable.

This talk shows how Result types solve these problems -- without requiring
HKT, type classes, or a background in functional programming.

We'll cover:
- Why exceptions betray your types
- The Result pattern in practice (live coded)
- How @deessejs/fp achieves better type inference than neverthrow
- Why React 19 server components break traditional error handling
- Real-world migration path from try/catch to typed errors
```

---

## Part 8: Success Metrics

### npm Download Targets

| Period | Target | Driver |
|--------|--------|--------|
| Week 4 | 10,000/week | SEO fixes, Reddit presence |
| Week 12 | 50,000/week | Blog series, migration guides |
| Month 6 | 150,000/week | Conference talks, integrations |
| Month 12 | 500,000/week | Ecosystem adoption, testimonials |

**Key metric:** 20% month-over-month growth minimum.

### GitHub Star Velocity

| Period | Stars | Velocity Source |
|--------|-------|----------------|
| Week 4 | +200 | Reddit, HN, blog mentions |
| Week 12 | +1,000 | Blog series, conference talks |
| Month 6 | +3,000 | Ecosystem integrations |
| Month 12 | +10,000 | Mass adoption |

**Note:** Stars are a lagging indicator. Focus on downloads and community engagement.

### Community Engagement Targets

| Metric | Week 4 | Week 12 |
|--------|--------|---------|
| GitHub issues closed | 5 | 20 |
| GitHub discussions | 3 | 15 |
| npm downloads | 10K/week | 50K/week |
| Docs page views | 1K/week | 5K/week |

### Tracking Spreadsheet

```
| Week | npm downloads | GitHub stars | Docs views | Blog views | Key actions |
|------|--------------|--------------|------------|------------|-------------|
| 1    | X            | X            | X          | X          | [actions]   |
| 2    | X            | X            | X          | X          | [actions]   |
```

Review weekly. Adjust based on what is working.

---

## Appendix: Immediate Action Items (Week 1)

1. **Fix package.json keywords** -- Remove `" Either"` typo, add 15 new keywords
2. **Update description** -- Problem-first, specific differentiators
3. **Fix homepage URL** -- Verify fp.nesalia.com vs core.deessejs.com
4. **Update GitHub Actions badge** -- Verify correct repo URL
5. **Pin "Why @deessejs/fp?" discussion** -- On GitHub repo
6. **Create migration guide (neverthrow)** -- High-priority conversion page
7. **Create migration guide (fp-ts)** -- High-priority conversion page

---

## Appendix: Key Resources

- **Documentation:** https://core.deessejs.com
- **GitHub:** https://github.com/nesalia-inc/fp
- **npm:** https://www.npmjs.com/package/@deessejs/fp

### Competitor Data

| Package | Downloads | Stars | Key Issue |
|---------|-----------|-------|-----------|
| fp-ts | 4.1M/week | 11,493 | Merging with Effect, ESM issues |
| neverthrow | 1.5M/week | 7,400 | Maintenance concerns, React 19 broken |
| ts-results | 168K/week | 1,392 | Too basic |
| option-t | 104K/week | 355 | Low adoption |

---

*Plan version 1.0. Next review: May 2026.*
