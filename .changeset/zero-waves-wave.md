---
"@deessejs/core": minor
---

Release 0.4.0

## New Features

- **ExtractResultError**: Rename existing `ExtractError` to `ExtractResultError` for extracting error type from Result-returning functions
- **ExtractError**: Add new `ExtractError<T>` type for extracting `Error<T>` from `ErrorBuilder<T>` types
- **Typed match syntax**: Add object-based `match({ onSuccess, onError })` syntax support with full type inference for Result types
- **attempt() and attemptAsync() overloads**: Add custom error handler support to transform caught errors into typed errors

## Improvements

- Restructure `Try` module into folder structure following same pattern as other modules
- Add comprehensive README documentation for Try module
- Fix Maybe.toResult compatibility with Error type via proper casting

## Bug Fixes

- Fix type issues in Result builder for flatMap and mapErr methods
