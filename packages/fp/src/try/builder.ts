/**
 * Try builder functions - wraps try/catch in a type-safe way
 *
 * DEPRECATED: The Try type has been removed. Use Result for synchronous operations
 * and AsyncResult for asynchronous operations instead.
 *
 * - attempt() returns Result<T, Error> instead of Try<T, Error>
 * - attemptAsync() returns AsyncResult<T, Error> instead of Promise<Try<T, Error>>
 */

import { ok, err, type Result } from "../result/index.js";
import { okAsync, errAsync, type AsyncResult } from "../async-result/index.js";
import type { Error } from "../error/types.js";

/**
 * Wraps a synchronous function in a try/catch
 * @typeParam T - The type of the value
 * @param fn - The function to try
 * @returns Result<T, Error>
 */
export function attempt<T>(fn: () => T): Result<T, Error>;
/**
 * Wraps a synchronous function in a try/catch with custom error handler
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error (must extend Error)
 * @param fn - The function to try
 * @param onError - Error handler to transform caught error into typed error
 * @returns Result<T, E>
 */
export function attempt<T, E extends Error>(fn: () => T, onError: (caught: Error) => E): Result<T, E>;
/**
 * Implementation
 */
export function attempt<T, E extends Error = Error>(
  fn: () => T,
  onError?: (caught: Error) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    const err_ = error instanceof Error ? error : new Error(String(error));
    // Cast to unknown first since native Error is not compatible with library Error
    const finalError = onError ? onError(err_ as unknown as Error) : (err_ as unknown as E);
    return err(finalError) as Result<T, E>;
  }
}

/**
 * Wraps an async function in a try/catch
 * @typeParam T - The type of the value
 * @param fn - The async function to try
 * @returns AsyncResult<T, Error>
 */
export function attemptAsync<T>(fn: () => Promise<T>): AsyncResult<T, Error>;
/**
 * Wraps an async function in a try/catch with custom error handler
 * @typeParam T - The type of the value
 * @typeParam E - The type of the error (must extend Error)
 * @param fn - The async function to try
 * @param onError - Error handler to transform caught error into typed error
 * @returns AsyncResult<T, E>
 */
export function attemptAsync<T, E extends Error>(
  fn: () => Promise<T>,
  onError: (caught: Error) => E
): AsyncResult<T, E>;
/**
 * Implementation
 */
export function attemptAsync<T, E extends Error = Error>(
  fn: () => Promise<T>,
  onError?: (caught: Error) => E
): AsyncResult<T, E> {
  return okAsync(null).then(async () => {
    return ok(await fn());
  }).catch((error) => {
    const err_ = error instanceof Error ? error : new Error(String(error));
    // Cast to unknown first since native Error is not compatible with library Error
    const finalError = onError ? onError(err_ as unknown as Error) : (err_ as unknown as E);
    return errAsync(finalError) as unknown as AsyncResult<T, E>;
  }) as unknown as AsyncResult<T, E>;
}
