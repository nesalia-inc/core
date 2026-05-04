---
name: create-pr
description: Create GitHub pull requests following Marty conventions. Use this skill when the user asks to create a PR, create a pull request, open a PR, or start a pull request. Also use when the user says things like "I need to create a pull request", "open a PR for my branch", or "create a PR to merge my changes".
disable-model-invocation: false
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash
---

# Create PR Guide (Non-Interactive)

Follow this guide to create GitHub pull requests using `gh pr create`. All operations are command-line only — no interactive editors.

## Branch Hierarchy

```
main <- canary <- feature branches
```

- **main**: No direct push. PR from canary only.
- **canary**: No direct push. PR from feature branches.
- **feature/***: Normal push, PR to canary.

## PR Creation Command

### Standard PR (to canary)

```bash
gh pr create --title "[feat]: description" --body "## Summary

Description of changes

## Test Plan

- [ ] Tests pass
- [ ] Manual testing done

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>" --base canary
```

### PR with Reviewers

```bash
gh pr create --title "[feat]: description" --body "..." --base canary --reviewer username1,username2
```

### PR with Labels

```bash
gh pr create --title "[feat]: description" --body "..." --base canary --label "feature" --label "priority/p1"
```

### PR from Specific Branch

```bash
gh pr create --base canary --head feat/my-feature --title "[feat]: description" --body "..."
```

## PR Body Template

```bash
gh pr create \
  --title "[TYPE]: Title" \
  --body "## Summary
- What this PR does
- Why this change is needed

## Changes Made
- [Change 1]
- [Change 2]

## Test Plan
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual verification completed

## Related Issues
Closes #123

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>" \
  --base canary
```

## Marty PR Title Format

PR titles follow the same format as commits: `[<Type>]: <description>`

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code refactoring |
| `docs` | Documentation |
| `chore` | Maintenance |
| `ci` | CI/CD changes |

## PR Options Reference

```bash
# Title and body
gh pr create -t "Title" -b "Body" --base canary

# With reviewers
gh pr create -t "Title" -b "Body" --base canary --reviewer "@me"

# With labels
gh pr create -t "Title" -b "Body" --base canary --label bug --label priority/p1

# As draft
gh pr create -t "Title" -b "Body" --base canary --draft

# From different branch
gh pr create -t "Title" -b "Body" --base canary --head feature/my-branch

# With milestone
gh pr create -t "Title" -b "Body" --base canary --milestone "v1.0"
```

## Common Workflows

### Create PR After Commit

```bash
# After pushing your branch
git push -u origin HEAD

# Immediately create PR to canary
gh pr create --title "[feat]: add new feature" --body "## Summary

New feature for testing.

## Test Plan
- [ ] Tests pass

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>" --base canary
```

### Create PR with Self-Assignment

```bash
gh pr create -t "[feat]: description" --body "..." --base canary --reviewer "@me"
```

## Quick Reference

```
Create PR to canary:    gh pr create --base canary --title "[type]: description" --body "..."
With reviewers:          gh pr create --base canary -t "..." -b "..." --reviewer user1,user2
With labels:            gh pr create --base canary -t "..." -b "..." --label feature
Draft PR:               gh pr create --base canary -t "..." -b "..." --draft
```

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/commit` | Make commits before PR |
| `/push` | Push branch and create PR |
| `/update-pr` | Update existing PR description |
| `/review-pr` | Request or perform PR review |