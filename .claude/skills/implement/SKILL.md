---
name: implement
description: Implement a GitHub issue. Creates a branch, reads the issue, implements the changes with atomic commits using /commit skill. Use this after /is-issue-ready confirms the issue is ready. Example: "/implement 45"
disable-model-invocation: false
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# Implement Issue Guide

Implements a GitHub issue by reading its description, making the necessary changes, and committing them with atomic commits.

## CRITICAL: Use Skills for Every Change

| Skill | When to Use |
|-------|-------------|
| `/commit` | **Every single commit** |
| `/unit-tests` | Writing and running tests |

**Never commit directly without using `/commit` skill.**

## Step 1: Create Branch

```bash
git checkout -b fix/<issue-number>-<short-description>
# OR for features:
git checkout -b feat/<issue-number>-<short-description>
```

Branch naming:
- `fix/<number>-<short-desc>` for bugs
- `feat/<number>-<short-desc>` for features

## Step 2: Read the Issue

```bash
gh issue view <number> --json title,body,labels
```

Extract from the issue:
- **Description** - What needs to be changed
- **Acceptance Criteria** - How to verify the fix works
- **Labels** - Type (bug, feature, etc.) to guide implementation

## Step 3: Implement with Atomic Commits

**IMPORTANT**: Make atomic commits. Each commit should:
- Be self-contained (can be reverted independently)
- Have a single logical purpose
- Pass tests

### Implementation Process

For each logical change:

1. **Make the code change**
2. **Write tests** (use `/unit-tests` skill)
3. **Run tests** to verify
4. **Commit using `/commit` skill**

### Commit Pattern

```bash
# For each atomic change:
git add <files>
/commit "<type>(<scope>): <description>

[What changed and why]

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

### Type to Use

| If issue type is | Use commit type |
|------------------|-----------------|
| `bug` | `fix` |
| `feature` | `feat` |
| `enhancement` | `feat` |
| `refactor` | `refactor` |
| `test` | `test` |
| `docs` | `docs` |
| `chore` | `chore` |

## Step 4: Push Branch

```bash
git push -u origin HEAD
```

## Example Workflow

```
/implement 45

Issue #45: "Login fails with special characters in password"
Labels: [bug, priority/p1, effort/s, area/auth, status/triaged]

Creating branch fix/45-special-char-login...

Reading issue description...

Acceptance criteria:
- Login works with special characters in password
- Error message shown for invalid chars

Implementing fix...

Commit 1: fix(auth): add validation for special chars in password

- Added isValidPassword() helper
- Used in login flow before authentication

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>

Running tests...

✓ Tests pass.

Commit 2: test(auth): add tests for password validation

- Tests for valid special characters
- Tests for invalid special characters
- Edge case tests

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>

✓ Tests pass.

Pushing branch...

✓ Branch pushed: origin/fix/45-special-char-login

Done. Issue #45 implementation complete.
```

## Multi-Commit Example

For a larger issue requiring multiple changes:

```
/implement 45

Issue #45: "Token refresh race condition"
Labels: [bug, priority/p1, effort/m, area/auth, status/triaged]

Creating branch fix/45-token-refresh...

Implementing fix with atomic commits...

Commit 1: fix(auth): add mutex lock for token refresh

- Added refreshLock to prevent concurrent refresh
- Uses async mutex pattern

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>

✓ Tests pass.

Commit 2: fix(auth): handle refresh failure gracefully

- Added retry logic with exponential backoff
- Updated error context for debugging

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>

✓ Tests pass.

Commit 3: test(auth): add tests for token refresh

- Tests for concurrent refresh scenario
- Tests for refresh failure retry

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>

✓ Tests pass.

Pushing branch...

✓ Branch pushed.
```

## Quick Reference

```
/implement <number>
→ Verify issue is ready (/is-issue-ready)
→ Create branch
→ Read issue
→ Implement with atomic commits (/commit)
→ Run tests (/unit-tests)
→ Push
```

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/is-issue-ready` | **Run first** - verify issue is ready |
| `/commit` | **Every commit** - atomic commits |
| `/unit-tests` | Writing and running tests |
| `/create-pr` | After implement - create PR |
