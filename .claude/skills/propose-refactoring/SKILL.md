---
name: propose-refactoring
description: Create a GitHub issue for a refactoring that the user has identified. Use this skill when the user wants to document a refactoring idea they have. Also use when the user says "propose refactoring", "refactor this", "we should refactor X", or "create a refactor issue for X". Example usage: "/propose-refactoring to transform the result type to use classes".
disable-model-invocation: true
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# Propose Refactoring Guide

Creates a GitHub issue for a refactoring idea that the user has identified. The user provides the refactoring to propose, the skill helps document it properly as an issue.

## When to Use

Use when:
- User has identified something that needs refactoring
- User wants to create an issue to track the refactoring
- User says "we should refactor X" or "propose refactoring for Y"

## Example

See [example-issue.md](./example-issue.md) for a complete example of a refactoring issue.

```
User: /propose-refactoring to transform the result type to use classes
Agent: Creates issue "[refactor]: use classes instead of plain result types"
```

For this issue, the body would be:

```markdown
## Why This Refactoring
Using plain string result types makes it difficult to attach metadata...

## Current Situation
Currently, functions return raw strings for errors...

## What Would Change
A class-based result type would enable structured error information...
```

## Process

### Step 1: Understand the Refactoring

Ask the user for clarification if needed:
- What specifically needs to change
- Why this refactoring is needed
- What files are affected (if known)

### Step 2: Analyze Impact

```bash
# If files mentioned, check them
cat path/to/file

# If not known, estimate based on user description
```

### Step 3: Create the Issue

Write body to temporary file first, then use it:

```bash
# Create temporary file with issue body
cat > /tmp/refactor-issue.md << 'EOF'
## Problem
[What is the issue? Be specific about what's wrong.]

## Why It Matters
[What are the consequences of this problem? How does it affect the team, the code, or users?]

## Current vs Expected DX (when applicable)
| Aspect | Current | Expected |
|--------|---------|----------|
| [Aspect 1] | [Current state] | [Expected state] |

## Current Situation
[What is currently there and why it's suboptimal]

## What Would Change
[What the improvement achieves, not how to implement it]

## Code Example (Required)
```language
// Current code that needs improvement
```

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>
EOF

# Create issue using the file
gh issue create -t "[refactor]: <description>" --body-file /tmp/refactor-issue.md -l refactor

# Clean up temp file
rm /tmp/refactor-issue.md
```

**Important**: Always use a temp file, never pipe directly to `--body-file -`. Piping can cause formatting issues with special characters.

### Step 4: Confirm

Report the issue number and link to the user.

## Issue Template

```markdown
## Problem
[What is the issue? Be specific about what's wrong.]

## Why It Matters
[What are the consequences of this problem? How does it affect the team, the code, or users?]

## Current vs Expected DX (when applicable)
```typescript
// Current DX - [description of what's wrong]
function example() {
  // code showing current approach
}
```

```typescript
// Expected DX - [description of the improvement]
function example() {
  // code showing improved approach
}
```

## Current Situation
[What is currently there and why it's suboptimal]

## What Would Change
[What the improvement achieves, not how to implement it]

## Code Example (Required)
```language
// Current code that needs improvement
```
```

**Important**: Always include at least one code block showing the current implementation. This makes the issue concrete and understandable.

When useful, include "Current vs Expected DX" to make the improvement measurable. The issue MUST start by explaining the problem clearly, then state why it matters (consequences), then continue with the rest.

## Quick Reference

```
User proposes:        /propose-refactoring for X to use Y
Create issue:         gh issue create -t "[refactor]: X to use Y" -l refactor
Confirm:              "Created issue #XX"
```

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/create-issue` | Generic issue creation |
| `/commit` | Implement the refactoring later |
| `/rfc` | For larger architectural refactors |