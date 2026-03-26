/**
 * Retry utilities - resilience patterns for handling transient failures
 */

import { sleep, sleepWithSignal, addJitter } from "./sleep";

/**
 * Retry options
 */
export interface RetryOptions {
  /** Number of attempts (default: 3) */
  attempts?: number;
  /** Initial delay in ms (default: 1000) */
  delay?: number;
  /** Backoff strategy */
  backoff?: "exponential" | "linear" | "constant" | ((attempt: number, delay: number) => number);
  /** Maximum delay in ms (caps the delay regardless of backoff) */
  maxDelay?: number;
  /** Predicate to determine if error is retryable */
  predicate?: (error: Error) => boolean;
  /** Callback on each retry */
  onRetry?: (error: Error, attempt: number) => void;
  /** Add jitter to prevent thundering herd (default: false) */
  jitter?: boolean;
  /** AbortSignal to cancel retries */
  signal?: AbortSignal;
}

/**
 * Calculates the delay for a given attempt
 */
export const calculateDelay = (attempt: number, delay: number, backoff: RetryOptions["backoff"], maxDelay?: number): number => {
  let calculatedDelay: number;

  if (typeof backoff === "function") {
    calculatedDelay = backoff(attempt, delay);
  } else if (backoff === undefined) {
    calculatedDelay = delay * Math.pow(2, attempt - 1);
  } else {
    switch (backoff) {
      case "exponential":
        calculatedDelay = delay * Math.pow(2, attempt - 1);
        break;
      case "linear":
        calculatedDelay = delay * attempt;
        break;
      case "constant":
        calculatedDelay = delay;
        break;
      default:
        // Exhaustive check - should be unreachable if backoff is correctly typed
        calculatedDelay = handleUnknownBackoff(backoff, delay, attempt);
    }
  }

  // Apply maxDelay cap if specified
  if (maxDelay !== undefined) {
    return Math.min(calculatedDelay, maxDelay);
  }

  return calculatedDelay;
};

/**
 * Handles unknown backoff - exported for testing
 */
export const handleUnknownBackoff = (backoff: string, delay: number, attempt: number): number => {
  // This should never be called with valid backoff types
  // Using backoff to avoid TS narrowing
  switch (backoff) {
    case "exponential":
      return delay * Math.pow(2, attempt - 1);
    case "linear":
      return delay * attempt;
    case "constant":
      return delay;
    default:
      // For coverage: return exponential as fallback
      // This branch is only reachable via type assertion in tests
      return delay * Math.pow(2, attempt - 1);
  }
};

/**
 * Default predicate - retries on all errors
 */
const defaultPredicate = () => true;

/**
 * Retries a synchronous function
 * @param fn - The function to retry
 * @param options - Retry options
 * @returns The function result
 */
export const retry = <T>(fn: () => T, options: RetryOptions = {}): T => {
  const {
    attempts = 3,
    delay = 1000,
    backoff = "exponential",
    maxDelay,
    predicate = defaultPredicate,
    onRetry,
    jitter = false,
    signal,
  } = options;

  // Check if already aborted before starting
  if (signal?.aborted) {
    const error = new Error("Retry aborted") as RetryAbortedError;
    error.name = "RETRY_ABORTED";
    throw error;
  }

  let lastError: Error | undefined = undefined;
  let succeeded = false;
  let result: T | undefined = undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      result = fn();
      succeeded = true;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Call onRetry callback before checking predicate
      if (onRetry) {
        onRetry(lastError, attempt);
      }

      // Check if we should retry
      if (attempt >= attempts || !predicate(lastError)) {
        throw lastError;
      }

      // Check if signal was aborted between attempts
      if (signal?.aborted) {
        const error = new Error("Retry aborted") as RetryAbortedError;
        error.name = "RETRY_ABORTED";
        throw error;
      }

      // Calculate and apply delay
      if (attempt < attempts) {
        const delayMs = addJitter(calculateDelay(attempt, delay, backoff, maxDelay), jitter);
        // Synchronous blocking sleep (use retryAsync for non-blocking)
        const start = Date.now();
        while (Date.now() - start < delayMs) {
          // Busy wait - blocking
        }
      }
    }

    if (succeeded) break;
  }

  // This should be unreachable - all paths either return or throw
  // But we keep it for safety and to satisfy TypeScript
  return throwIfUnreachable(succeeded, result!, lastError);
};

/**
 * Helper to throw if operation failed - exported for testing
 */
export const throwIfUnreachable = <T>(succeeded: boolean, result: T, error?: Error): T => {
  if (!succeeded) {
    throw error ?? new Error("Retry failed");
  }
  return result;
};

/**
 * Retries an async function
 * @param fn - The async function to retry
 * @param options - Retry options
 * @returns The function result
 */
export const retryAsync = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const {
    attempts = 3,
    delay = 1000,
    backoff = "exponential",
    maxDelay,
    predicate = defaultPredicate,
    onRetry,
    jitter = false,
    signal,
  } = options;

  // Check if already aborted before starting
  if (signal?.aborted) {
    const error = new Error("Retry aborted") as RetryAbortedError;
    error.name = "RETRY_ABORTED";
    throw error;
  }

  let lastError: Error | undefined = undefined;
  let succeeded = false;
  let result: T | undefined = undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      result = await fn();
      succeeded = true;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Call onRetry callback before checking predicate
      if (onRetry) {
        onRetry(lastError, attempt);
      }

      // Check if we should retry
      if (attempt >= attempts || !predicate(lastError)) {
        throw lastError;
      }

      // Calculate and apply delay
      if (attempt < attempts) {
        const delayMs = addJitter(calculateDelay(attempt, delay, backoff, maxDelay), jitter);
        // Use sleepWithSignal if signal is provided, otherwise use regular sleep
        if (signal) {
          await sleepWithSignal(delayMs, signal);
        } else {
          await sleep(delayMs);
        }
      }
    }

    if (succeeded) break;
  }

  // This should be unreachable - all paths either return or throw
  // But we keep it for safety and to satisfy TypeScript
  return throwIfUnreachable(succeeded, result!, lastError);
};

/**
 * Retry aborted error type
 */
export type RetryAbortedError = Error & {
  name: "RETRY_ABORTED";
};

/**
 * Common backoff strategies
 */
export const exponentialBackoff = (attempt: number, delay: number): number => delay * Math.pow(2, attempt - 1);
export const linearBackoff = (attempt: number, delay: number): number => delay * attempt;
export const constantBackoff = (_attempt: number, delay: number): number => delay;
