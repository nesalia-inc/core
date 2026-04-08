# Top 10 Actions for Month 1

*Exact checklist. No ambiguity.*

---

## Week 1: npm SEO Emergency Fixes

### 1. FIX THE NPM KEYWORD TYPO [CRITICAL]

**The problem:** `" Either"` has a leading space. This is embarrassing and costs search visibility.

**The fix in `packages/core/package.json`:**

```json
// BEFORE (wrong)
"keywords": ["typescript", " Either", ...]

// AFTER (correct)
"keywords": ["typescript", "either", ...]
```

**Also add:**
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

---

### 2. FIX HOMEPAGE URL MISMATCH [HIGH]

**The problem:** `package.json` homepage is `https://fp.nesalia.com` which returns 404.

**The fix:**
```bash
npm pkg set homepage=https://core.deessejs.com
```

Or update `package.json` directly:
```json
"homepage": "https://core.deessejs.com"
```

---

### 3. UPDATE DESCRIPTION [HIGH]

**The problem:** Current description is feature-list style, not problem-first.

**The fix:**
```json
"description": "TypeScript error handling that actually works. Result, Maybe, Try, and AsyncResult monads with perfect type inference, zero runtime deps, and React 19 support."
```

---

## Week 2: First-Time User Experience

### 4. CREATE "WHY NOT try/catch?" PAGE [CRITICAL]

**The problem:** Nobody addresses why someone should switch from standard error handling.

**The page should:**
- Show a before/after: try/catch vs @deessejs/fp
- Demonstrate the "aha moment" (error enrichment with context)
- Address the visceral objection: "try/catch works for me"

**URL:** `/docs/why-not-try-catch`

**Example content:**
```typescript
// try/catch: Error loses context
try {
  const user = await fetchUser(id);
  const profile = await fetchProfile(user.profileId);
  const posts = await fetchPosts(profile.id);
} catch (e) {
  logger.error(e); // What failed? Where? Why?
}

// @deessejs/fp: Error has context
const result = await fromPromise(fetchUser(id))
  .flatMap(user => fromPromise(fetchProfile(user.profileId)))
  .flatMap(profile => fromPromise(fetchPosts(profile.id)))
  .mapErr(e => e.addNotes('Failed to load user feed'));
// Error now has FULL context: what failed, where, why
```

---

### 5. CREATE INTERACTIVE PLAYGROUND [HIGH]

**The problem:** The "aha moment" is buried in documentation.

**The fix:** Add a 30-second interactive playground on the homepage that shows:
1. Install command
2. Import statement
3. One before/after code example
4. The value proposition in 30 seconds

**Target:** Visitor goes from landing page to "I see how this works" in 30 seconds.

---

### 6. ENSURE ONE-LINE IMPORT [HIGH]

**The problem:** Users should be able to get started with one line.

**Verify these work:**
```typescript
import { ok, err, fromPromise } from '@deessejs/fp';
```

**If not, fix exports in `packages/core/src/index.ts`.**

---

## Week 3: Migration Documentation

### 7. FINALIZE NEVERTHROW MIGRATION GUIDE [HIGH]

**Already exists at:** `docs/analysis/neverthrow.md`

**Action:** Review, finalize, and link from homepage/migration page.

---

### 8. FINALIZE FP-TS MIGRATION GUIDE [HIGH]

**Already exists at:** `docs/analysis/fp-ts.md`

**Action:** Review, finalize, and link from homepage/migration page.

---

### 9. CREATE "WHY BUILD YOUR OWN?" PAGE [HIGH]

**The problem:** CTOs will ask "why not build our own Result type?"

**The page should:**
- Be honest: a basic Result type IS trivial to build
- Explain when @deessejs/fp is overkill and when it's not
- Highlight: error enrichment, Zod integration, battle-tested edge cases

**URL:** `/docs/why-not-build-your-own`

---

## Week 4: Community Seeding

### 10. POST ASK HN [HIGH]

**The post:**
```
Title: Ask HN: What's your TypeScript error handling strategy?

Body:
I've been working on @deessejs/fp -- a Result/Maybe type library for TypeScript.

I'm genuinely curious: how do you all handle errors in TypeScript?

- try/catch everywhere?
- Result types (neverthrow, fp-ts)?
- Something else?

I'm NOT here to sell anything. I want to understand what pain points
developers actually have with error handling.

(If you're curious about the library: github.com/nesalia-inc/fp)
```

**Rule:** Respond to EVERY comment. Genuinely engage. No spam.

---

## Week 1-4: Also Do These

| Action | Priority | Week |
|--------|----------|------|
| Create SECURITY.md | HIGH | 3 |
| Fix GitHub Actions badge | MEDIUM | 1 |
| Add "Who maintains this?" page | MEDIUM | 8 |
| Document LTS policy | MEDIUM | 8 |

---

## Don't Forget: The 3 Things NOT to Do

1. **Don't claim 500K downloads** -- Sets team up for demoralization
2. **Don't spam competitor GitHub issues** -- Will backfire and damage reputation
3. **Don't claim "zero dependencies"** -- Zod is a peer dep; say "zero mandatory dependencies"
