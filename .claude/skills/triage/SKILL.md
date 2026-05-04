---
name: triage
description: Triage a GitHub issue by analyzing its content and adding appropriate labels. Use this skill when the user asks to triage an issue, or when an issue needs labels added. Example: "/triage 45"
disable-model-invocation: false
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash, Read, Glob, Grep
---

# Triage Issue Guide

Triage a single GitHub issue by reading it, analyzing its content, and adding appropriate labels.

## Triage Axes

Every issue needs labels across these axes:

| Axis | Labels | Required |
|------|--------|----------|
| **Type** | `bug`, `feature`, `enhancement`, `refactor`, `docs`, `chore`, `test`, `perf`, `ci`, `question` | Yes |
| **Priority** | `priority/p0`, `priority/p1`, `priority/p2`, `priority/p3` | Yes |
| **Effort** | `effort/xs`, `effort/s`, `effort/m`, `effort/l`, `effort/xl`, `triage/needs-investigation` | Yes |
| **Area** | `area/auth`, `area/api`, `area/frontend`, `area/backend`, `area/docs`, `area/testing`, `area/security`, `area/performance` | Recommended |
| **Status** | `status/triaged`, `status/backlog`, `status/icebox` | Yes |

## Triage Process

### Step 1: Read the Issue

```bash
gh issue view <number> --json title,body,labels
```

### Step 1b: Check if Already Triaged

If the issue already has `status/triaged` label, this is a **re-triage**:

```
Issue already has status/triaged.
This is a re-triage - previous triage will be replaced.

Removing previous triage labels:
- status/triaged
- triage/needs-info
```

Remove old triage-related labels before re-triaging:

```bash
# Remove status/triaged to allow re-triage
gh issue edit <number> --remove-label "status/triaged"

# Remove triage/needs-info if present
gh issue edit <number> --remove-label "triage/needs-info"
```

**Re-triage is idempotent** - running triage multiple times always produces the same result.

### Step 2: Analyze Content

For each axis, determine the appropriate label based on the issue content:

#### Type Detection

| If issue is about... | Use label |
|---------------------|-----------|
| Bug, error, unexpected behavior | `bug` |
| New feature request | `feature` |
| Improvement to existing feature | `enhancement` |
| Code refactoring without behavior change | `refactor` |
| Documentation improvements | `documentation` |
| Maintenance, tooling, dependencies | `chore` |
| Adding or updating tests | `test` |
| Performance improvement | `perf` |
| CI/CD changes | `ci` |
| How-to question, support request | `question` |

#### Question/Support Handling

If the issue is a **how-to question** or **support request**:

```
This appears to be a support question.

If this is a how-to question:
- Check if project has GitHub Discussions enabled
- If yes: Convert to discussion and close issue
- If no: Add `question` label and advise to use appropriate channel
```

```bash
# If GitHub Discussions is available
gh issue comment <number> --body "This appears to be a support question.

For how-to questions, please use GitHub Discussions instead.
Converting this issue to a discussion."

# Add question label
gh issue edit <number> --add-label "question"
gh issue close <number>
```

**STOP** - Support questions are not bugs or features. Close them appropriately.

#### Priority Guidelines (with SLA)

| Priority | When to use | SLA |
|----------|-------------|-----|
| `priority/p0` | Critical - production down, data loss, security breach | **24h resolution** |
| `priority/p1` | High - important feature broken, significant impact | **Next sprint** |
| `priority/p2` | Medium - normal bugs/features, moderate impact | **Backlog (prioritized)** |
| `priority/p3` | Low - nice to have, minor issues | **Backlog** |

**Note:** If you cannot determine priority based on impact, use the SLA as a guide:
- Can this wait for the next sprint? → `p2` or `p3`
- Does this block users from working? → `p1`
- Is production broken? → `p0`

#### Effort Guidelines

**Renamed from "Size" to "Effort"** - Estimating effort at triage time is often premature. Only estimate if the implementation path is clear.

| Effort | When to use | Action |
|--------|-------------|--------|
| `effort/xs` | 1-2 lines, trivial change | - |
| `effort/s` | Few hours, simple change | - |
| `effort/m` | Half day to 1 day, moderate complexity | - |
| `effort/l` | 2-3 days, significant work | ⚠️ Consider breaking into sub-issues |
| `effort/xl` | Week+, major feature or refactor | 🚨 **Needs RFC** |
| `triage/needs-investigation` | Cannot estimate without technical spike | Spike required |

**If you cannot estimate effort** (implementation path unclear, unknown complexity):

```bash
# Cannot estimate - needs investigation
gh issue edit <number> --add-label "triage/needs-investigation"

gh issue comment <number> --body "This issue requires a technical spike to estimate effort.

A brief investigation is needed before we can determine the implementation scope.
"
```

**Do NOT guess effort if unclear** - Use `triage/needs-investigation` instead.

If the issue has `size/xl` or `size/l`, or if it requires:
- Architecture decision
- Multiple system changes
- Detailed implementation plan

Then add `rfc-needed` label:

```bash
# If issue is too large or needs planning
gh issue edit <number> --add-label "rfc-needed"

gh issue comment <number> --body "This issue is too large or complex for a single PR.

Effort: \`<effort>\`
Complexity: Requires planning.

Adding \`rfc-needed\` label. An RFC must be created before implementation.
"
```

**STOP for RFC issues** - Do not proceed with triage completion. The issue will be triaged after RFC is approved.

#### Area Detection

| If issue affects... | Use label |
|--------------------|-----------|
| Authentication, authorization, sessions | `area/auth` |
| API endpoints, data fetching | `area/api` |
| UI, components, styling | `area/frontend` |
| Server, database, backend logic | `area/backend` |
| Documentation | `area/docs` |
| Tests, testing infrastructure | `area/testing` |
| Security-related | `area/security` |
| Performance | `area/performance` |

### Step 3: Check for Duplicates

Before triaging, search for existing issues that might be duplicates:

```bash
# Search for similar issues by keyword
gh issue list --search "<keyword>" --state open --limit 10
```

**If duplicate found:**
- Add `status/duplicate` label
- Comment linking to the original issue:
```bash
gh issue comment <number> --body "This appears to be a duplicate of #<original-number>.

Duplicating #<original-number> - closing in favor of that issue."
gh issue close <number>
```
**STOP** - Do not continue triage for duplicates.

### Step 4: Check for Missing Information

#### Bug Requirements

A bug should have:
- Clear description of the problem
- Steps to reproduce (or "cannot reproduce")
- Expected behavior
- Actual behavior

**If missing:** Comment asking for the missing information, then add `triage/needs-info`.

#### Feature Requirements

A feature should have:
- Clear description of the desired behavior
- Acceptance criteria (or "to be determined")
- Context/motivation (why)

**If missing:** Comment asking for clarification, then add `triage/needs-info`.

### Step 5: Add Labels

```bash
# Add all determined labels
gh issue edit <number> \
  --add-label "bug" \
  --add-label "priority/p2" \
  --add-label "size/m" \
  --add-label "area/api"
```

### Step 6: Determine Status and Mark

Choose the appropriate status based on triage outcome:

| Status | When to use |
|--------|-------------|
| `status/triaged` | Ready for implementation, all info present |
| `status/backlog` | Triaged but not scheduled for any sprint |
| `status/icebox` | Triaged but deprioritized, may be revisited later |

```bash
# If triage complete and prioritized
gh issue edit <number> --add-label "status/triaged"

# If triaged but not scheduled
gh issue edit <number> --add-label "status/backlog"

# If triaged but deprioritized
gh issue edit <number> --add-label "status/icebox"

# If missing information
gh issue edit <number> --add-label "triage/needs-info"
gh issue comment <number> --body "This issue needs more information to be triaged:

- [Missing item 1]
- [Missing item 2]

Please add these details so we can proceed."

# If issue needs RFC (do NOT add status/triaged)
# The issue will be triaged after RFC approval
```

### Step 7: Post Triage Comment

After completing triage, add a summary comment:

```bash
# If triage complete
gh issue comment <number> --body "## Triage Summary

This issue has been triaged:

| Axis | Label |
|------|-------|
| Type | \`<type>\` |
| Priority | \`<priority>\` |
| Effort | \`<effort>\` |
| Area | \`<area>\` |
| Status | \`<status>\` |

Issue is ready for implementation.
"

# If missing information
gh issue comment <number> --body "## Triage Summary

This issue requires more information before it can be triaged:

- [ ] [Missing item 1]
- [ ] [Missing item 2]

Please provide these details so we can complete triage."
```

## Triage Complete Criteria

An issue is **triaged** (ready) when ALL of:
- ✅ Has `type/*` label (not `question`)
- ✅ Has `priority/*` label
- ✅ Has `effort/*` or `triage/needs-investigation` label
- ✅ Has `status/*` label (`triaged`, `backlog`, or `icebox`)
- ✅ Does NOT have `triage/needs-info`
- ✅ Does NOT have `rfc-needed` (RFC issues are not ready)

An issue is **pending RFC** when:
- ⚠️ Has `rfc-needed` label
- ⚠️ Effort is `effort/l` or `effort/xl`

An issue needs **more info** when:
- ⚠️ Has `triage/needs-info` label

An issue needs **investigation** when:
- ⚠️ Has `triage/needs-investigation` label

## Example Workflow

```
/triage 45

Reading issue #45...

Issue: "Login fails with special characters in password"

Checking for duplicates...
No duplicates found.

Analyzing:
- Type: bug (login failure)
- Priority: p1 (users can't login)
- Effort: s (small bug fix)
- Area: area/auth

Adding labels: bug, priority/p1, size/s, area/auth
Checking requirements...

Bug has:
✓ Description
✓ Steps to reproduce
✓ Expected/Actual behavior

Triage complete! Adding status/triaged.

Posting triage summary comment...

Done. Issue #45 is now triaged.
```

## When Triage is NOT Complete

If the issue lacks critical information:

```
/triage 45

Reading issue #45...

Issue: "Login bug"

Checking for duplicates...
No duplicates found.

Analyzing...

⚠️ Missing critical information:
- No steps to reproduce
- No expected behavior
- No acceptance criteria

Commenting to request information...
Adding triage/needs-info label.
Adding triage/needs-info to issue.

Posting triage summary comment...

Done. Issue #45 needs more information before it can be triaged.
```

## Duplicate Found Workflow

```
/triage 45

Reading issue #45...

Issue: "Login fails with special characters"

Checking for duplicates...
Found similar issue: #32 "Login fails with special chars in password"

Issue #45 appears to be duplicate of #32.

Adding status/duplicate label.
Commenting duplicate notice.
Closing issue #45.

Done. Issue #45 marked as duplicate of #32.
```

## Re-triage Workflow

```
/triage 45

Reading issue #45...

Issue: "Login fails with special characters in password"
Labels: [bug, priority/p1, size/s, area/auth, status/triaged]

⚠️ Issue already has status/triaged.
This is a re-triage - previous triage will be replaced.

Removing previous triage labels:
- status/triaged

Checking for duplicates...
No duplicates found.

Analyzing (new content detected)...

User updated the issue with more details about the bug.
New analysis:
- Type: bug
- Priority: p1 → p0 (more critical now)
- Effort: s (unchanged)
- Area: area/auth

Updating labels: priority/p0

Checking requirements...
✓ All information present

Triage complete! Adding status/triaged.

Posting triage summary comment...

Done. Issue #45 re-triaged.
```

## Too Large - Needs RFC Workflow

```
/triage 45

Reading issue #45...

Issue: "Complete redesign of authentication system"

Checking for duplicates...
No duplicates found.

Analyzing...

Effort estimate: xl
This is a major undertaking requiring architectural decisions.

⚠️ Issue is too large for a single PR.

Adding rfc-needed label.

Commenting about RFC requirement...
Adding rfc-needed to issue.

Done. Issue #45 requires RFC before implementation.
```

## Quick Reference

```bash
# Triage an issue
/triage <number>

# View labels
gh issue view <number> --json labels

# Search for duplicates
gh issue list --search "<keyword>" --state open --limit 10

# Remove label (for re-triage)
gh issue edit <number> --remove-label "status/triaged"

# Add label
gh issue edit <number> --add-label "<label>"

# Add multiple labels
gh issue edit <number> --add-label "bug" --add-label "priority/p2" --add-label "effort/m"

# Mark as duplicate and close
gh issue edit <number> --add-label "status/duplicate"
gh issue comment <number> --body "Duplicate of #<original-number>"
gh issue close <number>

# Mark as needing RFC
gh issue edit <number> --add-label "rfc-needed"
gh issue comment <number> --body "This issue requires RFC before implementation."

# Mark as needs investigation
gh issue edit <number> --add-label "triage/needs-investigation"

# Set status
gh issue edit <number> --add-label "status/triaged"      # Ready
gh issue edit <number> --add-label "status/backlog"      # Not scheduled
gh issue edit <number> --add-label "status/icebox"       # Deprioritized
```

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/fix-issue` | After triage, when issue has `status/triaged` |
| `/create-rfc` | When issue has `rfc-needed` label |
| `/commit` | Commit triage changes |
