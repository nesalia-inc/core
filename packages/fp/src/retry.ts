/**
 * Retry utilities - resilience patterns for handling transient failures
 */

import { sleep, sleepWithSignal, addJitter } from "./sleep.js";

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
 * Normalizes an unknown error into a standard Error
 */
const normalizeError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

/**
 * Checks if we should stop retrying based on attempt and predicate
 */
const shouldStopRetrying = (
  attempt: number,
  attempts: number,
  predicate: (error: Error) => boolean,
  lastError: Error
): boolean => attempt >= attempts || !predicate(lastError);

/**
 * Sleeps for the specified delay, respecting abort signal if provided
 */
const sleepForRetry = async (delayMs: number, signal?: AbortSignal): Promise<void> => {
  if (signal) {
    await sleepWithSignal(delayMs, signal);
  } else {
    await sleep(delayMs);
  }
};

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
        calculatedDelay = exponentialBackoff(attempt, delay);
        return calculatedDelay;
      }
    }
  }

  return maxDelay !== undefined ? Math.min(calculatedDelay, maxDelay) : calculatedDelay;
};

/**
 * Handles a single retry attempt failure
 * Returns the error to throw if all retries are exhausted, undefined if should continue
 */
const handleRetryAttempt = (
  error: unknown,
  attempt: number,
  attempts: number,
  predicate: (error: Error) => boolean,
  onRetry: ((error: Error, attempt: number) => void) | undefined,
  signal: AbortSignal | undefined
): Error | undefined => {
  if (signal?.aborted) {
    throw new RetryAbortedError();
  }

  const lastError = normalizeError(error);
  if (onRetry) {
    onRetry(lastError, attempt);
  }

  if (shouldStopRetrying(attempt, attempts, predicate, lastError)) {
    return lastError;
  }

  // eslint-disable-next-line @typescript-eslint/consistent-return -- Returning undefined is intentional here as sentinel to continue retrying
  return undefined;
};

/**
 * Computes retry delay with jitter
 */
const computeRetryDelay = (
  attempt: number,
  delay: number,
  backoff: RetryOptions["backoff"],
  maxDelay: number | undefined,
  jitter: boolean
): number => addJitter(calculateDelay(attempt, delay, backoff, maxDelay), jitter);

/**
 * Executes a single retry attempt with error handling
 * Returns the error to throw if should stop, undefined if should continue
 */
const executeRetryAttempt = async (
  error: unknown,
  attempt: number,
  attempts: number,
  delay: number,
  backoff: RetryOptions["backoff"],
  maxDelay: number | undefined,
  predicate: (error: Error) => boolean,
  onRetry: ((error: Error, attempt: number) => void) | undefined,
  jitter: boolean,
  signal: AbortSignal | undefined
): Promise<Error | undefined> => {
  const errorToThrow = handleRetryAttempt(error, attempt, attempts, predicate, onRetry, signal);

  if (errorToThrow) {
    return errorToThrow;
  }

  const delayMs = computeRetryDelay(attempt, delay, backoff, maxDelay, jitter);
  await sleepForRetry(delayMs, signal);

  // eslint-disable-next-line @typescript-eslint/consistent-return -- Returning undefined is intentional here as sentinel to continue retrying
  return undefined;
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

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop -- Must wait for each attempt to complete before retrying
      return await fn();
    } catch (error: unknown) {
      // eslint-disable-next-line no-await-in-loop -- Must wait for delay between retry attempts
      const errorToThrow = await executeRetryAttempt(
        error,
        attempt,
        attempts,
        delay,
        backoff,
        maxDelay,
        predicate,
        onRetry,
        jitter,
        signal
      );

      if (errorToThrow) {
        throw errorToThrow;
      }
    }
  }

  // istanbul ignore next - TypeScript exhaustive check, unreachable at runtime
  throw new RetryAbortedError("Exhausted retries");
};

