/**
 * Try module - wraps try/catch in a type-safe way
 *
 * DEPRECATED: The Try type is deprecated. Use Result for synchronous operations
 * and AsyncResult for asynchronous operations instead.
 *
 * - attempt() returns Result<T, Error> instead of Try<T, Error>
 * - attemptAsync() returns AsyncResult<T, Error> instead of Promise<Try<T, Error>>
 */

// NOTE: Try type has been removed - use Result and AsyncResult instead
// attempt and attemptAsync are now the only exports (they return Result/AsyncResult)

export { attempt, attemptAsync } from "./builder.js";
