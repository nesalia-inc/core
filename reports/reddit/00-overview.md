# Reddit Marketing Strategy for @deessejs/fp

## Project Summary

**@deessejs/fp** is a TypeScript functional programming library providing type-safe error handling through Result, Maybe, Try, and AsyncResult types.

### Key Selling Points
- **Problem solved**: TypeScript promises type safety, but exceptions are invisible in type signatures
- **Solution**: Makes errors explicit in the type system (compile-time error checking)
- **Target audience**: TypeScript developers who want Result-based error handling without fp-ts complexity
- **Bundle size**: ~2KB gzipped (measured with rollup-plugin-gzip + terser, production build)
- **Positioning**: "Compile-time error visibility for TypeScript without ceremony", "neverthrow with more features and active maintenance"
- **Unique differentiators**: React 19 compatible, 100% test coverage, exponential/linear/constant retry with jitter
- **Zero runtime dependencies** (this is a centerpiece claim)

### Account Requirements

**Before posting anywhere, ensure your account meets these minimums:**

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Account age | 3+ months | New accounts are immediate red flags |
| Total karma | 100+ | Karma in relevant tech subs matters more |
| Tech subreddit history | 30+ posts/comments | Must show genuine participation, not just votes |
| Link karma | 0-5 max | Avoid posting links until trusted |

**The "problem-first" approach only works with established accounts.** A new account posting "here's a problem I solved" will be read as astroturfing. The Reddit community has years of pattern-matching experience and will check your post history. If there's nothing there, or if the only activity is promotional, your post will be downvoted and called out.

---

## Recommended Subreddits

### Tier 1: High Priority (Culture-First Tiering)

| Subreddit | Audience | Rationale |
|-----------|----------|-----------|
| r/typescript | TypeScript devs | Core audience, but HIGH RISK for self-promo. Only post after 2-3 months of genuine participation. The community is sophisticated and hostile to obvious marketing. |
| r/functionalprogramming | FP community | Skeptical but engaged. Will appreciate the Result type approach if presented genuinely. |

### Tier 2: Medium Priority

| Subreddit | Audience | Rationale |
|-----------|----------|-----------|
| r/node | Node.js devs | Framework-agnostic enough to work. |
| r/reactjs | React devs | Framework-specific. Good for error handling in React hooks/components. |
| r/coding | General coding | More thoughtful than r/programming, less hostile than r/javascript. |

### Tier 3: Low Priority / Wrong Audience

| Subreddit | Audience | Why Avoid |
|-----------|----------|-----------|
| r/learnprogramming | Beginners | Wrong audience - Result types are intermediate/advanced. Beginners are learning basic TypeScript, not FP patterns. |
| r/AskProgramming | Beginners | Same as above. |
| r/webdev | Web devs | Too broad and noisy. Low signal-to-noise ratio. |

### Explicitly Excluded

| Subreddit | Reason |
|-----------|--------|
| r/javascript | REMOVED. Too broad (2.4M+ subscribers), hostile to TypeScript posts, toxic culture around "JS bad" tribalism. Posts here attract drive-by downvotes and dismissive comments. |
| r/Nestjs_framework | REMOVED. No verified NestJS integration in the library. Listing it implies compatibility that doesn't exist. |

---

## Crisis Response

### If Called Out for Astroturfing

1. **Do not delete the post** - Deletion confirms guilt
2. **Respond immediately and directly** - "Fair call, I'm the library author. Happy to discuss openly."
3. **Do not defensively explain** - Acknowledge the optics
4. **Pivot to genuine engagement** - Answer technical questions, ignore emotional reactions
5. **Do not brigade** - Do not upvoted your own posts or ask others to defend you
6. **If the criticism is valid** - Thank them, apologize if appropriate, iterate on the approach

**Prevention is better than cure.** Build account history organically before any promotional activity.

---

## Strategy

### Old Approach (Don't Do This)
> "Check out our library @deessejs/fp! It does X, Y, Z!"

### New Approach (Do This)
> "Here's a problem I've been wrestling with in TypeScript. Has anyone solved this? Oh, here's what I ended up building..."

**Key principle**: Redditors hate being sold to. They love solving interesting problems together.

---

## Reports Structure

```
reports/reddit/
├── 00-overview.md              # This file
├── 01-subreddits/               # Per-subreddit post templates
│   ├── 01-r-typescript.md
│   ├── 02-r-functionalprogramming.md
│   ├── 03-r-node.md
│   ├── 04-r-reactjs.md
│   ├── 05-r-coding.md
│   ├── 06-r-learnprogramming.md
│   └── 07-r-webdev.md
├── 02-research/                 # Community research
│   ├── 01-pain-points.md
│   ├── 02-community-questions.md
│   └── 03-competitor-analysis.md
└── 03-guidelines/               # How to post
    ├── 01-posting-principles.md
    └── 02-schedule.md
```

---

## Quick Reference: Post Templates

Each subreddit report contains:
- Rules to follow
- Problem-focused post template
- Why this approach works

See `01-subreddits/` directory for detailed per-subreddit guides.

---

## Key Principles

1. **Lead with the problem, not the solution**
2. **Show real code with real pain points**
3. **Ask questions, don't lecture**
4. **Only share the library if people ask**
5. **Be honest about trade-offs**
6. **Engage with every comment**
7. **Build account history first, post library second** (this is the #1 failure mode)

---

*Strategy: Problem-first, solution-second*
*Last updated: 2026-04-10*
