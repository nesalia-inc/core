---
name: commit
description: Guide the commit process following Marty conventions - conventional commits, branch strategy, and PR workflow. Make sure to use this skill whenever the user asks to commit, make a commit, create a commit message, push changes, stage files, or run any git commit-related command. Also use it when the user says things like "commit this", "I need to push my changes", "stage my files", or "what should my commit message say?". This skill is especially useful when the user is unsure about format, branch naming, or how to structure their commit message.
disable-model-invocation: false
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash
---

# Commit Process Guide (Non-Interactive)

Follow this guide to make commits that integrate with Marty's workflow and changelog system. All operations are command-line only — no interactive editors.

## Commit Message Format

All commits MUST use **Conventional Commits** format:

```
<type>(<scope>): <description>

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>
```

### Type Categories

| Type | When to Use | Appears in Changelog |
|------|-------------|---------------------|
| `feat` | New feature | Yes (Features section) |
| `fix` | Bug fix | Yes (Bug Fixes section) |
| `docs` | Documentation changes | Yes (Documentation section) |
| `refactor` | Code refactoring | Yes (Code Refactoring section) |
| `perf` | Performance improvement | Yes (Performance Improvements section) |
| `test` | Adding or updating tests | No |
| `chore` | Maintenance, tooling | No |
| `style` | Formatting, no code change | No |
| `ci` | CI/CD changes | No |

### Scope (Optional but Recommended)

**Approved scopes**: `skills`, `docs`, `ci`, `agents`, `auth`, `api`, `cli`, `config`, `deps`, `other`

If your change doesn't fit, omit the scope.

### Description Rules

- Use imperative mood: "add" not "added" or "adds"
- Lowercase first letter, no period at end
- Under 72 characters

### All Commits MUST Have a Body/Description

**Every commit requires a body text after the subject line.** The subject alone is not sufficient.

- Provide context: WHY was this change made?
- Explain WHAT changed and why it was necessary
- Mention any relevant links (issues, PRs, RFCs)
- Describe the impact or benefit

**Minimum acceptable body:**
```
feat(auth): add refresh token rotation

Adds automatic token refresh before expiration.
```

**Good commit with detailed description:**
```
feat(auth): add refresh token rotation

- Implements silent refresh 5 minutes before expiry
- Uses refresh token from secure HttpOnly cookie
- Updates access token without page reload
- Handles refresh failures gracefully with re-auth

Closes #45
```

## Branch Hierarchy

```
main <- canary <- feature branches
```

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production-ready, always deployable | **BLOCKED: No direct push. Must use PR from canary.** |
| `canary` | Integration testing before main | **BLOCKED: No direct push. Must use PR from feature branches.** |
| `feature/*` | Development work | No restrictions |

### Important: Direct Push is Blocked

- **main**: Push directly is blocked by branch protection. You MUST create a PR from canary.
- **canary**: Push directly is blocked by branch protection. You MUST create a PR from feature branches.
- **feature/***: Normal push allowed for development.

### When to Create a Branch

| Change Type | Branch Required? | Merge Destination |
|-------------|-------------------|-------------------|
| Hotfix (1-liner, trivial) | No — commit directly on main | main |
| Bug fix (non-trivial) | Yes | canary |
| Small/Large feature | Yes | canary |
| Refactor (major) | Yes | canary |
| Docs only | Yes | canary |

### Branch Naming

```
<type>/<short-description>
```

### Canary Workflow

All non-trivial changes follow this path:

```
feature/xyz → canary → main
```

1. Create feature branch from `canary`
2. Make commits with descriptions
3. Push and create PR to `canary`
4. After CI passes and review, merge to `canary`
5. Verify on `canary` (staging/testing)
6. When `canary` is stable, merge `canary` → `main`

## Non-Interactive Commit Workflow

### Full Workflow (Single Command)

```bash
# Complete workflow: create branch, commit, push
git checkout -b feat/my-feature && git add -A && git commit -m "feat(scope): description

Co-Authored-By: \${GIT_AUTHOR_EMAIL:-martyy-code <nesalia.inc@gmail.com>}" && git push -u origin HEAD
```

### Step-by-Step Commands

**1. Create branch:**
```bash
git checkout -b <type>/<short-description>
```

**2. Stage all changes:**
```bash
git add -A
```

**3. Commit (single line, no editor):**
```bash
git commit -m "feat(skills): add new feature

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

**4. Push:**
```bash
git push -u origin HEAD
```

### Quick Commit Template

Copy this pattern:
```bash
git commit -m "<type>(<scope>): <description>

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

## Fixup (Non-Interactive)

After push, use `--fixup` for clean history without interactive rebase:

```bash
# Mark as fixup of a specific commit
git commit --fixup=<commit-hash> -m "fix(scope): correct issue

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"

# Later, autosquash all fixups
git rebase -i --autosquash HEAD~N
```

**Note**: For automated workflows, prefer direct commits over fixup to avoid interactive rebase.

## Amend (Non-Interactive)

```bash
# Amend last commit message or add forgotten changes
git add -A && git commit --amend --no-edit
```

**Warning**: Only amend commits that haven't been pushed to shared branches.

## Stashing (Switching Contexts)

If you need to switch branches or set aside changes temporarily:

```bash
# Save work in progress
git stash push -m "work in progress on feature X"

# Later, restore work
git stash pop

# List stashes
git stash list
```

## When Nothing to Commit

If `git status` shows no changes:
- Verify with `git diff` (untracked files won't show here)
- Use `git log --oneline -3` to confirm you're on the right branch
- If files are untracked, you need to `git add` them first before committing

## Breaking Changes

```bash
git commit -m "feat(auth)!: change token format

BREAKING CHANGE: Token payload structure changed.
Users must re-authenticate.

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

## Commit Message Examples

**Feature:**
```bash
git commit -m "feat(auth): add refresh token rotation

- Supports staging and production targets
- Runs pre-deployment checks
- Creates deployment PR for review

Closes #45
Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

**Bug Fix:**
```bash
git commit -m "fix(auth): correct token refresh race condition

When multiple requests hit the token refresh endpoint
simultaneously, only one was being processed.
Now uses mutex lock to ensure single refresh.

Fixes #123
Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

**Refactor:**
```bash
git commit -m "refactor(agents): extract memory module

Extracted memory persistence logic to separate module for:
- Easier testing
- Reusability across agents
- Clearer separation of concerns

No functional changes.
Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

**Chore:**
```bash
git commit -m "chore(deps): update dependencies to latest versions

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

## Common Mistakes to Avoid

1. **No interactive editors**: Always use `-m` flag, never let git open an editor
2. **Missing Co-Authored-By**: Every commit MUST include it
3. **Wrong type**: Don't use `feat` for chore work
4. **Vague messages**: "update", "fix bug" are not acceptable
5. **Missing reference**: Link to issue/RFC in footer

## Pre-Commit Validation

Before committing, run:
```bash
# Check current state
git status

# View diff of staged changes
git diff --cached
```

## Quick Reference

```
Format: git commit -m "<type>(<scope>): <desc>

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"

Types:    feat | fix | docs | refactor | perf | test | chore | style | ci
Scopes:   skills | docs | ci | agents | auth | api | cli | config | deps | other

Example:
git commit -m "feat(auth): add OAuth2 support

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>"
```

## Integration with Changelog

Commits using conventional format are automatically parsed by the changelog GitHub Action on merge to main. Write clear, conventional commits — the automated system handles CHANGELOG.md.