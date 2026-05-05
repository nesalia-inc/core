---
name: create-issue
description: Create GitHub issues following Marty conventions. Use this skill when the user asks to create an issue, file an issue, report a bug, request a feature, or open an issue on GitHub. Also use it when the user says things like "create a ticket", "log an issue", or "file a bug report".
disable-model-invocation: false
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash
---

# Create Issue Guide (Non-Interactive)

Follow this guide to create GitHub issues using `gh issue create`. All operations are command-line only — no interactive editors.

## Marty Issue Title Format

All issue titles MUST use the format: `[<Type>]: <Title>`

```
[bug]: login fails on mobile
[feature]: add OAuth support
[enhancement]: improve error messages
[docs]: update API documentation
[question]: clarification on auth flow
```

### Type in Title

| Type | When to Use |
|------|-------------|
| `bug` | Bug reports |
| `feature` | New feature requests |
| `enhancement` | Improvements |
| `docs` | Documentation |
| `question` | Questions |
| `refactor` | Code refactoring |
| `perf` | Performance |
| `chore` | Maintenance tasks |

### Title Rules

- Use imperative mood: "add" not "added"
- Lowercase after colon
- Be concise but descriptive
- Under 72 characters

## Issue Creation Command

### Basic Issue

```bash
gh issue create --title "[bug]: login fails on mobile" --body "Description"

gh issue create -t "[feature]: add OAuth support" -b "Description"
```

### Issue with Labels

```bash
gh issue create --title "[bug]: login fails" --body "Description" --label bug --label priority/p1

gh issue create -t "[feature]: add OAuth support" -b "Description" -l feature -l enhancement
```

### Issue with Assignees

```bash
# Self-assign
gh issue create --title "[bug]: login fails" --body "Description" --assignee "@me"

# Assign multiple people
gh issue create --title "[enhancement]: improve error handling" --body "Description" --assignee username1,username2

# Assign Copilot
gh issue create --title "[feature]: add dark mode" --body "Description" --assignee "@copilot"
```

### Issue with Milestone

```bash
gh issue create --title "[feature]: add OAuth support" --body "Description" --milestone "v1.0"
```

### Issue with Project

```bash
gh issue create --title "[feature]: add OAuth support" --body "Description" --project "Roadmap"
```

## Using Templates

Templates are stored in the skill's `templates/` directory. Use `--body-file` to read from a template:

```bash
# Use bug template
gh issue create -t "[bug]: login fails" --body-file "templates/bug.md" -l bug

# Use feature template
gh issue create -t "[feature]: add OAuth" --body-file "templates/feature.md" -l feature

# Use enhancement template
gh issue create -t "[enhancement]: improve error handling" --body-file "templates/enhancement.md" -l enhancement

# Use question template
gh issue create -t "[question]: about auth flow" --body-file "templates/question.md" -l question
```

### Available Templates

| Template | Use For | Label |
|----------|---------|-------|
| `templates/bug.md` | Bug reports | `bug` |
| `templates/feature.md` | New features | `feature` |
| `templates/enhancement.md` | Improvements | `enhancement` |
| `templates/question.md` | Questions | `question` |
| `templates/docs.md` | Documentation | `documentation` |
| `templates/refactor.md` | Refactoring | `refactor` |

See [labels.md](./labels.md) for the complete list of all Marty labels.

## Marty Issue Template (Manual)

For quick issues without templates, use this format:

```bash
gh issue create -t "[TYPE]: Title" -b "## Summary
[Brief description]

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>" -l TYPE
```

## Label Reference

Marty standard labels:

| Label | Use For |
|-------|---------|
| `bug` | Bug reports |
| `feature` | Feature requests |
| `enhancement` | Improvements to existing features |
| `documentation` | Docs improvements |
| `question` | Questions |
| `help wanted` | Seeking contributions |
| `priority/p0` | Critical (urgent) |
| `priority/p1` | High priority |
| `priority/p2` | Medium priority |
| `priority/p3` | Low priority |
| `status/triaged` | Triaged and ready |
| `status/in-progress` | Being worked on |
| `status/blocked` | Blocked on something |
| `rfc-needed` | Needs RFC before implementation |

## Quick Reference

```
Create issue:           gh issue create -t "[type]: title" -b "Body"
With template:          gh issue create -t "[bug]: issue" --body-file "templates/bug.md"
With labels:            gh issue create -t "[bug]: issue" -l bug -l priority/p1
Self-assign:            gh issue create -t "[bug]: issue" -b "Body" --assignee "@me"
With milestone:          gh issue create -t "[feature]: feature" -b "Body" --milestone "v1.0"
From file:              gh issue create -t "[type]: title" -b "$(cat body.md)"
```

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/triage` | Process and categorize new issues |
| `/bug-report` | Structured bug report workflow |