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
 * Common backoff strategies
 */
export const exponentialBackoff = (attempt: number, delay: number): number => delay * Math.pow(2, attempt - 1);
export const linearBackoff = (attempt: number, delay: number): number => delay * attempt;
export const constantBackoff = (_attempt: number, delay: number): number => delay;

/**
 * Retry aborted error
 */
export class RetryAbortedError extends Error {
  constructor(message: string = "Retry aborted") {
    super(message);
    this.name = "RetryAbortedError";
    // Maintains proper stack trace in V8 engines (Node.js)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((Error as any).captureStackTrace) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Error as any).captureStackTrace(this, RetryAbortedError);
    }
  }
}

/**
 * Default predicate - retries on all errors
 */
const defaultPredicate = () => true;

/**
 * Calculates the delay for a given attempt
 */
export const calculateDelay = (
  attempt: number,
  delay: number,
  backoff: RetryOptions["backoff"] = "exponential",
  maxDelay?: number
): number => {
  let calculatedDelay: number;

  if (typeof backoff === "function") {
    calculatedDelay = backoff(attempt, delay);
  } else {
    switch (backoff) {
      case "exponential":
        calculatedDelay = exponentialBackoff(attempt, delay);
        break;
      case "linear":
        calculatedDelay = linearBackoff(attempt, delay);
        break;
      case "constant":
        calculatedDelay = constantBackoff(attempt, delay);
        break;
      default: {
        // Exhaustive check: ensures all backoff strings are handled at compile time
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _exhaustiveCheck: never = backoff;
        void _exhaustiveCheck;
        calculatedDelay = exponentialBackoff(attempt, delay); // Fallback for runtime safety
      }
    }
  }

  return maxDelay !== undefined ? Math.min(calculatedDelay, maxDelay) : calculatedDelay;
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

  if (signal?.aborted) throw new RetryAbortedError();

  let lastError: Error;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(); // Early return on success
    } catch (error: unknown) {
      // If aborted during execution, exit immediately before doing any retry logic
      if (signal?.aborted) throw new RetryAbortedError();

      // Normalize error
      lastError = error instanceof Error ? error : new Error(String(error));

      // Fire callbacks
      if (onRetry) onRetry(lastError, attempt);

      // Check if we should stop retrying
      if (attempt >= attempts || !predicate(lastError)) {
        throw lastError;
      }

      // Calculate delay and sleep
      const delayMs = addJitter(calculateDelay(attempt, delay, backoff, maxDelay), jitter);
      if (signal) {
        await sleepWithSignal(delayMs, signal);
      } else {
        await sleep(delayMs);
      }
    }
  }

  // Unreachable - TypeScript safety
  throw lastError!;
};

/**
 * Retries a synchronous function.
 *
 * DANGER: If delay > 0, this uses a while-loop busy-wait that will COMPLETELY BLOCK
 * the JavaScript event loop. Do not use this on a Node.js web server or Browser UI thread
 * unless delay is 0. Use `retryAsync` instead whenever possible.
 *
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

  if (signal?.aborted) throw new RetryAbortedError();

  let lastError: Error;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return fn(); // Early return on success
    } catch (error: unknown) {
      if (signal?.aborted) throw new RetryAbortedError();

      lastError = error instanceof Error ? error : new Error(String(error));

      if (onRetry) onRetry(lastError, attempt);

      if (attempt >= attempts || !predicate(lastError)) {
        throw lastError;
      }

      const delayMs = addJitter(calculateDelay(attempt, delay, backoff, maxDelay), jitter);

      if (delayMs > 0) {
        // Synchronous blocking sleep
        const start = Date.now();
        while (Date.now() - start < delayMs) {
          // Check signal inside busy-wait to allow early abort from other threads/events
          if (signal?.aborted) throw new RetryAbortedError();
        }
      }
    }
  }

  // Unreachable - TypeScript safety
  throw lastError!;
};
