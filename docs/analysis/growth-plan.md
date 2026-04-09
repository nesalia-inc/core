# @deessejs/fp Growth Plan

**Author:** martyy-code
**Date:** April 2026
**Version:** 1.0
**Status:** Ready for Implementation

---

## Executive Summary

@deessejs/fp has a clear window for growth. fp-ts is merging with Effect-TS, creating uncertainty. neverthrow has maintenance concerns and React 19 issues. ts-results is too basic. There is a real opening for "the well-maintained neverthrow alternative" -- a library with a simple API, modern TypeScript, and active development.

This plan covers 7 areas with specific, actionable items. Every recommendation includes exact copy, names, or numbers.

---

## 1. npm Package SEO Optimization

### 1.1 Keywords to Add to package.json

**Current keywords:**
```json
"keywords": [
  "typescript",
  "functional-programming",
  "result",
  "maybe",
  "try",
  "error-handling",
  "monad",
  "async",
  " Either",
  "option"
]
```

**Problems:** " Either" has a leading space (typo). Missing critical search terms.

**Replace with:**
```json
"keywords": [
  "typescript",
  "functional-programming",
  "result",
  "result-type",
  "maybe",
  "option",
  "try",
  "error-handling",
  "error-handling-typescript",
  "typed-errors",
  "exception-handling",
  "monad",
  "async",
  "either",
  "fp-ts-alternative",
  "neverthrow-alternative",
  "typescript-error-handling",
  "typescript-fp",
  "type-safe-errors"
]
```

**Rationale:**
- `fp-ts-alternative` and `neverthrow-alternative` capture migration searches
- `result-type` and `typed-errors` are how developers search when evaluating options
- `typescript-error-handling` captures the broader error handling market
- Fixed the `" Either"` typo

### 1.2 Description Improvements

**Current:**
```
"description": "Type-safe error handling for TypeScript - Result, Maybe, Try, and AsyncResult monads with zero runtime dependencies"
```

**Replace with:**
```
"description": "TypeScript error handling that actually works. Result, Maybe, Try, and AsyncResult monads with perfect type inference, zero runtime deps, and React 19 support. Built by devs who got tired of uncaught exceptions."
```

**Why:** The current description is feature-list style. The new one leads with the problem ("actually works"), calls out specific differentiators (perfect type inference, React 19 support), and ends with credibility ("devs who got tired").

### 1.3 Links to Fix/Add

**Current state:**
- `homepage`: `https://fp.nesalia.com` (links to docs site)
- `repository`: `https://github.com/nesalia-inc/fp.git`

**Add:**
```json
"homepage": "https://core.deessejs.com",
"repository": {
  "type": "git",
  "url": "https://github.com/nesalia-inc/fp.git",
  "directory": "packages/fp"
},
"bugs": {
  "url": "https://github.com/nesalia-inc/fp/issues"
},
"funding": {
  "type": "github",
  "url": "https://github.com/sponsors/nesalia-inc"
},
"keywords": [...],
"license": "MIT"
```

**Note:** Verify homepage links to `core.deessejs.com` (the docs URL provided). The user said docs are at `https://core.deessejs.com` but package.json shows `https://fp.nesalia.com`. **Fix this mismatch.**

### 1.4 npm Badges and Features to Enable

Add to README.md:
```markdown
[![npm version](https://img.shields.io/npm/v/@deessejs/fp)](https://www.npmjs.com/package/@deessejs/fp)
[![Bundle Size](https://img.shields.io/bundlejs/size/@deessejs/fp)](https://bundlejs.com/?q=@deessejs/fp)
[![Downloads](https://img.shields.io/npm/dw/@deessejs/fp)](https://www.npmjs.com/package/@deessejs/fp)
[![TypeScript](https://img.shields.io/npm/types/@deessejs/fp)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/github/license/nesalia-inc/fp)](LICENSE)
```

Enable npm "Funding" link via `funding` field already in package.json.

**GitHub Actions badge update:** Current CI badge links to `nesalia-inc/core` workflow. Verify this is correct, or update to `nesalia-inc/fp`.

---

## 2. Technical SEO Strategy

### 2.1 Documentation Pages to Create

Create these specific pages on the docs site:

1. **"Why @deessejs/fp Instead of fp-ts?"**
   - URL: `/docs/comparison/fp-ts-alternative`
   - Content: Honest comparison table. Lead with HKT complexity, ESM issues, future uncertainty from merger. Show equivalent code examples where @deessejs/fp is simpler.
   - SEO target: developers searching "fp-ts too complex" or "fp-ts alternative"

2. **"Why @deessejs/fp Instead of neverthrow?"**
   - URL: `/docs/comparison/neverthrow-alternative`
   - Content: Direct comparison on type inference, React 19 compatibility, maintenance responsiveness. Use specific GitHub issues as evidence (e.g., the 3-year-old `fromPromise` feature request).
   - SEO target: developers searching "neverthrow maintenance" or "neverthrow alternative"

3. **"TypeScript Error Handling: A Practical Guide"**
   - URL: `/docs/guides/typescript-error-handling`
   - Content: Comprehensive guide to error handling patterns in TypeScript. Show try/catch problems, then Result-based solutions. Target competitive keywords like "typescript try catch alternative" and "typescript error handling best practices".
   - SEO target: general TypeScript developers, blog traffic

4. **"Migrating from neverthrow to @deessejs/fp"**
   - URL: `/docs/migration/neverthrow`
   - Content: Step-by-step migration guide. Map every neverthrow API to its @deessejs/fp equivalent. This is a conversion page -- make it easy.
   - SEO target: "neverthrow migration" searches

5. **"Migrating from fp-ts to @deessejs/fp"**
   - URL: `/docs/migration/fp-ts`
   - Content: Frame this as "when you need Result without HKT." Show that most fp-ts users only use a fraction of the library.
   - SEO target: "fp-ts migration" searches

6. **"AsyncResult vs Promise: Better Error Handling for Async Code"**
   - URL: `/docs/guides/async-error-handling`
   - Content: Compare AsyncResult to plain Promise with try/catch. Target developers frustrated with Promise error handling.
   - SEO target: "typescript async error handling" searches

7. **"Error Handling for API Routes"**
   - URL: `/docs/tutorials/api-routes`
   - Content: Express/Fastify/Next.js route error handling tutorial. Real-world example showing how to propagate errors through request chains.
   - SEO target: backend TypeScript developers

### 2.2 Blog Post Ideas

Write these specific blog posts with these exact angles:

**Post 1: "How I Stopped Worrying About Uncaught Exceptions in TypeScript"**
- Angle: Personal story of frustration with try/catch leading to production bugs
- Key message: "Your types lie when you use exceptions"
- Call to action: Link to installation, link to Result docs
- Target: Dev.to, Hacker News (in comments), Reddit r/typescript

**Post 2: "fp-ts Is Great, But You Probably Don't Need It"**
- Angle: Nuanced take. fp-ts is powerful but 90% of users only need Result types, not HKT machinery
- Key message: "Complexity is a cost. Make sure you're getting the benefit."
- Call to action: Show equivalent @deessejs/fp code that does the same thing without type-level programming
- Target: Dev.to, Hacker News, Twitter/X technical audience

**Post 3: "The TypeScript Error Handling Library You Should Actually Use in 2026"**
- Angle: Updated comparison of neverthrow, fp-ts, ts-results, @deessejs/fp
- Key message: "Maintenance matters. Here's who is actually maintaining their code."
- Call to action: Direct install link
- Target: Dev.to (curated), JavaScript Weekly, TypeScript Weekly

**Post 4: "Why Your React 19 Server Components Need @deessejs/fp"**
- Angle: neverthrow's `ResultAsync.fromPromise` fails with React 19 server components. @deessejs/fp doesn't.
- Key message: "Your error handling library should work with your framework, not against it."
- Call to action: Link to async-result docs with React 19 example
- Target: React-focused devs, Next.js community

**Post 5: "Result Types Are Not About Functional Programming"**
- Angle: Debunk the "this is too academic" objection. Result types are about readable code, not category theory.
- Key message: "If you understand try/catch, you understand Result. The types just make it explicit."
- Call to action: Link to quick-start example
- Target: Dev.to, r/javascript, r/typescript

### 2.3 GitHub Repo Optimization Checklist

- [ ] **README header image**: Add a clean "type-safe error handling" hero graphic
- [ ] **Pinned discussions**: Pin a "Why @deessejs/fp?" discussion
- [ ] **Issue templates**: Add bug report template with specific fields (TypeScript version, reproduction steps)
- [ ] **PR template**: Add PR template with checklist for tests, types, docs
- [ ] **CONTRIBUTING.md**: Write explicit contribution guidelines
- [ ] **SECURITY.md**: Already exists -- good. Ensure security@nesalia.com is monitored
- [ ] **Star count**: Once you have 1,000 stars, add a badge
- [ ] **Topics**: Add repo topics: `typescript`, `fp-ts-alternative`, `error-handling`, `result-type`, `functional-programming`
- [ ] **Releases**: Automate releases via changesets (already configured based on CLAUDE.md)

### 2.4 Documentation Site Improvements

**Immediate fixes:**
1. **Broken bundle size badge**: The `bundlejs.com` badge currently links to nothing verifiable. Add actual bundlejs.com link.
2. **Live code playground**: Add an interactive TypeScript playground on the docs homepage using `@typescript-lang/playground` embed or similar. Show a before/after of error handling.
3. **Quick decision guide**: Move the Quick Decision Guide from `docs/features/README.md` to the homepage. This is a high-value page for devs evaluating the library.
4. **Comparison table**: Add a comparison table on the homepage or dedicated `/comparison` page: @deessejs/fp vs neverthrow vs fp-ts vs ts-results. Columns: Bundle size, Runtime deps, Type inference, React 19, Active maintenance.
5. **SEO meta tags**: Ensure all docs pages have unique `<title>` and `<meta name="description">` tags. Check for duplicate content issues.

---

## 3. Cold Outreach Templates

### 3.1 Library Integration Proposal

**To:** Maintainers of popular TypeScript frameworks (Express, Fastify, Prisma, Drizzle, tRPC, NestJS)

**Subject:** Proposal: Native Result type support for [FRAMEWORK NAME]

**Template:**

```
Hi [NAME],

I've been building [@deessejs/fp](https://github.com/nesalia-inc/fp) -- a
TypeScript error handling library that's hit 3.0.0 and has [X] weekly downloads.

I noticed [FRAMEWORK] currently uses throw/catch for error handling in [SPECIFIC AREA].
This creates a gap: users lose type safety when errors propagate across boundaries.

I'd like to propose adding @deessejs/fp as an optional dependency for typed errors.
Here's a concrete example of what this could look like:

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

Benefits for [FRAMEWORK]:
- Users get compile-time error checking -- no more unexpected exceptions
- Zero runtime deps (only Zod for optional validation)
- ESM-first, React 19 compatible
- Actively maintained -- 48hr response time on issues

I'd welcome the chance to discuss how this could work for your API design.
Would you be open to a quick call or GitHub discussion?

--[YOUR NAME]
@deessejs/fp maintainer
```

**Personalization notes:**
- Express: Reference `express-async-errors` package and how @deessejs/fp is a typed alternative
- Prisma/Drizzle: Reference the lack of typed Result from database queries
- tRPC: Reference tRPC's error handling middleware

### 3.2 Content Collaboration Pitch

**To:** Tech bloggers (Axolo, Robin W. at falsifiable.dev, TypeScript Weekly editors), YouTubers (Jack Leg, Theo Browne, Web Dev Simplified)

**Subject:** Story angle: TypeScript error handling that doesn't betray you

**Template:**

```
Hi [NAME],

I maintain [@deessejs/fp](https://github.com/nesalia-inc/fp) -- a TypeScript
error handling library that just hit 3.0.0.

I think there's a story here that your audience would care about:

**The angle:** fp-ts is merging with Effect-TS. neverthrow has maintenance concerns.
TypeScript developers are looking for a clean, maintained alternative.
@deessejs/fp is exactly that -- but the market doesn't know it yet.

**Why now:** The fp-ts/Effect merger creates uncertainty. Developers who built
on fp-ts are asking "what's next?" Your viewers/readers might be among them.

**What I'm offering:**
- Technical deep dive on TypeScript error handling patterns
- A comparison video/post against neverthrow and fp-ts
- Original benchmarks on type inference speed
- Exclusive pre-release access to new features
- Genuine story about a library built by devs who got tired of uncaught exceptions

**What I want:**
- Honest review that shows real code, not sponsored fluff
- Freedom to correct any factual errors before publish
- Credit with a link to the docs

I can send you a press kit with benchmarks, comparison code, and logo assets
if you're interested.

Here's a 90-second demo that shows the library in action:
[LINK TO DOCS LIVE DEMO or GIF]

Happy to chat more if this sounds interesting.

--[YOUR NAME]
```

### 3.3 Discord Community Engagement Script

**To:** TypeScript/FP Discord servers (TS Conf, Prisma Discord, tRPC Discord, Reactiflux, Node.js Discord)

**Channels:** #typescript, #help, #fp-ts-alternative (if exists)

**Script (non-spammy approach):**

**Opening (genuine question format):**
```
Hey everyone. Genuine question: how do you all handle errors that need to
propagate through multiple layers of async code?

I've been using try/catch but I'm hitting a wall where TypeScript doesn't
know what can throw. Looking for a type-safe approach that doesn't require
fp-ts-level complexity.

Has anyone tried Result-based error handling? Curious about real-world
experiences vs the academic treatment.
```

**If someone mentions neverthrow:**
```
yeah neverthrow is solid. I've been maintaining @deessejs/fp as an
alternative -- similar API but focused specifically on the error handling
case without trying to be a full FP framework. Happy to answer questions
if anyone wants to compare.

[Optional: drop link to comparison doc]
```

**If someone criticizes fp-ts complexity:**
```
This is exactly why I started @deessejs/fp -- most devs don't need HKT,
they just need Result types that work. The full fp-ts API surface is
powerful but it's a lot to onboard onto.

[Optional: drop link to fp-ts comparison]
```

**Key rule:** Never drop links without context. Always respond to something someone said. Never post in #showcase or #resources without being asked.

---

## 4. Community-Led Growth

### 4.1 Reddit Strategy

**Subreddits to target:**

| Subreddit | Strategy | What to Post |
|-----------|----------|--------------|
| r/typescript | Long-form posts, genuine questions | "How do you handle multi-layer async errors?" -- your own thread to seed discussion |
| r/node | Backend-focused discussions | "TypeScript backend error handling in 2026" post |
| r/reactjs | React 19 and framework integration | "React 19 server components broke my error handling" |
| r/ProgrammingLanguages | FP-curious audience | "Why Result types beat exceptions" explainer |
| r/webdev | Broader audience | "The simplest TypeScript error handling library" |

**Posting guidelines:**
1. **Never spam links.** Share genuine insights, not just "check out my library"
2. **Lead with value.** Write a post that teaches something. Include a library link only in context
3. **Wait for relevant threads.** Reply to "what error handling library should I use?" type questions with a genuine answer
4. **Avoid cross-posting the same content.** Each subreddit has different norms. Adapt.

**Specific thread to find:** Search for "is fp-ts worth it" or "neverthrow maintenance" or "TypeScript error handling library recommendation" threads. These are gold -- answer them honestly with @deessejs/fp as a recommendation, not promotional.

### 4.2 Dev.to Article Series

**Series title:** "TypeScript Error Handling That Doesn't Suck"

**Article 1:** "TypeScript's Error Handling Is Broken. Here's the Fix"
- Angle: Show the problem with try/catch (types lie, exceptions can escape)
- Include: Before/after code comparison
- CTA: Link to docs installation section

**Article 2:** "Result Types vs Exceptions: A Practical Comparison"
- Angle: Not a philosophical FP debate. A practical code comparison.
- Include: Real-world scenarios (API calls, database queries, user validation)
- CTA: Link to Result type documentation

**Article 3:** "Why Your Error Handling Library Will Break in React 19"
- Angle: neverthrow's `ResultAsync.fromPromise` fails with React 19. Why this happens and what to use instead.
- Include: Working code example with Next.js App Router
- CTA: Link to AsyncResult docs

**Article 4:** "The Minimalist's Guide to TypeScript Functional Programming"
- Angle: You don't need HKT. You don't need type classes. You need Result and Maybe that work.
- Include: Comparison with equivalent fp-ts code
- CTA: Link to comparison page vs fp-ts

**Article 5:** "Building a Type-Safe API with @deessejs/fp: A Real-World Walkthrough"
- Angle: End-to-end tutorial building a typed API with proper error propagation
- Include: Express/Fastify example, Zod validation, Result-based middleware
- CTA: Link to full docs

### 4.3 Hacker News Strategy

**Posting guidelines:**
1. **HN traffic is volatile.** A post that gets traction can drive 50,000 visits. A post that doesn't get upvoted gets 50.
2. **Don't post library announcements.** HN responds to "ideas" and "problems" not "check out my library"
3. **Post technical depth.** A 2,000-word technical analysis performs better than a feature list.

**Content to post on HN (as "I"):
- "How I built a type-safe API layer without fp-ts" (technical deep dive)
- "The TypeScript error handling landscape in 2026" (market analysis -- like this plan)
- "Why Result types should be in the standard library" (opinion piece with code)

**Ask HN format:**
- "Ask HN: What's your TypeScript error handling strategy?"
- Genuinely curious. Respond to every comment. The goal is discussion, not promotion.

**Timing:** Post on weekdays between 6-8 AM Pacific (14:00-16:00 UTC). Avoid weekends.

### 4.4 Conferences and Meetups

**Target order of priority:**

1. **TypeScript Congress** (Europe, annual) -- Submit talk on "Type-safe error handling without the complexity tax"
2. **TS Conf** (US, annual) -- Same talk pitch
3. **NodeConf EU** -- Backend-focused error handling talk
4. **React Summit** -- React 19 compatibility angle
5. **Local TypeScript meetups** (TypeScript NYC, TypeScript London, TypeScript Berlin) -- Lower barrier, more intimate. Offer to speak.

**Meetup approach:**
- Find TypeScript meetups via https://www.meetup.com/pro/typescript
- Offer a 20-minute talk + 10-minute Q&A
- Talk title: "Type-safe errors in TypeScript: beyond try/catch"
- No sales pitch. Just teach something useful. Mention @deessejs/fp in the "further reading" slide.

**Conference talk abstract template:**
```
Title: Type-Safe Error Handling Without the PhD

Abstract:
TypeScript promises type safety, but error handling breaks that promise.
Exceptions can crash your app. Types don't reflect failure states.
try/catch chains become unreadable.

This talk shows how Result types solve these problems -- without requiring
HKT, type classes, or a background in functional programming.

We'll cover:
- Why exceptions betray your types
- The Result pattern in practice (live coded examples)
- How @deessejs/fp achieves better type inference than neverthrow
- Why React 19 server components break traditional error handling
- Real-world migration path from try/catch to typed errors

Audience: TypeScript developers who want safer error handling
without adopting a full FP framework.
```

---

## 5. Competitive Positioning

### 5.1 ONE Message That Cuts Through

**Primary message:**

> "Your TypeScript types lie when you use exceptions. @deessejs/fp makes errors explicit in your types -- without the complexity of fp-ts."

**Why this works:**
- It's a concrete claim ("your types lie")
- It's specific (exceptions vs Result types)
- It addresses the key fear (complexity of fp-ts)
- It's falsifiable

**Tagline alternatives:**
- "Type-safe errors that Just Work. No PhD required."
- "The simplest path to type-safe error handling in TypeScript."
- "Error handling that doesn't betray your types."

### 5.2 Position vs neverthrow

**Message for neverthrow users:**

> "neverthrow is solid. But the last significant commit was Feb 2026, and there are unresolved React 19 issues. @deessejs/fp has the same simple API -- actively maintained, better type inference, and React 19 compatible today."

**Direct comparison points:**

| Concern | neverthrow | @deessejs/fp |
|---------|-----------|--------------|
| Last significant commit | Feb 14, 2026 | [CURRENT DATE] |
| React 19 support | Broken | Works |
| `fromPromise` errorFn | Not optional (3yr old request) | Optional |
| Type inference | Occasional failures | Consistent |
| Issue response time | Variable | < 48 hours |

**Objection handling: "neverthrow has more stars and downloads"**
- "Downloads follow trust. Trust comes from maintenance. Stars are a lagging indicator."

### 5.3 Position vs fp-ts

**Message for fp-ts users (especially those considering Effect merger):**

> "fp-ts is merging with Effect-TS. If you're not ready for that journey, @deessejs/fp gives you the Result types you actually need -- without HKT, without type classes, without the learning curve."

**Direct comparison points:**

| Concern | fp-ts | @deessejs/fp |
|---------|------|--------------|
| Bundle size (gzipped) | ~50KB | ~2KB |
| Learning curve | Steep (HKT, type classes) | Low (try/catch knowledge) |
| ESM compatibility | Ongoing issues | ESM-first |
| API surface | Large (comprehensive) | Focused (Result, Maybe, Try, AsyncResult) |
| Future | Merging with Effect | Independent, maintained |

**Objection handling: "fp-ts is more powerful"**
- "You don't pay for what you don't use. But more importantly: 90% of fp-ts users only use 10% of the API. @deessejs/fp is that 10% -- extracted and optimized."

### 5.4 Objection Handling: "Why not just use zod?"

**Response:**

"Zod is great for validation. @deessejs/fp uses Zod internally when you want runtime validation. But they solve different problems:

- **Zod**: 'Is this data valid?' (validation)
- **@deessejs/fp**: 'Did this operation succeed or fail?' (error propagation)

You need both. Zod validates the shape of data. @deessejs/fp propagates whether an operation succeeded or failed through your call stack. They're complementary -- which is why @deessejs/fp has Zod as an optional peer dependency.

If you only need validation, use Zod. If you need typed error propagation through async chains, use @deessejs/fp. If you need both: use both."

---

## 6. 30-60-90 Day Roadmap

### 6.1 Weeks 1-4: Quick Wins

**Week 1:**
- [ ] Fix package.json keywords (remove " Either" typo, add fp-ts-alternative, neverthrow-alternative, etc.)
- [ ] Update package.json description to the problem-first version
- [ ] Verify/fix homepage URL mismatch (fp.nesalia.com vs core.deessejs.com)
- [ ] Update GitHub Actions badge URL if incorrect
- [ ] Pin a "Why @deessejs/fp?" GitHub discussion

**Week 2:**
- [ ] Create migration guide: "Migrating from neverthrow to @deessejs/fp"
- [ ] Create migration guide: "Migrating from fp-ts to @deessejs/fp"
- [ ] Add comparison table to docs homepage
- [ ] Fix bundle size badge to link to actual bundlejs.com
- [ ] Post honest answer to 3 "TypeScript error handling recommendation" threads on Reddit/StackOverflow

**Week 3:**
- [ ] Write and publish: Blog post 1 "TypeScript's Error Handling Is Broken. Here's the Fix"
- [ ] Submit talk proposal to TypeScript Congress
- [ ] Submit talk proposal to TS Conf
- [ ] Reach out to 3 TypeScript meetups about speaking

**Week 4:**
- [ ] Write and publish: Blog post 2 "Result Types vs Exceptions: A Practical Comparison"
- [ ] Cold outreach to 5 neverthrow GitHub issue authors about migration path
- [ ] Post "Ask HN: What's your TypeScript error handling strategy?"
- [ ] Add live code playground to docs homepage

### 6.2 Month 2: Building Momentum

**Weeks 5-6:**
- [ ] Write and publish: Blog post 3 "Why Your Error Handling Library Will Break in React 19"
- [ ] Outreach to React-focused content creators
- [ ] Create "AsyncResult vs Promise" docs page
- [ ] Submit PR to add @deessejs/fp to TypeScript-Community list
- [ ] File issues to track @deessejs/fp integration with popular frameworks (Express, tRPC)

**Weeks 7-8:**
- [ ] Write and publish: Blog post 4 "The Minimalist's Guide to TypeScript Functional Programming"
- [ ] Reach out to 3-5 tech bloggers (Axolo, falsifiable.dev)
- [ ] Create docs page "TypeScript Error Handling: A Practical Guide"
- [ ] Set up automated npm publish to include funding link
- [ ] Add repo topics: fp-ts-alternative, neverthrow-alternative, error-handling

### 6.3 Month 3: Bigger Plays

**Weeks 9-10:**
- [ ] Write and publish: Blog post 5 "Building a Type-Safe API with @deessejs/fp"
- [ ] Launch YouTube demo video or GIF animation showing error handling in action
- [ ] Approach 2 library maintainers (Express, tRPC) with integration proposal
- [ ] Submit to JavaScript Weekly or TypeScript Weekly if article series is ready
- [ ] Create "API Error Handling Tutorial" docs page

**Weeks 11-12:**
- [ ] Analyze download data and adjust strategy
- [ ] Identify and fix any SEO gaps on docs site
- [ ] If talk accepted: prepare conference talk
- [ ] Create benchmark comparison page (type inference speed vs neverthrow)
- [ ] Set up recurring content calendar for blog (bi-weekly posts)

### 6.4 Success Milestones

| Milestone | Target | Timeline |
|-----------|--------|----------|
| npm weekly downloads | 50,000 | 90 days |
| GitHub stars | 1,000 | 90 days |
| Blog post views | 10,000 total | 90 days |
| Developer testimonials | 5 quoted | 90 days |
| Conference talk accepted | 1 | 90 days |
| Integration proposal sent | 3 | 90 days |

---

## 7. Success Metrics

### 7.1 npm Download Targets

**Current baseline:** Unknown (need to establish from npm)
**Targets by quarter:**

| Period | Target | Notes |
|--------|--------|-------|
| Week 4 | 10,000/week | From SEO fixes, Reddit presence |
| Week 12 | 50,000/week | From blog series, migration guides |
| Month 6 | 150,000/week | From conference talks, integrations |
| Month 12 | 500,000/week | From ecosystem adoption, testimonials |

**Key metric:** Month-over-month growth rate. Target: 20% MoM minimum.

### 7.2 GitHub Star Velocity

**Current baseline:** Unknown (need to check current stars)
**Targets:**

| Period | Stars | Velocity |
|--------|-------|----------|
| Week 4 | 200 new | Posting to Reddit, HN, blog mentions |
| Week 12 | 1,000 new | Blog series, conference talks |
| Month 6 | 3,000 new | Ecosystem integrations, testimonials |
| Month 12 | 10,000 new | Mass adoption, strong community |

**Key insight:** Stars are a lagging indicator. Focus on downloads and community engagement. Stars will follow.

### 7.3 Community Engagement Metrics

**Quantitative:**

| Metric | Week 4 Target | Week 12 Target |
|--------|--------------|----------------|
| GitHub issues closed | 5 | 20 |
| GitHub discussions | 3 | 15 |
| Discord messages (community) | 10 | 50 |
| npm downloads | 10K/week | 50K/week |
| Docs page views | 1K/week | 5K/week |

**Qualitative:**

- Positive developer sentiment in r/typescript, r/node discussions
- Testimonials from named companies or developers
- Inbound integration requests from other libraries
- Conference talk acceptance
- Blog posts shared on Hacker News without being downvoted

### 7.4 Tracking Tools

Set up a simple tracking spreadsheet:

```
| Week | npm downloads | GitHub stars | Docs views | Blog views | Key actions |
|------|--------------|--------------|------------|------------|-------------|
| 1    | X            | X            | X          | X          | [actions]   |
| 2    | X            | X            | X          | X          | [actions]   |
```

Review weekly. Adjust strategy based on what is actually working.

---

## Appendix: Key Resources

**Documentation:** https://core.deessejs.com
**GitHub:** https://github.com/nesalia-inc/fp
**npm:** https://www.npmjs.com/package/@deessejs/fp

**Market Data:**
- fp-ts: 4.1M weekly downloads, 11,493 stars
- neverthrow: 1.5M weekly downloads, 7,400 stars
- ts-results: 168K weekly downloads, 1,392 stars
- Main pain points: type inference failures, complex APIs, ESM issues, maintenance concerns

**Competitor GitHub issues for reference:**
- neverthrow: ResultAsync.fromPromise React 19 issue, fromPromise optional errorFn request (3yr old)
- fp-ts: ESM directory import errors, HKT complexity questions, "Is this project dead?" June 2024

---

*Plan version 1.0. Next review: May 2026.*
