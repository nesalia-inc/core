---
"@deessejs/core": major
---

## Release v1.0.0

### Type Testing Infrastructure

- Added `@deessejs/type-testing` for compile-time type verification
- Created 5 type test files covering Result, Maybe, Error, AsyncResult, and Try types
- Added vitest typecheck configuration in vitest.config.ts
- Created tsconfig.types.json for type test compilation

### Test Coverage Improvements

- Added unit.test.ts with 12 tests for Unit singleton
- Improved code coverage with istanbul ignore comments for intentional unreachable code
- Reorganized tests into unit/ and types/ subdirectories

### Other Changes

- Updated ESLint configuration to exclude *.test-d.ts files
- Improved swap() function documentation explaining type limitations

### Stats

- 513 tests (up from 501)
- 16 test files (up from 10)
- 5 type test files (new)
