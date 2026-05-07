/**
 * Timeout module - deadline-based timeout for Result operations
 */

import { error } from "./error/builder.js";
import  { type Error } from "./error/types.js";
import { err, type Result } from "./result/index.js";

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * TimeoutError - structured error for timeout operations
 * Created via error() builder for consistency with the error system
 */
export const TimeoutError = error({
  name: "TimeoutError",
  message: (args: { deadline: number; elapsed: number; operation: string }) =>
    args.operation
      ? `TimeoutError: ${args.operation} timed out after ${args.elapsed}ms (deadline: ${args.deadline}ms)`
      : `TimeoutError: Operation timed out after ${args.elapsed}ms (deadline: ${args.deadline}ms)`,
});

/**
 * AbortError - structured error for aborted operations
 * Created via error() builder (not a class) per issue specification
 */
export const AbortError = error({
  name: "AbortError",
  message: (args: { reason?: unknown }) =>
    args.reason ? `Operation aborted: ${String(args.reason)}` : "Operation aborted",
});

// ============================================================================
// TYPES
// ============================================================================

/**
 * Info passed to timeout error constructor/function
 */
export interface TimeoutInfo {
  deadline: number;
  elapsed: number;
  operation: string;
}

/**
 * Options for Result.timeout()
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error (must extend Error)
 */
export interface TimeoutOptions<T, E extends Error = Error> {
  /** Maximum time in ms (> 0) */
  deadline: number;
  /** Custom timeout error - ErrorConstructor or function that creates TaggedError */
  timeout?: ErrorConstructor | ((info: TimeoutInfo) => Error);
  /** External AbortSignal to respect */
  abortSignal?: AbortSignal;
  /** Fallback result on timeout */
  onTimeout?: () => Result<T, E>;
  /** What to do with underlying operation on timeout: 'abort' (default) or 'continue' */
  resume?: "abort" | "continue";
  /** Operation name for error messages */
  operationName?: string;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Normalizes a timeout error constructor/function to a consistent Error creator
 */
const normalizeTimeoutError = <T, E extends Error>(
  timeout: TimeoutOptions<T, E>["timeout"],
  info: TimeoutInfo
): Error => {
  if (typeof timeout === "function") {
    // Check if it's an ES6 class constructor by checking prototype
    if (timeout.prototype && timeout.prototype.constructor === timeout) {
      // It's a constructor - use Reflect.construct to support ES6 classes
       
      return Reflect.construct(timeout as unknown as new (args: TimeoutInfo) => Error, [info]) as Error;
    }
    // It's a regular function or factory function
     
    return (timeout as (info: TimeoutInfo) => Error)(info);
  }
  // Default to library TimeoutError
  return TimeoutError(info) as Error;
};

/**
 * Checks if an error is an AbortError (from our error builder)
 */
const isAbortError = (error: unknown): error is Error => {
  if (error && typeof error === "object" && "name" in error) {
    return (error as Error).name === "AbortError";
  }
  return false;
};

/**
 * Checks if an error is a TimeoutError (from our error builder or legacy)
 */
const isTimeoutError = (error: unknown): error is Error => {
  if (error && typeof error === "object" && "name" in error) {
    const name = (error as Error).name;
    return name === "TimeoutError" || name === "TIMEOUT";
  }
  return false;
};

/**
 * Applies a timeout to an async operation, returning a Result
 *
 * @param operation - The async operation to timeout (can be Promise or async function)
 * @param options - Timeout options including deadline
 * @returns Promise<Result<T, E | TimeoutError | AbortError>>
 *
 * @example
 * // Basic usage
 * const result = await Result.timeout(
 *   fetchUser(id),
 *   { deadline: 5000, operationName: 'fetchUser' }
 * );
 *
 * @example
 * // With custom error and fallback
 * const result = await Result.timeout(
 *   fetchHeavyQuery(),
 *   {
 *     deadline: 5000,
 *     timeout: CustomTimeoutError,
 *     onTimeout: () => Result.ok(cachedData)
 *   }
 * );
 */
export const timeout = async <T, E extends Error = Error>(
  operation: Promise<Result<T, E>>,
  options: TimeoutOptions<T, E>
): Promise<Result<T, E>> => {
  const { deadline, timeout: timeoutError, abortSignal, onTimeout, resume = "abort", operationName } = options;

  // Handle deadline boundary values
  // deadline <= 0: Returns Err<TimeoutError> immediately with elapsed: 0
  if (deadline <= 0) {
    return err(
      normalizeTimeoutError(timeoutError, {
        deadline,
        elapsed: 0,
        operation: operationName ?? "",
      }) as E
    );
  }

  // deadline === Infinity: No timeout applied, behaves like plain operation
  if (!Number.isFinite(deadline)) {
    // If external signal is provided, wrap with it
    if (abortSignal) {
      if (abortSignal.aborted) {
        return err(AbortError({ reason: abortSignal.reason }) as unknown as E);
      }
      return new Promise<Result<T, E>>((resolve) => {
        const abortHandler = () => {
          resolve(err(AbortError({ reason: abortSignal.reason }) as unknown as E));
        };
        abortSignal.addEventListener("abort", abortHandler, { once: true });
        operation.then(
          (result) => {
            abortSignal.removeEventListener("abort", abortHandler);
            resolve(result);
          },
          (error_) => {
            abortSignal.removeEventListener("abort", abortHandler);
            resolve(err(error_ as unknown as E));
          }
        );
      });
    }
    return operation;
  }

  // deadline > 0: Normal timeout behavior
  const startTime = Date.now();

  // If external signal is already aborted, return immediately
  if (abortSignal?.aborted) {
    return err(AbortError({ reason: abortSignal.reason }) as unknown as E);
  }

  // Create internal AbortController for timeout
  const internalController = new AbortController();

  // Create a promise that rejects on external abort signal
  const externalAbortPromise = abortSignal
    ? new Promise<never>((_, reject) => {
        const handler = () => {
          reject(AbortError({ reason: abortSignal.reason }));
        };
        abortSignal.addEventListener("abort", handler, { once: true });
      })
    : new Promise<never>(() => {
        // Never resolves when no abort signal
      });

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const elapsed = Date.now() - startTime;

      if (resume === "abort") {
        // Signal operation to stop
        internalController.abort();
      }

      reject(
        normalizeTimeoutError(timeoutError, {
          deadline,
          elapsed,
          operation: operationName ?? "",
        })
      );
    }, deadline);
  });

  // Race between operation, external abort, and timeout
  try {
    const result = await Promise.race([operation, Promise.race([externalAbortPromise, timeoutPromise])]);
    return result;
  } catch (error) {
    // Check if it's an AbortError (from external signal)
    if (isAbortError(error)) {
      return err(AbortError({ reason: abortSignal?.reason }) as unknown as E);
    }

    // It's a TimeoutError - check for fallback
    if (isTimeoutError(error) && onTimeout) {
      return onTimeout();
    }

    // Re-throw as Err
    if (error && typeof error === "object" && "name" in error) {
      return err(error as unknown as E);
    }

    // Should not happen - create a generic timeout error
    const elapsed = Date.now() - startTime;
    return err(
      normalizeTimeoutError(timeoutError, {
        deadline,
        elapsed,
        operation: operationName ?? "",
      }) as unknown as E
    );
  }
};