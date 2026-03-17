# @deessejs/core

TypeScript monorepo for `@deessejs/core` - Type-safe error handling library using pnpm workspaces, turbo, vitest, husky, and changesets.

## Project Structure

```
.
├── packages/              # Workspace packages
│   └── core/             # Main @deessejs/core package
├── examples/             # Usage examples
├── .github/workflows/    # GitHub Actions
├── .husky/              # Git hooks
├── turbo.json           # Turbo configuration
├── pnpm-workspace.yaml  # pnpm workspace config
└── tsconfig.json        # Root TypeScript config
```

## Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Enable husky hooks
pnpm prepare

# Run all tests
pnpm test

# Run linter
pnpm lint

# Type check
pnpm typecheck

# Build all packages
pnpm build

# Add a new package
mkdir packages/my-package
cd packages/my-package
pnpm init
```

### Pre-commit Hooks

Husky automatically runs on every commit:
1. `turbo lint` - ESLint on all packages
2. `turbo typecheck` - TypeScript type checking
3. `turbo test` - vitest tests

## Release Workflow

### Using Changesets

1. **Create a changeset** (describes the change):
   ```bash
   pnpm changeset add
   ```

2. **Version bump** (updates package.json versions):
   ```bash
   pnpm release
   ```

3. **Publish to npm** (CI does this automatically on tag push):
   ```bash
   pnpm publish
   ```

### Manual Tag Release

To trigger the release workflow manually:

```bash
# Create a version tag
git tag v1.0.0

# Push tag to trigger release
git push origin v1.0.0
```

This triggers the `release.yml` workflow which:
1. Builds all packages with `turbo build`
2. Publishes to npm using changesets
3. Creates a GitHub release

## GitHub Actions Workflows

### CI (`ci.yml`)
- Runs on: push to `main`, pull requests to `main`
- Steps: install → lint → typecheck → test

### Release (`release.yml`)
- Runs on: tag push matching `v*`
- Steps: install → build → publish → create GitHub release

### PR Review (`pr-review.yml`)
- Runs on: PR opened, updated, ready for review
- Uses Marty for automated code review

## Package Structure

Each package should have:

```json
{
  "name": "core-package-name",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

## GitHub Labels

When creating GitHub issues, **always apply these labels**:

### Type (Required)
- `bug` - Something is broken
- `feature` - New functionality
- `enhancement` - Improvement to existing
- `task` - General work
- `refactor` - Code cleanup
- `docs` - Documentation
- `security` - Security issue
- `tech-debt` - Technical debt

### Status (Required)
- `triage` - Needs evaluation
- `ready` - Ready to work on
- `in-progress` - Being worked on
- `blocked` - Waiting on something
- `review` - Awaiting review
- `done` - Completed

### Priority (Required)
- `priority:critical` - Production down, data loss
- `priority:high` - Major user impact
- `priority:medium` - Normal impact
- `priority:low` - Minor impact

### Effort (Required)
- `effort:xs` - < 1 hour
- `effort:s` - 1 day
- `effort:m` - 1-3 days
- `effort:l` - 1 week
- `effort:xl` - > 1 week

**When creating an issue with `gh issue create`, always include:**
```bash
gh issue create --title "..." --body "..." --labels "feature,priority:medium,effort:m,ready"
```

## Notes

- ESLint uses flat config (`eslint.config.js`)
- TypeScript extends root `tsconfig.json`
- Turbo caches builds in `.turbo/`
- Changesets are stored in `.changeset/`

## Commit Conventions

When committing changes made by AI, always use this co-author format:

```
Co-Authored-By: martyy-code <nesalia.inc@gmail.com>
```

Example commit message:
```bash
git commit -m "feat: add new feature

Co-Authored-By: martyy-code <nesalia.inc@gmail.com>
```
