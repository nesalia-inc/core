---
name: doc-coverage
description: Check if code is documented. Use when auditing documentation coverage, finding undocumented features, or when asked "is this feature documented?". Compares apps/web documentation with implementation. Supports --types, --report, --create-issues flags.
disable-model-invocation: true
allowed-tools: Read,Grep,Glob,Bash
---

# Documentation Coverage Skill

A skill that audits documentation by comparing implementation against documentation in `apps/web`.

## Quick Usage

```bash
/doc-coverage
/doc-coverage --types=endpoints,components
/doc-coverage --report
/doc-coverage --create-issues
```

## Overview

This skill compares:
- **Documentation**: Markdown files in `apps/web` (public-facing docs)
- **Implementation**: Source code in `src`

And identifies:
- ** undocumented code**: Features in code but not in docs
- **orphaned docs**: Docs that reference non-existent code
- **outdated docs**: Docs that don't match current implementation

## Flags

| Flag | Description |
|------|-------------|
| `--types=<categories>` | Comma-separated: endpoints,components,functions,api,features |
| `--report` | Generate detailed coverage report |
| `--create-issues` | Create GitHub issues for missing documentation (asks for confirmation) |
| `--doc-path=<path>` | Custom documentation path (default: apps/web) |
| `--src-path=<path>` | Custom source path (default: src) |

## How It Works

### Stage 1: Documentation Inventory

Map all documentation files and their topics:

```bash
# List all doc files
find apps/web -name "*.md" -type f

# Extract headings/titles from docs
grep -rh "^# " apps/web/*.md apps/web/**/*.md 2>/dev/null

# Build doc index
for f in $(find apps/web -name "*.md"); do
  echo "=== $f ==="
  grep -h "^## " "$f" | sed 's/^## //'
done
```

### Stage 2: Code Inventory

Map all public API surfaces:

```bash
# Extract exported functions
grep -rh "^export function\|^export const\|^export class" src/**/*.ts

# Extract route definitions
grep -rh "router\.\|app\.\|Route\|GET\|POST\|PUT\|DELETE" src/**/*.{ts,tsx}

# Extract component names
grep -rh "^export.*Component\|const.*=" src/**/*.tsx | head -50

# Extract API endpoints
grep -rh "api/\|/v[0-9]/" src/**/*.{ts,tsx}
```

### Stage 3: Coverage Analysis

Compare and find gaps:

| Finding | Description |
|---------|-------------|
| **Undocumented Feature** | Code element exists but no doc mentions it |
| **Orphaned Doc** | Doc exists but no code references it |
| **Partial Doc** | Doc exists but is missing key details |
| **Outdated Doc** | Doc doesn't match current implementation |

## Categories to Check

### 1. API Endpoints

| Check | Example |
|-------|---------|
| Documented endpoints | GET /api/users documented |
| Undocumented endpoints | POST /api/users exists but not documented |
| Missing parameters | /users/:id documented but :id param not explained |
| Missing responses | Success response documented, error responses missing |

### 2. Components

| Check | Example |
|-------|---------|
| Exported components | Button, Modal, Card documented |
| Props documented | Button variant="primary" explained |
| Usage examples | <Button> with examples shown |

### 3. Functions

| Check | Example |
|-------|---------|
| Public functions | Utility functions documented |
| Parameters | formatDate(date, locale) params explained |
| Return values | Return type and examples provided |

### 4. Features

| Check | Example |
|-------|---------|
| Feature flags | ENABLE_FEATURE_X documented |
| User flows | Checkout flow documented step-by-step |
| Edge cases | Error states documented |

## Confidence Scoring

| Level | Score | Description |
|-------|-------|-------------|
| **Critical** | 90%+ | Major feature completely undocumented |
| **High** | 70-89% | Endpoint/API undocumented |
| **Medium** | 50-69% | Props/parameters missing docs |
| **Low** | <50% | Minor details or edge cases |

## Report Format

```markdown
## Documentation Coverage Report

### Summary

| Category | Total | Documented | Missing | Coverage % |
|----------|-------|------------|---------|------------|
| API Endpoints | 24 | 18 | 6 | 75% |
| Components | 45 | 32 | 13 | 71% |
| Functions | 89 | 45 | 44 | 51% |
| Features | 12 | 8 | 4 | 67% |

**Overall Coverage:** 64%

---

### 🔴 Critical: Major Features Undocumented

#### Authentication Flow
- **Type:** Feature
- **Finding:** /auth/login, /auth/logout, /auth/refresh undocumented
- **Impact:** Users cannot understand authentication
- **Files:** src/auth/*.ts

#### Payment Integration
- **Type:** API Endpoint
- **Finding:** POST /api/payments undocumented
- **Impact:** Integration partners cannot integrate
- **Files:** src/api/payments.ts

---

### 🟡 Medium: Missing Details

#### Button Component
- **Type:** Component Props
- **Finding:** variant="ghost" prop not documented
- **Impact:** Users don't know ghost button exists
- **File:** src/components/Button.tsx

#### User API
- **Type:** Missing Response Schema
- **Finding:** Error 429 (rate limit) response not documented
- **Impact:** API consumers don't know rate limit
- **File:** src/api/users.ts

---

### 🟢 Well Documented

- User registration flow ✓
- Settings page ✓
- Error handling ✓
- Authentication tokens ✓

---

### 🔵 Orphaned Documentation

- `apps/web/api/auth.md` references `/v2/users` which no longer exists
- `apps/web/features/old-flow.md` has no corresponding code

---

## GitHub Issues (--create-issues flag)

**NEVER create issues without confirmation.**

### Issue Draft Format

```markdown
Title: [DOCS] Missing documentation for [FEATURE NAME]
Labels: documentation, missing-docs

## Documentation Gap

### Category: [API/COMPONENT/FEATURE]
### Priority: [HIGH/MEDIUM/LOW]

### What's Missing:
- Description of what needs to be documented

### Code Reference:
- File: src/file.ts
- Element: function/component/endpoint name

### Suggested Documentation:
```markdown
## [Heading]

[Content to add]
```
```

### Confirmation Prompt

```
Found 8 documentation gaps:

1. [HIGH] POST /api/payments - Payment endpoint undocumented
2. [HIGH] Auth flow - Login/logout undocumented
3. [MEDIUM] Button variant="ghost" prop undocumented
4. [MEDIUM] Error 429 response undocumented
...

Create documentation issues? [y/n/all/modify]
```

## Documentation Quality Checklist

### For API Endpoints
- [ ] Method and path clearly stated
- [ ] All parameters documented with types
- [ ] Request body schema shown
- [ ] All response codes documented
- [ ] Error responses explained
- [ ] Example request/response provided

### For Components
- [ ] Purpose clearly stated
- [ ] All props documented with types
- [ ] Default values shown
- [ ] Usage examples provided
- [ ] Accessibility notes (a11y)
- [ ] Visual states shown (hover, disabled, etc.)

### For Functions
- [ ] Purpose clearly stated
- [ ] All parameters documented
- [ ] Return value/type documented
- [ ] Usage examples
- [ ] Edge cases mentioned

## Senior Advice

> "If users need to read the code to understand a feature, the documentation is incomplete."

> "Documentation debt is technical debt. Undocumented features are liabilities."

> "Orphaned docs are warning signs of stale documentation or deleted features."

> "A 10x developer writes code. A 100x developer also writes the docs."

## Additional Resources

- For doc format templates, see [templates.md](templates.md)
- For writing guidelines, see [writing-guide.md](writing-guide.md)
