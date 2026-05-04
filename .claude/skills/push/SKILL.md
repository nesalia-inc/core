---
name: push
description: Guide the push process following Marty conventions - branch pushing, force push safety, remote management, and PR creation. Make sure to use this skill whenever the user asks to push, push changes, push to remote, git push, force push, or create a PR. Also use it when the user says things like "push my code", "push to origin", "I need to push changes", or "create a pull request".
disable-model-invocation: false
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash
---

# Push Process Guide (Non-Interactive)

Follow this guide to push code and create pull requests following Marty's workflow. All operations are command-line only — no interactive editors.

## Pre-Push Checklist

Before pushing, ensure:

```bash
# 1. Verify current branch and status
git status

# 2. Check if branch exists on remote
git branch -vv

# 3. Review commits to be pushed (against canary, not main)
git log --oneline origin/canary..HEAD
```

## Push Commands

### Standard Push (New Branch)

```bash
git push -u origin HEAD
```

### Push to Update Existing Branch

```bash
git push
```

### Push with Upstream Setting

```bash
git push --set-upstream origin feat/my-feature
```

## Force Push

**Use only when necessary** — typically for:
- Amending commits that haven't been reviewed
- Rebasing your own feature branches
- Cleaning up WIP commits before PR review

```bash
git push --force-with-lease
```

**Why `--force-with-lease` instead of `--force`:**
- Refuses to push if someone else pushed to the branch
- Safer for shared branches
- Prevents accidental overwriting of others' work

**When NOT to force push:**
- Main/master branches
- Shared branches with active collaboration
- After PR has been approved and is pending merge

## Remote Management

### Check Remotes

```bash
git remote -v
```

### Add Remote

```bash
git remote add origin https://github.com/owner/repo.git
```

### Update Remote URL

```bash
git remote set-url origin https://github.com/owner/repo.git
```

## Branch Hierarchy

```
main <- canary <- feature branches
```

| Branch | Purpose | Push |
|--------|---------|------|
| `main` | Production-ready, always deployable | **BLOCKED: No direct push. Must use PR from canary.** |
| `canary` | Integration testing before main | **BLOCKED: No direct push. Must use PR from feature branches.** |
| `feature/*` | Development work | Normal push allowed |

### Important: Direct Push is Blocked

- **main**: Push directly is blocked. You MUST create a PR.
- **canary**: Push directly is blocked. You MUST create a PR.
- **feature/***: Normal push allowed.

Always use PRs for main and canary branches.

## Creating Pull Requests (Non-Interactive)

After pushing, create PR to `canary` using `gh`:

```bash
# Create PR to canary (normal flow)
gh pr create --title "feat(scope): description" --body "Description

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>" --base canary

# Create PR from specific branch
gh pr create --base canary --head feat/my-feature

# Create PR with reviewer
gh pr create --base canary --reviewer username1,username2
```

### Direct to Main (Hotfix Only)

```bash
# Only for trivial hotfixes
gh pr create --title "fix(scope): quick fix" --body "..." --base main
```

## Canary to Main Workflow

After verifying on `canary`:

```bash
# 1. Switch to main and pull latest
git checkout main && git pull

# 2. Merge canary to main
git merge origin/canary

# 3. Push main
git push

# 4. Switch back to canary to continue work
git checkout canary
```

### When NOT to Merge to Main

- CI is failing on `canary`
- Major issues discovered during canary testing
- Waiting for approval or sign-off

### PR Body Template

```
## Summary
- What this PR does
- Why this change is needed

## Test Plan
- [ ] Test A
- [ ] Test B

## Related Issues
Closes #123

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>
```

## Handling Push Conflicts

### When Push is Rejected

If push is rejected due to divergence:

```bash
# Fetch and rebase onto latest
git fetch origin && git rebase origin/main

# Or merge (if you prefer a merge commit)
git fetch origin && git merge origin/main
```

### Resolve Conflicts

```bash
# After rebase/merge, resolve conflicts
# Edit conflicted files, then:
git add <resolved-file>
git rebase --continue
# or git merge --continue
```

## Push Verification

After push, verify:

```bash
# Verify remote branch exists
git branch -r

# Verify commit is on remote
git log --oneline -1 origin/HEAD

# Check GitHub status (if using gh)
gh pr status
```

## Common Mistakes to Avoid

1. **Force pushing main/shared branches**: Never do this
2. **Pushing without PR for non-trivial changes**: Always use branches for features/fixes
3. **Missing `-u` on first push**: Ensures tracking is set up correctly
4. **Not verifying push**: Always confirm the push succeeded

## Quick Reference

```
Push new branch:         git push -u origin HEAD
Push update:             git push
Force with lease:        git push --force-with-lease
Create PR to canary:     gh pr create --base canary --title "feat: ..."
Merge canary to main:    git checkout main && git merge origin/canary && git push
Check status:            git status && git branch -vv
```

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/commit` | Before push, to make proper commits |
| `/sync` | To sync branch with latest canary |
| `/setup-canary` | More about the canary workflow |