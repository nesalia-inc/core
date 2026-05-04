---
name: context
description: Manage project context (add, update, or view project knowledge). Use this skill when the user wants to document project information (architecture, conventions, methods), modify existing context, or check what context is already stored. Trigger phrases: "add to context", "remember that", "document this", "update context", "change this info", "what context do we have", "show me what's documented", "where is this info stored", "context status". Make sure to use this skill whenever the user mentions documenting anything about the project or checking existing project documentation.
disable-model-invocation: true
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Read, Glob, Grep, Write, Edit, Bash
---

# Context Management

Manage project context intelligently: add new information, update existing, or check current status.

## Routing Logic

Determine the operation type from the user's request:

```
User says "add", "remember", "document this", "we use X", "project has Y"
  → ADD operation

User says "update", "change", "modify", "correct", "this is wrong"
  → UPDATE operation

User says "what context", "show me", "status", "what do we know", "where is"
  → STATUS operation
```

## Shared Infrastructure

### Destination Map

| Information Type | Destination |
|-----------------|-------------|
| How to run project | `docs/startup.md` |
| Project architecture | `docs/architecture.md` |
| Git conventions | `.claude/rules/git-workflow.md` |
| Code patterns | `.claude/rules/code-style.md` |
| Agent methods | `.claude/rules/agent-workflow.md` |
| General project info | `docs/project-info.md` |
| Project structure | `CLAUDE.md` with `@docs/structure.md` |

### Duplicate Detection

Before adding or updating, always check for existing similar content:

```bash
# Use Glob to search for existing files
Glob: "**/docs/*.md"
Glob: "**/.claude/rules/*.md"

# Use Grep to find similar concepts
Grep pattern="keyword" path="docs"
Grep pattern="keyword" path=".claude/rules"
```

### File Existence Check

Use Glob or Read to check if target file exists before creating or modifying.

## ADD Operation

### When to use
User wants to add new project knowledge.

### Process

1. **Analyze the information** - Determine which category from Destination Map
2. **Check for existing content** - Use duplicate detection above
3. **Add or enrich**:
   - If file exists: Read it, find the right section, enrich
   - If file doesn't exist: Create with proper structure
4. **Update CLAUDE.md references** - Ensure new context is loaded via `@path`

### File Templates

**docs/architecture.md**:
```markdown
---
title: Project Architecture
description: How the project is structured
---

# Project Architecture

## Overview
[Description]

## Layer Structure
[If applicable]
```

**.claude/rules/git-workflow.md**:
```markdown
---
name: git-workflow
description: Git conventions
paths:
  - "**/*.md"
---

# Git Workflow Conventions

## Commit Messages
[Conventions]
```

### Add Confirmation

Always return a clear summary after adding:

```
✓ Added to [destination]
  → [What was added]

Context updated: [summary of context state]
```

## UPDATE Operation

### When to use
User wants to modify, expand, or correct existing context.

### Process

1. **Find existing information** - Use Grep to locate where info is stored
2. **Read current content** - Read the file containing the info
3. **Update without duplication**:
   - Enrich existing section if adding more info
   - Replace if correcting
   - Move if reorganizing
4. **Update references** - Ensure CLAUDE.md references are correct

### Update Patterns

**Enrich existing section**:
```markdown
## Before
### Commit Messages
- Use conventional commits

## After
### Commit Messages
- Use conventional commits
- Always include body
- Add Co-Authored-By: martyy-code <email>
```

**Fix incorrect info**:
```markdown
## Before
Run with: npm start

## After
Run with: npm run dev
```

**Move content**:
1. Add to new location
2. Remove from old location
3. Update references

### Update Confirmation

```
✓ Updated [destination]
  → [What changed]

Context modified: [summary]
```

## STATUS Operation

### When to use
User wants to know what context exists and where.

### Process

1. **Check CLAUDE.md** - Read root CLAUDE.md for main instructions and imports
2. **Check .claude/rules/** - List available rules
3. **Check docs/** - List available documentation
4. **Build summary** - Show what exists, what's missing

### Files to Check

```bash
# Check root files
Read: CLAUDE.md

# Check rules
Glob: ".claude/rules/*.md"

# Check docs
Glob: "docs/*.md"
```

### Status Summary Format

Return a clear summary like:

```
## Project Context Status

### Available Documentation
- `CLAUDE.md` - Main instructions (references: @docs/...)
- `docs/architecture.md` - EXISTS / MISSING
- `docs/startup.md` - EXISTS / MISSING
- `docs/project-info.md` - EXISTS / MISSING

### Rules Active
- `.claude/rules/git-workflow.md` - EXISTS / MISSING
- `.claude/rules/code-style.md` - EXISTS / MISSING
- `.claude/rules/agent-workflow.md` - EXISTS / MISSING

### Summary
[X] files exist, [Y] rules active
```

## Error Handling

If write fails or path doesn't exist:
1. Create parent directory if needed using Write or Bash
2. If still failing, inform user with specific error
3. Never lose user's input - if write fails, report what was supposed to be added

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/context` | Main entry point (this skill consolidates all three) |