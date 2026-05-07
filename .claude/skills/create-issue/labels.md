# Marty Labels Reference

All labels used across Marty repositories.

## Type Labels

| Label | Description |
|-------|-------------|
| `bug` | Bug reports and issues |
| `feature` | New feature requests |
| `enhancement` | Improvements to existing features |
| `refactor` | Code refactoring tasks |
| `documentation` | Documentation improvements |
| `question` | Questions and inquiries |
| `chore` | Maintenance and tooling tasks |
| `test` | Test-related changes |
| `perf` | Performance improvements |
| `ci` | CI/CD related changes |

## Priority Labels

| Label | Description | SLA |
|-------|-------------|-----|
| `priority/p0` | Critical - production down, data loss, security breach | 24h resolution |
| `priority/p1` | High - important feature broken, significant impact | Next sprint |
| `priority/p2` | Medium - normal bugs/features, moderate impact | Backlog (prioritized) |
| `priority/p3` | Low - nice to have, minor issues | Backlog |

## Status Labels

| Label | Description |
|-------|-------------|
| `status/triaged` | Issue has been triaged and is ready |
| `status/in-progress` | Currently being worked on |
| `status/blocked` | Blocked on something else |
| `status/in-review` | Under review |
| `status/done` | Completed |
| `status/wontfix` | Won't be addressed |
| `status/duplicate` | Duplicate of another issue |
| `status/backlog` | Triaged but not scheduled |
| `status/icebox` | Triaged but deprioritized |

## RFC Labels

| Label | Description |
|-------|-------------|
| `rfc-needed` | Needs RFC before implementation |
| `rfc/draft` | RFC is being drafted |
| `rfc/approved` | RFC has been approved |
| `rfc/rejected` | RFC was rejected |
| `rfc/deprecated` | RFC is no longer relevant |

## Effort Labels

| Label | Description |
|-------|-------------|
| `effort/xs` | Extra small - trivial change |
| `effort/s` | Small - simple change |
| `effort/m` | Medium - moderate effort |
| `effort/l` | Large - significant effort |
| `effort/xl` | Extra large - major undertaking |

**Note:** Rename from "Size" to "Effort" - size estimation at triage time is often premature.

## Help Labels

| Label | Description |
|-------|-------------|
| `help wanted` | Seeking contributions |
| `good first issue` | Good for newcomers |
| `needs-review` | Needs review/attention |

## Triage Labels

| Label | Description |
|-------|-------------|
| `triage/needs-info` | Requires more information |
| `triage/confirmed` | Issue confirmed |
| `triage/reproducible` | Can be reproduced |
| `triage/needs-investigation` | Cannot estimate effort without technical spike |

## Area Labels

| Label | Description |
|-------|-------------|
| `area/auth` | Authentication and authorization |
| `area/api` | API related |
| `area/frontend` | Frontend related |
| `area/backend` | Backend related |
| `area/docs` | Documentation related |
| `area/testing` | Testing related |
| `area/security` | Security related |
| `area/performance` | Performance related |

## Quick Reference

```
Type:        bug | feature | enhancement | refactor | docs | question | chore | test | perf | ci
Priority:    priority/p0 | priority/p1 | priority/p2 | priority/p3
Status:      status/triaged | status/in-progress | status/blocked | status/in-review | status/done | status/backlog | status/icebox
RFC:         rfc-needed | rfc/draft | rfc/approved | rfc/rejected
Effort:      effort/xs | effort/s | effort/m | effort/l | effort/xl
Triage:      triage/needs-info | triage/confirmed | triage/reproducible | triage/needs-investigation
Help:        help wanted | good first issue
Area:        area/auth | area/api | area/frontend | area/backend | area/docs
```

## Label Naming Convention

Labels follow a category/value format: `category/value`

- Use lowercase for label names
- Use `/` to separate category from value
- Be consistent with existing labels when adding new ones