# @deessejs/fp Master Growth Plan

**Version:** 1.0
**Date:** April 2026
**Status:** Ready for Implementation

---

## Executive Summary

@deessejs/fp has a **clear market window**. fp-ts is merging with Effect-TS creating uncertainty. neverthrow has unresolved maintenance concerns and React 19 incompatibility. ts-results is abandoned. This creates an opening for "the well-maintained neverthrow alternative" -- a library with a simple API, modern TypeScript, and active development.

**The One Message:**
> "Your TypeScript types lie when you use exceptions. @deessejs/fp makes errors explicit in your types -- without the complexity of fp-ts."

**Target:** 500K weekly npm downloads within 12 months.

---

## Market Analysis

### NPM Landscape (Q1 2026)

| Package | Weekly Downloads | GitHub Stars | Status |
|---------|-----------------|--------------|--------|
| fp-ts | 4,137,558 | 11,493 | **Merging with Effect-TS** |
| neverthrow | 1,467,767 | 7,400 | Maintenance concerns |
| ts-results | 168,535 | 1,392 | **Abandoned (5 years)** |
| option-t | 103,891 | 355 | Active but niche |
| Effect-TS | (bundled) | 13,800 | fp-ts successor, heavy |

### White Space Opportunity

Developers want **simple Result types** (like neverthrow) but with:
- Active maintenance
- Modern TypeScript inference
- ESM-first compatibility
- React 19 support
- Clean documentation

**Positioning:** "The well-maintained neverthrow alternative"

---

## Competitive Positioning

### Positioning Matrix

| Against | Message |
|---------|---------|
| fp-ts | "You don't need HKT to get type-safe errors" |
| neverthrow | "Same simple API, actively maintained" |
| ts-results | "Abandoned. More features, same simplicity" |
| Effect | "Lightweight when you don't need the full ecosystem" |
| Zod | "Complementary -- Zod validates data, @deessejs/fp propagates errors" |

### Comparison Table

| Concern | neverthrow | fp-ts | @deessejs/fp |
|---------|-----------|-------|--------------|
| Last significant commit | Feb 2026 | Aug 2025 (uncertain) | Actively maintained |
| React 19 support | Broken | Works | Works |
| `fromPromise` errorFn | Not optional | N/A | Optional |
| Type inference | Occasional failures | Complex HKT | Consistent |
| Bundle size (gzipped) | ~5KB | ~50KB | ~2KB |
| ESM compatibility | Works | Ongoing issues | ESM-first |
| Issue response time | Variable | Slow | < 48 hours |
| Zod integration | No | No | Yes (optional) |
| AsyncResult.allSettled | No | Via TaskEither | Yes |

---

## Technical Differentiation

### Unique Value Propositions

| USP | Description |
|-----|-------------|
| **Zod-Validated Errors** | Unique among all competitors -- `error()` factory accepts optional Zod schemas for runtime validation |
| **Error Enrichment** | `addNotes()` and `from()` (cause chaining) -- inspired by Python exceptions, not found elsewhere |
| **Sensitive Data Redaction** | Automatic redaction of `password`, `token`, `secret`, `apikey` in error messages |
| **Thenable AsyncResult** | Direct `await` without `.toPromise()` conversion |
| **`allSettled` for AsyncResult** | Returns ALL errors, never Err -- unique among competitors |

### Code Examples

**Error Enrichment (unique):**
```typescript
import { error, err } from '@deessejs/fp';

const enriched = err(ValidationError({ field: 'email' }))
  .mapErr(e => e
    .addNotes('While processing user registration')
    .from(NetworkError({ host: 'api.example.com' })));
```

**Sensitive Data Redaction (unique):**
```typescript
const e = CredentialsError({
  username: 'user@example.com',
  password: 'super_secret_password',
});
// e.message contains "[REDACTED]" for password
```

**Thenable AsyncResult:**
```typescript
const result = await fromPromise(fetchUser(id))
  .map(user => user.profile)
  .flatMap(profile => validateProfile(profile));
// No .toPromise() needed
```

---

## Critical Issues to Fix (Week 1)

| Issue | Impact | Fix |
|-------|--------|-----|
| `fp.nesalia.com` returns 404 | Immediate credibility loss | Redirect to `core.deessejs.com` |
| `homepage` field points to dead URL | npm page looks unmaintained | Update to `core.deessejs.com` |
| `" Either"` keyword has leading space | Misses search traffic | Fix to `"either"` |
| GitHub Actions badge points to wrong repo | Badge broken | Verify correct URL |

### npm Package Fixes

**Keywords to add:**
```json
"fp-ts-alternative",
"neverthrow-alternative",
"typescript-error-handling",
"typed-errors",
"result-type",
"error-handling-typescript",
"exception-handling",
"type-safe-errors",
"typescript-fp"
```

**Description to use:**
```
TypeScript error handling that actually works. Result, Maybe, Try, and AsyncResult
monads with perfect type inference, zero runtime deps, and React 19 support.
```

---

## Execution Roadmap

### Weeks 1-4: Quick Wins

| Week | Actions |
|------|---------|
| 1 | Fix package.json (keywords, description, homepage URL). Fix GitHub Actions badge. |
| 2 | Create migration guides (neverthrow, fp-ts). Add comparison table to docs. |
| 3 | Write blog post #1 ("TypeScript's Error Handling Is Broken"). Submit conference talks. |
| 4 | Write blog post #2 ("Result Types vs Exceptions"). Post Ask HN. Add live playground. |

### Month 2: Building Momentum

| Week | Actions |
|------|---------|
| 5-6 | Write blog post #3 (React 19). Outreach to React content creators. Create AsyncResult docs. |
| 7-8 | Write blog post #4 (Minimalist FP). Reach out to tech bloggers. Create error handling guide. |

### Month 3: Bigger Plays

| Week | Actions |
|------|---------|
| 9-10 | Write blog post #5 (Building Type-Safe API). Launch YouTube demo. Approach library maintainers. |
| 11-12 | Analyze download data. Create benchmark page. Set up content calendar. |

---

## Content Strategy

### Blog Post Series: "TypeScript Error Handling That Doesn't Suck"

| # | Title | Target |
|---|-------|--------|
| 1 | "TypeScript's Error Handling Is Broken. Here's the Fix" | Dev.to, HN |
| 2 | "Result Types vs Exceptions: A Practical Comparison" | Dev.to |
| 3 | "Why Your Error Handling Library Will Break in React 19" | React community |
| 4 | "The Minimalist's Guide to TypeScript Functional Programming" | Dev.to |
| 5 | "Building a Type-Safe API with @deessejs/fp" | Backend community |

### Documentation Pages to Create

| URL | Purpose |
|-----|---------|
| `/docs/comparison/fp-ts-alternative` | SEO: "fp-ts alternative" searches |
| `/docs/comparison/neverthrow-alternative` | SEO: "neverthrow alternative" searches |
| `/docs/guides/typescript-error-handling` | General error handling guide |
| `/docs/migration/neverthrow` | Conversion page for neverthrow users |
| `/docs/migration/fp-ts` | Conversion page for fp-ts users |
| `/docs/guides/async-error-handling` | AsyncResult vs Promise |
| `/docs/tutorials/api-routes` | Express/Fastify/Next.js tutorial |

---

## Cold Outreach

### Library Integration Targets

| Library | Contact | Why |
|---------|---------|-----|
| tRPC | @trpc | Heavy TypeScript, needs error handling |
| Zod | @colinhacks | Already a dependency |
| Prisma | @prisma | Type-safe DB with error cases |
| Fastify | @fastify | TypeScript plugin ecosystem |
| Hono | @honojs | Lightweight TS framework |

### Content Creator Targets

| Creator | Platform | Angle |
|---------|----------|-------|
| Theo Browne | YouTube/Twitch | TS community influence |
| Jack Herrington | YouTube | React/TS content |
| Fireship | YouTube | Mass dev education |
| Axolo | Newsletter | Dev.to publisher |

### Sample Outreach Template

**Subject:** Proposal: Native Result type support for [FRAMEWORK]

```
Hi [NAME],

I've been building @deessejs/fp -- a TypeScript error handling library
that's hit 3.0.0.

I noticed [FRAMEWORK] currently uses throw/catch for error handling.
This creates a gap: users lose type safety when errors propagate.

I'd like to propose adding @deessejs/fp as an optional dependency for
typed errors. Here's a concrete example:

  // Current
  function getUser(id: string): Promise<User> {
    if (!user) throw new NotFoundError();
    return user;
  }

  // With @deessejs/fp
  function getUser(id: string): AsyncResult<User, NotFoundError> {
    if (!user) return err({ name: 'NOT_FOUND', message: '...' });
    return ok(user);
  }

Benefits:
- Compile-time error checking
- Zero runtime deps (only Zod for optional validation)
- ESM-first, React 19 compatible
- < 48hr response time on issues

Would you be open to a discussion?
```

---

## Community Strategy

### Reddit

| Subreddit | Strategy | Content |
|-----------|----------|---------|
| r/typescript | Long-form posts, genuine questions | "How do you handle multi-layer async errors?" |
| r/node | Backend-focused | "TypeScript backend error handling in 2026" |
| r/reactjs | React 19 angle | "React 19 server components broke my error handling" |

**Rule:** Never spam links. Lead with educational content.

### Hacker News

**What to post:**
- "How I built a type-safe API layer without fp-ts" (technical deep dive)
- "The TypeScript error handling landscape in 2026" (market analysis)
- "Why Result types should be in the standard library" (opinion)

**Ask HN format:**
- "Ask HN: What's your TypeScript error handling strategy?"

**Timing:** Weekdays 6-8 AM Pacific (14:00-16:00 UTC)

### Conferences

| Conference | Priority | Talk Title |
|------------|----------|------------|
| TypeScript Congress | 1 | "Type-Safe Error Handling Without the PhD" |
| TS Conf | 2 | Same talk |
| NodeConf EU | 3 | Backend-focused error handling |
| React Summit | 4 | React 19 compatibility |

---

## Success Metrics

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

### Community Engagement

| Metric | Week 4 | Week 12 |
|--------|--------|---------|
| GitHub issues closed | 5 | 20 |
| GitHub discussions | 3 | 15 |
| npm downloads | 10K/week | 50K/week |
| Docs page views | 1K/week | 5K/week |

---

## Tracking Framework

Set up a weekly tracking spreadsheet:

```
| Week | npm downloads | GitHub stars | Docs views | Blog views | Key actions |
|------|--------------|--------------|------------|------------|-------------|
| 1    | X            | X            | X          | X          | [actions]   |
| 2    | X            | X            | X          | X          | [actions]   |
```

Review weekly. Adjust based on what is working.

---

## Next Steps

1. **This week:** Fix package.json issues (homepage, keywords, description)
2. **This week:** Create migration documentation
3. **This week:** Fix GitHub Actions badge
4. **Week 2:** Create comparison table on docs homepage
5. **Week 3:** Write first blog post
6. **Week 3:** Submit conference proposals

---

## Key Resources

- **Documentation:** https://core.deessejs.com
- **GitHub:** https://github.com/nesalia-inc/fp
- **npm:** https://www.npmjs.com/package/@deessejs/fp
- **Migration from neverthrow:** ./neverthrow.md
- **Migration from fp-ts:** ./fp-ts.md

---

*Plan version 1.0. Next review: May 2026.*
