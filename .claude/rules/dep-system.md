---
name: dep-system
description: DEP (DeesseJS Enhancement Proposal) - formal process for proposing enhancements
paths:
  - "**/*.md"
---

# DEP System

DEP (DeesseJS Enhancement Proposal) is the formal process for proposing enhancements to @deessejs/fp. Inspired by Python's PEP and Rust's RFC.

## Why DEP?

@deessejs/fp aims to be the #1 functional programming library in the world. DEPs ensure:
- Quality decisions made with full context
- Historical record of why changes happened
- Community engagement in design process

## DEP Status Lifecycle

| Status | Meaning |
|--------|---------|
| `Proposed` | Initial submission, open for discussion |
| `Draft` | Being refined based on feedback |
| `Accepted` | Approved for implementation |
| `Rejected` | Not approved |
| `Implemented` | Shipped in release |

## When to Write a DEP

Write a DEP when:
- Adding new features with API changes
- Breaking changes to existing behavior
- Architectural decisions affecting users
- Significant refactors

## DEP Structure

A DEP must include:

1. **Problem** - What's broken/needed?
2. **Why It Matters** - Consequences
3. **Current vs Expected DX** - Measurable improvement
4. **Detailed Design** - Concrete technical specification
5. **Alternatives Considered** - Why this over others?
6. **Migration Path** - How users upgrade

## Quick Reference

```
/propose-refactoring to add DEP for async result improvements
```

Creates a GitHub issue following the DEP template.

## Directory

DEPs live in `docs/rfcs/` directory.