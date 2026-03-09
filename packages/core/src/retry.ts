/**
 * Retry utilities - resilience patterns for handling transient failures
 */

import { sleep } from "./sleep.js";

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
  /** Predicate to determine if error is retryable */
  predicate?: (error: Error) => boolean;
  /** Callback on each retry */
  onRetry?: (error: Error, attempt: number) => void;
  /** Add jitter to prevent thundering herd (default: false) */
  jitter?: boolean;
}

/**
 * Calculates the delay for a given attempt
 */
const calculateDelay = (attempt: number, delay: number, backoff: RetryOptions["backoff"]): number => {
  if (typeof backoff === "function") {
    return backoff(attempt, delay);
  }

  switch (backoff) {
    case "exponential":
      return delay * Math.pow(2, attempt - 1);
    case "linear":
      return delay * attempt;
    case "constant":
      return delay;
    default:
      return delay * Math.pow(2, attempt - 1);
  }
};

/**
 * Adds jitter to delay
 */
const addJitter = (delay: number, jitter?: boolean): number => {
  if (!jitter) return delay;
  // Random value between 0.5 and 1.5 of the delay
  return delay * (0.5 + Math.random());
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
    predicate = defaultPredicate,
    onRetry,
    jitter = false,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return fn();
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
        const delayMs = addJitter(calculateDelay(attempt, delay, backoff), jitter);
        // Synchronous blocking sleep (use retryAsync for non-blocking)
        const start = Date.now();
        while (Date.now() - start < delayMs) {
          // Busy wait - blocking
        }
      }
    }
  }
  // This line is unreachable - the loop always returns or throws
  throw new Error("Retry failed");
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
    predicate = defaultPredicate,
    onRetry,
    jitter = false,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
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
        const delayMs = addJitter(calculateDelay(attempt, delay, backoff), jitter);
        await sleep(delayMs);
      }
    }
  }
  // This line is unreachable - the loop always returns or throws
  throw new Error("Retry failed");
};

/**
 * Common backoff strategies
 */
export const exponentialBackoff = (attempt: number, delay: number): number => delay * Math.pow(2, attempt - 1);
export const linearBackoff = (attempt: number, delay: number): number => delay * attempt;
export const constantBackoff = (_attempt: number, delay: number): number => delay;
