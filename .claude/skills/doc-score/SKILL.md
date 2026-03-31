---
name: doc-score
description: Score documentation for user-friendliness. Use when evaluating documentation quality, auditing docs readability, or when asked "how good is our documentation?". Evaluates clarity, completeness, structure, examples, navigation, and accessibility. Supports --path, --report, --categories flags.
disable-model-invocation: true
allowed-tools: Read,Grep,Glob,Bash
---

# Documentation User-Friendliness Score Skill

A skill that evaluates documentation quality from a user's perspective and provides actionable scores.

## Quick Usage

```bash
/doc-score
/doc-score --path=apps/web
/doc-score --report
/doc-score --categories=clarity,examples,navigation
```

## Overview

This skill scores documentation on user-friendliness dimensions:

- **Clarity** - Is it easy to understand?
- **Completeness** - Are all necessary parts covered?
- **Structure** - Is it well organized?
- **Examples** - Are there working examples?
- **Navigation** - Can users find what they need?
- **Accessibility** - Is it accessible to different audiences?
- **Tone** - Is it friendly and helpful?
- **Visual** - Does it use diagrams, code blocks?

## Flags

| Flag | Description |
|------|-------------|
| `--path=<dir>` | Documentation path to score (default: apps/web) |
| `--report` | Generate detailed scoring report |
| `--categories=<cats>` | Comma-separated: all,clarity,completeness,structure,examples,navigation,accessibility,tone,visual |
| `--format=<type>` | Output format: markdown, json |

## Scoring Dimensions

### 1. Clarity (20%)

Measures how easy documentation is to understand.

**AI Bias Warning:** AI agents tend to minimize context and jump straight to code. But too many paragraphs without context is also bad. The sweet spot is **context before code**.

| Check | Weight | Description |
|-------|--------|-------------|
| Context before code | 5 | Explains WHY before showing HOW |
| Jargon defined | 4 | Technical terms are explained |
| Simple language | 4 | Uses simple, direct language |
| Balanced paragraphs | 3 | 2-4 sentences per paragraph (not 1, not 20) |
| Clear headings | 4 | Headings describe content |

### Balance Guidelines

| Anti-Pattern | Problem | Score Penalty |
|--------------|---------|---------------|
| "Here's code" + code block | No context about what/why | -3 |
| Walls of text | Overwhelming, no visual breaks | -2 |
| Code-first without intro | Users don't know what they're looking at | -2 |
| 1 sentence paragraphs | Artificial fragmentation | -1 |

| Good Pattern | Description | Score Bonus |
|--------------|-------------|-------------|
| **Context -> Code -> Explanation** | 1-2 sentences intro, code block, 1-2 sentences explaining | +2 |
| **3-4 sentence paragraphs** | Enough context, not overwhelming | +1 |
| **"Here's how it works"** | Clear transition to code | +1 |

**Scoring Criteria:**

| Score | Description |
|-------|-------------|
| 18-20 | Exceptional balance: context-rich, clear transitions, appropriate length |
| 14-17 | Good clarity, minor improvements needed |
| 10-13 | Either too sparse (AI-slope) or too dense (wall-of-text) |
| 5-9 | Lacks context AND has too many paragraphs |
| <5 | Very confusing or completely unstructured |

### The What, Why, How Principle

Every API, function, library, or framework exists as **a solution to a problem**. Good documentation explains the problem before presenting the solution.

| Question | Description | Example |
|----------|-------------|---------|
| **WHAT** | What is this thing? | "A function that authenticates users" |
| **WHY** | Why does this exist? What problem does it solve? | "Manual token handling leads to security vulnerabilities" |
| **HOW** | How do I use it? | Code example + explanation |

### The Problem-Solution Pattern

Every element in a package/framework was created because **someone had a problem**. The documentation should make this explicit:

```
## Before (Bad Documentation)

### useAuth()

Authenticates users and manages tokens.

```tsx
const { user } = useAuth();
```

---

## After (Good Documentation)

### Why does this exist?

**Problem:** Developers were manually storing JWT tokens in localStorage.
This caused security issues:
- Tokens never expired
- XSS attacks could steal tokens
- No automatic refresh

**Solution:** `useAuth()` handles token securely:
- Stores tokens in httpOnly cookies (not accessible to JavaScript)
- Auto-refreshes before expiry
- Clears tokens on logout

### How do I use it?

```tsx
const { user, isLoading } = useAuth();
```

**Result:** Secure auth without thinking about token management.
```

### Scoring for Problem-Solution

| Aspect | Weight | Description |
|--------|--------|-------------|
| Problem stated | 5 | Clear explanation of the issue this solves |
| Solution explained | 5 | How the API/library solves it |
| Connection clear | 5 | User can see why this is better than alternatives |

| Missing | Score Impact |
|---------|--------------|
| No problem stated | -5 |
| Problem unclear | -3 |
| No alternative mentioned | -2 |
| Solution doesn't address problem | -4 |

### Why This Matters

| Anti-Pattern | Score Impact | Why |
|--------------|-------------|-----|
| Only explains WHAT ("This is the `login()` function") | -3 to Clarity | Users don't know when to use it |
| Only explains HOW ("Call `login()` like this...") | -2 to Clarity | Users don't understand the purpose |
| Skips WHY | -2 to Completeness | Missing crucial context for decision-making |

### Good Documentation Structure

```markdown
## Authentication Token (`useAuth`)

### What is it?
A hook that manages authentication state and provides login/logout methods.

### Why use it?
**Instead of** manually storing tokens in localStorage and checking expiry,
this hook handles token refresh automatically and prevents common security mistakes.

### How do I use it?

```tsx
const { user, login, logout, isLoading } = useAuth();
```

- `user`: Current user object or null
- `login(credentials)`: Authenticates and stores token
- `logout()`: Clears session and token
- `isLoading`: True during token refresh

**Note:** Automatically refreshes tokens 5 minutes before expiry.
```

### Scoring for What/Why/How

| Dimension | Score | Criteria |
|-----------|-------|----------|
| **What** | 0-5 | Clearly describes what the thing is |
| **Why** | 0-5 | Explains when and why to use it vs alternatives |
| **How** | 0-5 | Provides working examples with explanations |
| **Combined** | 0-15 | Added to Clarity dimension |

| Combined Score | Grade | Description |
|---------------|-------|-------------|
| 13-15 | Excellent | All three answered clearly |
| 10-12 | Good | All three present, could be clearer |
| 6-9 | Okay | Missing one dimension |
| <6 | Poor | Only describes what, no context |

### 2. Completeness (20%)

Measures whether all necessary information is present.

| Check | Weight | Description |
|-------|--------|-------------|
| Prerequisites listed | 4 | What's needed before starting |
| All parameters documented | 5 | No missing parameters |
| Error cases covered | 4 | Error codes and solutions |
| FAQs included | 4 | Common questions answered |
| Related topics linked | 3 | Cross-references provided |

**Scoring Criteria:**

| Score | Description |
|-------|-------------|
| 18-20 | Fully complete, nothing missing |
| 14-17 | Mostly complete, minor gaps |
| 10-13 | Several gaps |
| 5-9 | Significant missing information |
| <5 | Barely usable |

### 3. Structure (15%)

Measures organization and logical flow.

| Check | Weight | Description |
|-------|--------|-------------|
| Logical ordering | 4 | Follows natural learning order |
| Consistent formatting | 4 | Same format throughout |
| Table of contents | 3 | Easy to navigate |
| Summary/recap | 2 | Key points recap |
| Breadcrumbs | 2 | Clear location markers |

**Scoring Criteria:**

| Score | Description |
|-------|-------------|
| 14-15 | Excellent organization |
| 11-13 | Well structured |
| 8-10 | Somewhat organized |
| 5-7 | Difficult to follow |
| <5 | Chaotic |

### 4. Examples (20%)

Measures presence and quality of examples.

**AI Bias Warning:** AI agents often show code without expected output. Users need to know what "success" looks like.

| Check | Weight | Description |
|-------|--------|-------------|
| Working code examples | 6 | Examples run without errors |
| Multiple examples | 4 | Different use cases |
| Realistic scenarios | 4 | Not toy examples |
| Expected output shown | 3 | Results demonstrated |
| Copy-paste ready | 3 | Easy to use |

### Good Example Structure

```markdown
## Getting User Data

To fetch a user by ID, call the `/api/users/:id` endpoint:

```javascript
const response = await fetch('/api/users/123');
const user = await response.json();
```

Expected response:

```json
{
  "id": "123",
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Note:** Returns 404 if the user doesn't exist.
```

**Why expected output matters:**
- Users verify their implementation works
- Reduces support questions
- Shows error cases too

**Scoring Criteria:**

| Score | Description |
|-------|-------------|
| 18-20 | Excellent examples with expected output and notes |
| 14-17 | Good examples with minor gaps |
| 10-13 | Some examples, missing output/errors |
| 5-9 | Few examples or broken code |
| <5 | No examples |

### 5. Navigation (10%)

Measures how easy it is to find information.

| Check | Weight | Description |
|-------|--------|-------------|
| Clear URL structure | 3 | Logical paths |
| Search functionality | 3 | Can search content |
| Internal links | 2 | Related content linked |
| Anchor links | 2 | Can link to sections |

**Scoring Criteria:**

| Score | Description |
|-------|-------------|
| 9-10 | Excellent navigation |
| 7-8 | Good navigation |
| 5-6 | Some navigation issues |
| 3-4 | Hard to find things |
| <3 | Can't navigate |

### 6. Accessibility (5%)

Measures accessibility for different audiences.

| Check | Weight | Description |
|-------|--------|-------------|
| Beginner friendly | 2 | Usable by newcomers |
| Multiple languages | 1 | Links to translations |
| Print friendly | 1 | Renders well in print |
| Screen reader friendly | 1 | Good structure for a11y |

**Scoring Criteria:**

| Score | Description |
|-------|-------------|
| 5 | Fully accessible |
| 4 | Minor issues |
| 3 | Some accessibility barriers |
| 1-2 | Significant barriers |
| 0 | Not accessible |

### 7. Tone (5%)

Measures helpfulness and friendliness.

| Check | Weight | Description |
|-------|--------|-------------|
| Helpful tone | 2 | Encouraging, supportive |
| Action-oriented | 1 | Tells users what to do |
| No condescending | 1 | Respectful language |
| Up to date | 1 | Current information |

**Scoring Criteria:**

| Score | Description |
|-------|-------------|
| 5 | Excellent tone |
| 4 | Good tone |
| 3 | Neutral tone |
| 2 | Somewhat unhelpful |
| 1 | Poor tone |

### 8. Visual Elements (5%)

Measures use of visual aids.

| Check | Weight | Description |
|-------|--------|-------------|
| Code blocks | 2 | Syntax highlighted |
| Diagrams | 1 | Visual explanations |
| Tables | 1 | Data organized |
| Warnings/notes | 1 | Callout boxes |

**Scoring Criteria:**

| Score | Description |
|-------|-------------|
| 5 | Excellent visuals |
| 4 | Good visuals |
| 3 | Some visuals |
| 2 | Minimal visuals |
| 1 | No visuals |

## Overall Score Calculation

```
Overall Score = (Clarity x 0.20) + (Completeness x 0.20) + (Structure x 0.15) +
                (Examples x 0.20) + (Navigation x 0.10) + (Accessibility x 0.05) +
                (Tone x 0.05) + (Visual x 0.05)
```

## Report Format

```markdown
# Documentation User-Friendliness Score

## Overall Score: 72/100 (Good)

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Clarity | 16/20 | 20% | 16.0 |
| Completeness | 14/20 | 20% | 14.0 |
| Structure | 12/15 | 15% | 12.0 |
| Examples | 12/20 | 20% | 12.0 |
| Navigation | 7/10 | 10% | 7.0 |
| Accessibility | 4/5 | 5% | 4.0 |
| Tone | 4/5 | 5% | 4.0 |
| Visual | 3/5 | 5% | 3.0 |

**Grade: B+ (Good)**

---

## Dimension Breakdown

### Clarity: 16/20 (Excellent)

#### Strengths
- Technical terms are explained
- Simple, direct language
- Clear section headings

#### Improvements
- Could break up longer paragraphs
- Some jargon could be simplified

#### Files Affected
- apps/web/api/auth.md - Good clarity
- apps/web/getting-started.md - Could improve

---

### Completeness: 14/20 (Good)

#### Missing Information
- Error code 429 not documented
- Missing FAQ section
- Prerequisites not listed for advanced guide

#### Files Needing Work
- apps/web/api/users.md - Missing error codes
- apps/web/advanced.md - No prerequisites

---

### Examples: 12/20 (Good)

#### Strengths
- Working code examples
- Realistic scenarios

#### Improvements
- Output not shown for examples
- Some examples are outdated

#### Files Needing Work
- apps/web/auth/login.md - Add expected output
- apps/web/api/payments.md - Update to current API version

---

### Structure: 12/15 (Good)

#### Strengths
- Logical ordering
- Consistent formatting

#### Improvements
- Missing table of contents
- No summary sections

---

## Score Distribution

| Grade | Score | Description |
|-------|-------|-------------|
| A+ | 95-100 | Exceptional |
| A | 90-94 | Excellent |
| A- | 85-89 | Very Good |
| B+ | 80-84 | Good |
| B | 75-79 | Good |
| B- | 70-74 | Good |
| C+ | 65-69 | Average |
| C | 60-64 | Below Average |
| D | 50-59 | Poor |
| F | <50 | Failing |

---

## Recommendations

### High Priority (Score < 12/20 in dimension)

1. **Completeness** - Add error codes documentation
   - Files: api/users.md, api/payments.md
   - Effort: 2 hours

2. **Examples** - Update outdated examples
   - Files: auth/login.md
   - Effort: 1 hour

### Medium Priority (Score 12-14/20)

3. **Structure** - Add table of contents
   - Files: getting-started.md, api/*.md
   - Effort: 30 minutes

4. **Visual** - Add more diagrams
   - Files: architecture.md, flow.md
   - Effort: 1 hour

---

## Per-File Scoring

| File | Clarity | Complete | Structure | Examples | Navigation | Access | Tone | Visual | Total |
|------|---------|----------|-----------|----------|------------|--------|-------|--------|-------|
| getting-started.md | 18 | 16 | 13 | 15 | 8 | 4 | 5 | 4 | 83 |
| api/auth.md | 17 | 15 | 14 | 16 | 9 | 5 | 4 | 4 | 84 |
| api/users.md | 14 | 10 | 12 | 14 | 8 | 4 | 4 | 3 | 69 |
| tutorial.md | 16 | 14 | 11 | 18 | 7 | 4 | 5 | 3 | 78 |

---

## Action Plan

### Quick Wins (< 1 hour)

1. Add missing error codes to api/users.md
2. Update code examples to show expected output
3. Add table of contents to main pages

### Medium Effort (1-4 hours)

4. Create FAQ section
5. Add prerequisites to advanced guides
6. Update outdated examples

### Long-term (1+ days)

7. Add diagrams to complex concepts
8. Create video tutorials
9. Add interactive examples
```

## Scoring Process

### Stage 1: Document Inventory

```bash
# List all documentation files
find apps/web -name "*.md" -type f

# Count total docs
find apps/web -name "*.md" | wc -l

# Get total word count
find apps/web -name "*.md" -exec wc -w {} + | tail -1
```

### Stage 2: Automated Checks

```bash
# Check for code blocks
grep -r "```" apps/web --include="*.md" | wc -l

# Check for headings
grep -rh "^#" apps/web --include="*.md" | sort | uniq

# Check for internal links
grep -rh "](/" apps/web --include="*.md" | wc -l

# Check for TODOs
grep -rh "TODO\|FIXME" apps/web --include="*.md"
```

### Stage 3: Content Analysis

Read and evaluate each document:

1. **First read**: Get overall impression
2. **Second pass**: Score each dimension
3. **Third pass**: Note specific issues
4. **Aggregate**: Calculate scores

### Stage 4: Report Generation

Compile findings into structured report.

## Senior Advice

> "Documentation is user experience. Bad docs are as harmful as bad code."

> "If users have to ask questions to understand docs, the docs have failed."

> "Perfect documentation doesn't exist. Score where you are and improve incrementally."

> "The best docs are written by those who remember being confused."

### AI Documentation Bias

AI agents (including Claude) have a tendency to:

| Anti-Pattern | Why It's Bad | Score Impact |
|--------------|--------------|-------------|
| "Here's the code" then 50 lines | No context, users lost | -3 to Clarity |
| 1-sentence paragraphs everywhere | Artificial, chat-like | -1 to Structure |
| Code-first, no intro | What problem does this solve? | -2 to Clarity |
| 20-line paragraphs | Walls of text, intimidating | -2 to Clarity |

**The Sweet Spot:**
```
## Authentication

Before making authenticated requests, you need a valid token.
Tokens are obtained via the /auth/login endpoint.

```javascript
const token = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

The response includes a 1-hour validity token. Include it in the
Authorization header for subsequent requests.
```

**Why this works:**
1. **Context first**: What problem does this solve?
2. **Then code**: Minimal, copy-paste ready
3. **Then explanation**: What happens next, important caveats

> "AI should explain the WHY before showing the HOW. Code without context is just noise."

### The What, Why, How Principle

> "Good documentation answers three questions: **What** is this? **Why** would I use it? **How** do I use it? Documents that only explain HOW are tutorials. Documents that explain WHY help users make decisions."

| Missing Element | Score Impact | Result |
|---------------|-------------|---------|
| Only WHAT | -4 | "It's a function" - useless without context |
| WHAT + HOW | -2 | "It works but I don't know when to use it" |
| WHAT + WHY + HOW | 0 | "I understand and can decide if this fits my needs" |

> "Users don't just need to know how to use something - they need to know if they **should** use it."

### Every API Solves a Problem

> "Every function, library, or framework exists because **someone had a problem**. If your documentation doesn't explain what problem this solves, users will misuse it or ignore it entirely."

| Documentation Type | What It Explains | Score Impact |
|-----------------|------------------|-------------|
| **Reference Docs** | WHAT + HOW (just describes) | Incomplete |
| **Tutorial Docs** | WHAT + HOW + steps | Missing decision context |
| **Problem-Solution Docs** | WHAT + WHY (problem) + HOW (solution) | Complete |

**Example:**
```
## useCallback

WHAT: A React hook that memoizes functions.

WHY: Without it, functions recreated on every render cause child components
to re-render unnecessarily, hurting performance.

HOW: Wrap your callback:
const handleClick = useCallback(() => doSomething(a), [a]);
```

> "Reference docs tell you what something does. Good docs tell you **why it exists**."

## Grade Interpretation

| Grade | Score | Action |
|-------|-------|--------|
| A+/A/A- | 85+ | Maintain quality |
| B+/B | 75-84 | Good, minor improvements |
| B-/C+ | 65-74 | Address gaps |
| C/C- | 50-64 | Significant work needed |
| D/F | <50 | Major overhaul required |

## Additional Resources

- For documentation templates, see [templates.md](../doc-coverage/templates.md)
- For writing guidelines, see [writing-guide.md](../doc-coverage/writing-guide.md)
