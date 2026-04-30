# The 3 Things to NOT Do

*Ruthless constraints. Non-negotiable.*

---

## 1. Do NOT Claim 500K Weekly Downloads as a Target

### Why

It sets the team up for demoralization. The current library has negligible downloads. Setting a 500K target in 12 months means needing 100x growth. That's not realistic for a v3.0.0 library with no established user base.

**The math:**
- neverthrow: ~1.5M weekly downloads after 7 years
- fp-ts: ~4M weekly downloads after ~10 years
- ts-results: ~168K weekly downloads after 5 years (then abandoned)

**Realistic trajectory for a new entrant:**
- Month 3: 5K-10K weekly
- Month 6: 15K-30K weekly
- Month 12: 50K-100K weekly (if executed well)

### What to Do Instead

Set a **50K weekly downloads target for month 12**. Celebrate hitting **10K in month 3** as a major milestone.

Use 500K only as a "stretch goal" that requires viral adoption (conference talk goes viral, major company adopts, etc.).

---

## 2. Do NOT Spam GitHub Issues of Competitors

### Why

Going to neverthrow's GitHub and posting "use our library instead" is spam. It will backfire:

- Maintainers remember. They will block you.
- The community will call it out on Reddit/HN.
- It damages the reputation before you've built any credibility.

**This is the #1 way to get blacklisted in the TypeScript community.**

### What to Do Instead

Wait for genuine questions like "is this library still maintained?" and answer honestly with @deessejs/fp as an option.

**Example:**
```
Comment on neverthrow issue: "This is still an issue in 2026?"

Your response:
"I faced this same issue. I ended up building @deessejs/fp as an alternative
that has [specific fix]. Happy to answer questions if you're considering switching."
```

Let the market come to you. Organic credibility > spam.

---

## 3. Do NOT Claim "Zero Runtime Dependencies" When You Have Zod

### Why

@deessejs/fp depends on Zod v4 at runtime. Saying "zero runtime dependencies" is misleading because:

- Many users will install Zod for validation
- Zod v4 is not tree-shakable in all cases
- Auditors will flag this as inaccurate

**This will bite you when someone does `npm audit` and finds Zod.**

### What to Do Instead

Use one of these accurate phrasings:

| Instead of... | Say... |
|---------------|--------|
| "Zero dependencies" | "Zero mandatory dependencies" |
| "No dependencies" | "Optional Zod integration for validated errors" |
| "Lightweight" | "2KB core + optional Zod for validation" |

**In `package.json`:**
```json
"description": "TypeScript error handling that actually works. Result, Maybe, Try, and AsyncResult monads with perfect type inference, zero mandatory runtime deps, and React 19 support."
```

---

## Why These Matter

| Rule | Failure Mode |
|------|--------------|
| Don't claim 500K | Team burns out chasing impossible goal |
| Don't spam | Reputation destroyed before launch |
| Don't lie about deps | Enterprise deals lost, trust damaged |

These three rules protect the long-term viability of the project.
