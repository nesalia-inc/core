---
name: update-doc
description: Update documentation with a clean, forward-looking approach. Use this skill when asked to update, improve, or modify documentation. Example: "/update-doc src/api.md"
disable-model-invocation: false
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash, Read, Write, Edit
---

# Update Documentation Guide

Updates documentation with a clean, forward-looking approach.

## Context: Documentation is a Final Artifact

Documentation is **not a working draft**. It is a final artifact that will be:

- Published online (GitHub wiki, website, docs)
- Used as a reference for planning
- Shared with new team members
- Used as authoritative guidance

**Therefore, documentation must read as authoritative truth, not as a record of debates or evolution.**

| Documentation is NOT | Documentation IS |
|---------------------|-----------------|
| A changelog | An authoritative guide |
| A debate record | A clear reference |
| A draft | A final artifact |
| Showing how we got here | Showing how things are |

## Core Principle: No Historical Traces

**Documentation is not a changelog.** When updating docs:

- ❌ Don't write: "Previously we did X, now we do Y"
- ❌ Don't write: "Instead of X, we should do Y"
- ❌ Don't write: "This was wrong, now it's correct"
- ✅ Write: "We do Y" (as if it was always the way)

Documentation should present the **current truth**, not the history of how we got there.

## Why This Matters

Documentation will be used by people who need clear answers, not by people tracing how decisions evolved.

| With traces | Without traces |
|-------------|---------------|
| Cluttered, verbose | Clean, readable |
| Shows indecision | Shows confidence |
| Confuses future readers | Clear guidance |
| Preserves debates | Documents decisions |
| Unpublishable as-is | Ready for publication |

## Update Rules

### Rule 1: Overwrite, Don't Append

When updating a section, rewrite it completely. Don't keep old text crossed out or in footnotes.

```
❌ BAD:
We previously used approach X.
Now we use approach Y.

✅ GOOD:
We use approach Y.
```

### Rule 2: Remove Stale Information

If something changed, remove the old information entirely. Don't mark it as "deprecated" or "obsolete" in the docs.

```
❌ BAD:
## Old Method (deprecated)
Use method X for this.

## Current Method
Use method Y for this.

✅ GOOD:
## Method
Use method Y for this.
```

### Rule 3: Don't Acknowledge Previous Mistakes

If you need to change guidance, just present the new guidance as if it was always correct.

```
❌ BAD:
We previously recommended X, but that caused problems,
so now we recommend Y.

✅ GOOD:
We recommend Y for this use case.
```

### Rule 4: Keep Decision Rationale (Optional)

If the reasoning is important for future decisions, you MAY include brief rationale:

```
We use Y because it provides better performance.

(Do not mention what was used before.)
```

## When to Keep Historical Context

**Never preserve decision history in documentation.**

- ❌ "We changed from X to Y because Bob argued..." (decision history - not doc)
- ❌ "This was incorrect in v1.0 but fixed in v1.1" (changelog - not doc)
- ❌ "Previously we did X, now we do Y" (evolution - not doc)

**Only keep if it's a technical distinction relevant to usage:**

- ✅ "Use Y for production; X is only for development" (relevant technical info)
- ✅ "Y is preferred; X is deprecated but supported" (current state)

## Process

### Step 1: Read the Current Document

```bash
cat document.md
```

### Step 2: Understand the New Information

What needs to change? What is the new truth?

### Step 3: Rewrite the Section

Rewrite the relevant section completely with the new information. Do not:
- Cross out old text
- Add "previously" or "now" statements
- Keep deprecated sections marked as deprecated

### Step 4: Verify Readability

Read the updated document and ask:
- Does it read as **authoritative truth**?
- Could this be **published as-is**?
- Would a new team member understand **how things work now**?

If not, rewrite until it does.

## Example

### Original

```markdown
## Authentication

We use JWT tokens for authentication.
```

### Update (need to switch to OAuth)

```
❌ BAD:
We previously used JWT tokens for authentication.
Now we use OAuth 2.0 because JWT had security issues.

✅ GOOD:
## Authentication

We use OAuth 2.0 for authentication.
```

### After Multiple Updates

```
❌ BAD:
## Authentication

v1.0: We used API keys.
v2.0: We switched to JWT tokens.
v3.0: We now use OAuth 2.0.

✅ GOOD:
## Authentication

We use OAuth 2.0 for authentication.
```

## Quick Reference

```
When updating docs:
→ Read current version
→ Identify what needs to change
→ Rewrite section completely (no traces)
→ Verify reads cleanly

Never write:
→ "Previously..."
→ "Instead of..."
→ "Now we..."
→ "Deprecated: ..."
→ "Old version: ..."
```

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/propose-refactoring` | Propose documentation improvements |
| `/improve-doc` | Improve existing documentation |
