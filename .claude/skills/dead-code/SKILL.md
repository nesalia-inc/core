---
name: dead-code
description: Detect unused code, dead functions, unreachable code, and unused dependencies. Use when cleaning up codebase, finding dead code, or when asked "what code is not used anymore?". Supports --types, --report, --remove flags.
disable-model-invocation: true
allowed-tools: Read,Grep,Glob,Bash
---

# Dead Code Detection Skill

A senior-level skill for identifying and safely removing dead code from codebases.

## Quick Usage

```bash
/dead-code [target]
/dead-code src/
/dead-code --types=functions,imports
/dead-code --report
/dead-code --remove
```

## Flags

| Flag | Description |
|------|-------------|
| `--types=<categories>` | Comma-separated: functions,variables,imports,classes,files |
| `--report` | Generate detailed report without proposing removal |
| `--remove` | Propose removal (asks for confirmation before deleting) |
| `--min-age=<days>` | Only flag code unused for N+ days (based on git) |
| `--safe` | Conservative mode - only removes clearly dead code |

## Dead Code Categories

### 1. Unused Functions
- Never called internally or externally
- Exported but never imported anywhere
- Private functions with zero references

### 2. Unreachable Code
- Code after `return`, `throw`, `break`, `continue`
- Dead branches in if/else
- Switch cases that can never be matched

### 3. Unused Imports/Dependencies
- Imported but never used
- Deprecated API usage
- Side-effect only imports (unused)

### 4. Unused Variables
- Declared but never read
- Variables assigned but never used
- Function parameters without usage

### 5. Ghost Files
- Files with no imports/exports
- Empty files
- Files only containing comments

### 6. Commented-Out Code
- Code wrapped in `/* ... */` or `//`
- `#ifdef`, `#if 0` blocks
- TODO/FIXME that's been implemented

## Detection Tools

### Stage 1: Tool-Based Detection

```bash
# TypeScript/JavaScript
npx tsc --noEmit                    # Type checking
npx ts-prune                       # Unused exports
knip                               # Unused code & deps

# ESLint
npx eslint --no-unused-vars        # Unused variables
npx eslint --no-unreachable        # Unreachable code

# Python
pip show deadcode || true
bandit -r . || true

# Dependencies
npm prune --dry-run                # Unused packages
depcheck                           # Unused dev dependencies
```

### Stage 2: Git History Analysis

Find code not modified in a long time:

```bash
# Find files unchanged in 6+ months
git log --all --pretty=format: --name-only --since="6 months ago" | sort | uniq

# Find functions never modified
git log -p --all -S "functionName" -- . -- "*.ts" | head -20

# Blame analysis for untouched code
git blame --show-stats -- src/unused.ts
```

### Stage 3: Static Analysis

Search for patterns indicating dead code:

```bash
# Commented-out code patterns
grep -r "// .*" --include="*.ts" src/
grep -r "/* " --include="*.ts" src/
grep -r "#if 0" --include="*.py" .

# TODO implemented
grep -r "TODO.*implement" --include="*.ts" src/

# Legacy patterns
grep -r "legacy\|deprecated\|obsolete" --include="*.ts" src/
```

## Confidence Scoring

| Level | Score | Description |
|-------|-------|-------------|
| **Confirmed** | 95%+ | Tool-detected, zero references |
| **Likely** | 70-94% | One reference found, but might be dead |
| **Maybe** | 40-69% | Git history shows no recent changes |
| **Safe** | <40% | Conservative finding, review needed |

## Safe Removal Rules

### NEVER Auto-Remove
- Code with `// TODO`, `// FIXME`
- Code marked `// @deprecated`
- Public APIs (might be used by consumers)
- Test files (might be testing dead code intentionally)

### ALWAYS Safe to Remove
- Unused imports
- Unreachable code (after return/throw)
- Duplicate code
- Empty files with only comments
- `console.log` statements in production code

## Removal Workflow (--remove flag)

**NEVER remove without explicit confirmation.**

1. Generate removal list with safety classification
2. Show preview with file, line, reason
3. Ask: `Remove N items? [y/n/all/safe-only]`

### Safety Options

| Response | Action |
|----------|--------|
| `y` | Remove all listed items |
| `n` | Skip all |
| `all` | Remove everything including risky items |
| `safe-only` | Only remove "ALWAYS Safe" items |
| `1,3,5` | Remove only specific items |

### Commands Preview

```bash
# Remove unused imports
npx eslint --fix src/file.ts

# Remove unused files (after confirmation)
rm src/dead/file.ts

# Create git backup branch
git checkout -b dead-code-cleanup-backup
```

## Report Format

```markdown
## Dead Code Report: `src/`

### Summary
| Category | Count | Safe to Remove |
|----------|-------|----------------|
| Unused Functions | 12 | 8 |
| Unreachable Code | 5 | 5 |
| Unused Imports | 34 | 34 |
| Ghost Files | 3 | 3 |
| Commented Code | 7 | 0 |

**Total:** 61 items (40 safe to remove)

---

### 🔴 Confirmed Dead Code (Safe Removal)

#### Unused Function: `processLegacyData()`
- **File:** `src/utils/data.ts:45`
- **Finding:** Function exported but never imported
- **Safe:** Yes
- **Action:** Remove function

#### Unreachable Code
- **File:** `src/auth/login.ts:89-95`
- **Finding:** Code after `return` statement
- **Lines:** 89-95
- **Safe:** Yes
- **Action:** Remove lines

---

### 🟡 Likely Dead Code (Review Before Removal)

#### Unused Export: `DeprecatedAPI`
- **File:** `src/api/v1/users.ts:12`
- **Finding:** Exported but no imports found
- **Safe:** No (might be external consumer)
- **Action:** Check with `npm reverse-dependencies`

---

### 🟢 Ghost Files

- `src/utils/temp.ts` - Empty file
- `src/old/migration.js` - Only comments

---

### 🔵 Commented-Out Code (Do Not Remove)

- `src/features/old/feature.ts:45-67` - Legacy feature (check before removing)

---

## Git Integration

### Track Who Should Approve

```bash
# Find when each dead item was last modified
git log -1 --format="%ai %an" -- src/dead/file.ts

# Identify owner for review
git blame src/dead/file.ts | head -5
```

### Rollback Plan

Before removal, ensure rollback is possible:

```bash
# Create backup branch
git checkout -b pre-dead-code-cleanup

# Tag for rollback
git tag dead-code-cleanup-$(date +%Y%m%d)
```

## Senior Advice

> "If you're not sure whether code is dead, it probably isn't. Be conservative."

> "Unused code that imports deprecated dependencies might be needed for migration."

> "Ghost files might be placeholders for future development."

> "Commented-out code was commented for a reason. Verify it's truly dead before removing."

## Tools Reference

| Tool | Language | Detects |
|------|----------|---------|
| `ts-prune` | TypeScript | Unused exports |
| `knip` | TypeScript | Unused code & deps |
| `depcheck` | Any | Unused dependencies |
| `eslint --no-unused-vars` | JS/TS | Unused variables |
| `eslint --no-unreachable` | JS/TS | Unreachable code |
| `bandit` | Python | Security issues + dead code |
| `vulture` | Python | Unused code |

## Additional Resources

- For detailed detection patterns, see [reference.md](reference.md)
- For removal safety rules, see [safety-rules.md](safety-rules.md)
