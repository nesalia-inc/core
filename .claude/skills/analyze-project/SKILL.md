---
name: analyze-project
description: Manually invoke at the start of a conversation to give the agent full project context. Use this skill when you need the agent to understand the project before starting work. Also use when the user says "analyze the project", "understand this repo", "what's this project about", or "explore the codebase" at the beginning of a session.
disable-model-invocation: true
context: fork
agent: general-purpose
permissionMode: bypassPermissions
allowed-tools: Bash, Read, Glob, Grep, Task
---

# Project Analysis Guide

**This skill should be invoked manually at the start of conversations** to ensure the agent has full context before beginning work. Do not wait to be asked - proactively analyze the project when starting a new session.

## Purpose

When starting work on a project, the agent needs to:
1. Understand what the project does
2. Know the key components and their relationships
3. Understand how to run and test it
4. Be aware of conventions and patterns used

Use this skill to capture all context and share it with subsequent agents working in the same session.

## Context to Capture

After analysis, document and share:

```markdown
# Project Context

## Project: [Name]
**Purpose**: [What it does in one sentence]

## Tech Stack
- Language: [X]
- Framework: [X]
- Database: [X]
- Key dependencies: [list]

## Structure
```
[key directory tree]
```

## Key Files
| File | Purpose |
|------|---------|
| | |

## Conventions
- Commit format: [conventional commits format]
- Branch strategy: [main <- canary <- feature]
- Co-author: martyy-code <nesalia.inc@gmail.com>

## How to Run
- Install: [commands]
- Start: [commands]
- Test: [commands]

## Important Notes
- [Any project-specific rules]
- [Patterns to follow]
- [Common pitfalls]
```

## Analysis Strategy

Use subagents to explore in parallel:

```
main-agent (this skill)
├── subagent: architecture
├── subagent: entry-points
├── subagent: data-layer
└── subagent: configuration
```

Each subagent explores a specific area and reports back. Combine findings for complete picture.

## Quick Analysis (5 minutes)

Use for rapid understanding when joining a new project:

### Step 1: Parallel Exploration

```bash
# Spawn agents to explore different areas
# Use Explore agent for deep analysis
```

**Agent 1 - Entry Points & Flow:**
```
Explore the codebase to find:
- Main entry points (index.js, main.py, etc.)
- How the application starts
- Key routing/applications files
- Export/import structure

Report: 5-10 bullet points max
```

**Agent 2 - Data & State:**
```
Explore to find:
- Database schemas or models
- API endpoints/routes
- State management patterns
- Data flow through the app

Report: 5-10 bullet points max
```

**Agent 3 - Architecture & Patterns:**
```
Explore to find:
- Main architectural patterns (MVC, microservices, etc.)
- Key directories and their purpose
- External services integrations
- Build/deploy configuration

Report: 5-10 bullet points max
```

### Step 2: Synthesize Findings

After all agents report, combine into concise summary:

```markdown
# Project Understanding: [Repo Name]

## What It Does
[One sentence description]

## Key Components
| Component | Purpose |
|-----------|---------|
| | |

## How It Works
[Quick explanation of flow]

## Tech Stack
- Language: [X]
- Framework: [X]
- Database: [X]

## Start Command
[How to run it]

## Key Files
- `path/to/file` - description
```

## Detailed Analysis (When Needed)

For deeper analysis, explore:
- Source code structure
- Test coverage and patterns
- CI/CD configuration
- Documentation quality

## Subagent Configuration

Use Explore agent for focused exploration:

```
context: fork
agent: Explore
```

Each subagent should:
- Focus on one area only
- Limit output to essential findings
- Use clear bullet points
- Report specific file paths

## Quick Reference

```
Analyze quickly:      Spawn 3-4 parallel subagents
Focus areas:          entry-points, data, architecture, config
Synthesize:           Combine into 10-line summary
Update context:       Store findings for later use
```

## Context Checklist

Before starting work, ensure you can answer:

- [ ] What does this project do?
- [ ] What is the tech stack?
- [ ] How do I run it locally?
- [ ] What are the main conventions?
- [ ] Where are the key files?
- [ ] How do I run tests?
- [ ] What is the branch strategy?

Share this context with future agents in the conversation.

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/propose-refactoring` | If issues found during analysis |
| `/create-issue` | Document findings |
| `/learn` | Deep dive on specific technology |