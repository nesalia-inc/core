/**
 * Retry utilities - resilience patterns for handling transient failures
 */

import { sleep, sleepWithSignal, addJitter } from "./sleep.js";
import { error } from "./error/builder.js";
import { ok, err, type Ok, type Result } from "./result/index.js";
import { type Error } from "./error/types.js";

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Retry aborted error - signal was aborted during retry
 */
export const RetryAbortedError = error({ name: "RetryAbortedError" });

/**
 * Retry timeout error - maxTotalTime exceeded
 */
export const RetryTimeoutError = error({ name: "RetryTimeoutError" });

// ============================================================================
// TYPES
// ============================================================================

/**
 * Jitter configuration for preventing thundering herd
 */
export interface JitterConfig {
  /** Enable jitter (default: true) */
  enabled: boolean;
  /** Jitter factor - how much variance (default: 0.3, range 0-1) */
  factor: number;
}

/**
 * Retry hooks for observability
 * @typeParam T - The type of the success value
 * @typeParam E - The type of the error (must be a library Error)
 */
export interface RetryHooks<T, E extends Error = Error> {
  /** Called before each retry attempt */
  onRetry?: (attempt: number, error: E, delay: number) => void;
  /** Called when operation succeeds */
  onSuccess?: (result: Ok<T, E>, attemptCount: number) => void;
  /** Called when all attempts fail */
  onFailure?: (error: E, attemptCount: number, allErrors: readonly E[]) => void;
}

/**
 * Retry policy options
 * @typeParam E - The type of the error (must be a library Error)
 */
export interface RetryPolicyOptions<E extends Error = Error> {
  /** Maximum attempts (including first) - default: 3 */
  maxAttempts?: number;
  /** Initial delay in ms - default: 100 */
  initialDelay?: number;
  /** Maximum delay cap in ms - default: 5000 */
  maxDelay?: number;
  /** Global deadline in ms - default: undefined (no limit) */
  maxTotalTime?: number;
  /** Exponential backoff multiplier - default: 2 */
  backoffMultiplier?: number;
  /** Jitter configuration - default: { enabled: true, factor: 0.3 } */
  jitter?: JitterConfig;
  /** Filter which errors trigger retry - default: () => true */
  shouldRetry?: (error: E) => boolean;
  /** Observability hooks */
  hooks?: RetryHooks<unknown, E>;
}

/**
 * Retry policy - immutable configuration for retry behavior
 * @typeParam E - The type of the error (must be a library Error)
 */
export interface RetryPolicy<E extends Error = Error> {
  readonly maxAttempts: number;
  readonly initialDelay: number;
  readonly maxDelay: number;
  readonly maxTotalTime: number | undefined;
  readonly backoffMultiplier: number;
  readonly jitter: JitterConfig;
  readonly shouldRetry: (error: E) => boolean;
  readonly hooks: RetryHooks<unknown, E>;
}

// ============================================================================
// BUILDER
// ============================================================================

/**
 * Default retry policy
 */
const defaultRetryPolicy = <E extends Error>(): RetryPolicy<E> => ({
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 5000,
  maxTotalTime: undefined,
  backoffMultiplier: 2,
  jitter: { enabled: true, factor: 0.3 },
  shouldRetry: () => true,
  hooks: {},
});

type CreateRetryPolicy = <E extends Error>(options: RetryPolicyOptions<E>) => RetryPolicy<E>;

/**
 * Creates a retry policy with configurable options
 * @typeParam E - The type of the error
 * @param options - Retry policy options
 * @returns A retry policy
 *
 * @example
 * const policy = retryPolicy({ maxAttempts: 5, initialDelay: 50 });
 */
export const retryPolicy: CreateRetryPolicy = <E extends Error>(options: RetryPolicyOptions<E> = {}): RetryPolicy<E> => {
  const defaults = defaultRetryPolicy<E>();
  return {
    maxAttempts: options.maxAttempts ?? defaults.maxAttempts,
    initialDelay: options.initialDelay ?? defaults.initialDelay,
    maxDelay: options.maxDelay ?? defaults.maxDelay,
    maxTotalTime: options.maxTotalTime ?? defaults.maxTotalTime,
    backoffMultiplier: options.backoffMultiplier ?? defaults.backoffMultiplier,
    jitter: options.jitter ?? defaults.jitter,
    shouldRetry: options.shouldRetry ?? defaults.shouldRetry,
    hooks: options.hooks ?? defaults.hooks,
  };
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalizes an unknown error into a library Error
 */
const normalizeError = (error: unknown): Error =>
  error instanceof globalThis.Error ? (error as Error) : (new globalThis.Error(String(error)) as Error);

/**
 * Calculates delay with backoff and jitter
 * Formula: delay = min(initialDelay * (backoffMultiplier ^ (attempt - 1)), maxDelay)
 * Jitter: actualDelay = delay * (1 - jitter.factor + (random() * jitter.factor * 2))
 */
const calculateRetryDelay = (
  attempt: number,
  initialDelay: number,
  backoffMultiplier: number,
  maxDelay: number,
  jitter: JitterConfig
): number => {
  // Calculate exponential backoff
  const delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);

  // Apply jitter if enabled
  if (!jitter.enabled) {
    return delay;
  }

  // Jitter: delay * (1 - factor + random * factor * 2)
  // This gives a range of [delay * (1 - factor), delay * (1 + factor)]
  const factor = Math.max(0, Math.min(1, jitter.factor));
  // Math.random is acceptable here - it's for jitter, not security
  // eslint-disable-next-line sonarjs/pseudo-random
  return delay * (1 - factor + Math.random() * factor * 2);
};

/**
 * Checks if an error should be retried based on the shouldRetry predicate
 */
const shouldRetryError = <E extends Error>(error: E, shouldRetry: (error: E) => boolean): boolean => {
  try {
    return shouldRetry(error);
  } catch {
    // If shouldRetry throws, don't retry
    return false;
  }
};

// ============================================================================
// SYNC RETRY
// ============================================================================

/**
 * Checks if maxTotalTime deadline has been exceeded
 */
const isDeadlineExceeded = (startTime: number, maxTotalTime: number | undefined): boolean =>
  maxTotalTime !== undefined && Date.now() - startTime >= maxTotalTime;

/**
 * Handles a single attempt in sync retry - returns the error if should stop, null if should continue
 */
const handleSyncAttempt = <T>(
  attempt: number,
  policy: RetryPolicy<Error>,
  fn: () => T,
  signal: AbortSignal | undefined,
  startTime: number,
  allErrors: Error[]
): { done: true; result: Result<T, Error> } | { done: false } => {
  // Check maxTotalTime deadline
  if (isDeadlineExceeded(startTime, policy.maxTotalTime)) {
    const elapsed = Date.now() - startTime;
    return { done: true, result: err(RetryTimeoutError({ elapsed, maxTotalTime: policy.maxTotalTime as number })) };
  }

  try {
    const result = fn();

    // Call onSuccess hook if provided
    if (policy.hooks.onSuccess) {
      policy.hooks.onSuccess(ok(result) as Ok<unknown, Error>, attempt);
    }

    return { done: true, result: ok(result) };
  } catch (error_: unknown) {
    const error = normalizeError(error_);
    allErrors.push(error);

    // Check if should retry this error - if not, return error immediately
    if (!shouldRetryError(error, policy.shouldRetry)) {
      return handleSyncFailure(error, attempt, allErrors, policy.hooks);
    }

    // Check abort signal
    if (signal?.aborted) {
      return { done: true, result: err(RetryAbortedError({})) };
    }

    // If not last attempt, sleep with delay
    if (attempt < policy.maxAttempts) {
      const delay = calculateRetryDelay(attempt, policy.initialDelay, policy.backoffMultiplier, policy.maxDelay, policy.jitter);
      return handleSyncRetryDelay(delay, error, attempt, signal, policy.hooks);
    }

    return { done: false };
  }
};

/**
 * Handles sync failure case - calls onFailure hook and returns error result
 */
const handleSyncFailure = <T>(
  error: Error,
  attempt: number,
  allErrors: Error[],
  hooks: RetryPolicy<Error>["hooks"]
): { done: true; result: Result<T, Error> } => {
  if (hooks.onFailure) {
    hooks.onFailure(error, attempt, allErrors);
  }
  return { done: true, result: err(error) };
};

/**
 * Handles sync retry delay - sleeps and checks abort, returns done status
 */
const handleSyncRetryDelay = <T>(
  delay: number,
  error: Error,
  attempt: number,
  signal: AbortSignal | undefined,
  hooks: RetryPolicy<Error>["hooks"]
): { done: true; result: Result<T, Error> } | { done: false } => {
  // Call onRetry hook before sleeping
  if (hooks.onRetry) {
    hooks.onRetry(attempt, error, delay);
  }

  // Sleep for the delay (busy wait to maintain sync nature)
  const sleepStart = Date.now();
  while (Date.now() - sleepStart < delay) {
    if (signal?.aborted) {
      return { done: true, result: err(RetryAbortedError({})) };
    }
  }

  return { done: false };
};

type RetryFn = <T>(policy: RetryPolicy<Error>, fn: () => T, signal?: AbortSignal) => Result<T, Error>;

/**
 * Retries a sync operation using a retry policy
 * @typeParam T - The type of the operation result
 * @param policy - The retry policy
 * @param fn - The sync function to retry
 * @param signal - Optional AbortSignal to cancel retries
 * @returns Result<T, Error>
 *
 * @example
 * const result = retry(retryPolicy({ maxAttempts: 3 }), () => doSomething());
 */
export const retry: RetryFn = <T>(
  policy: RetryPolicy<Error>,
  fn: () => T,
  signal?: AbortSignal
): Result<T, Error> => {
  if (signal?.aborted) {
    return err(RetryAbortedError({}));
  }

  const startTime = Date.now();
  const allErrors: Error[] = [];

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    const outcome = handleSyncAttempt<T>(attempt, policy, fn, signal, startTime, allErrors);

    if (outcome.done) {
      return outcome.result;
    }
  }

  // All attempts exhausted - call onFailure and return last error
  const lastError = allErrors.at(-1);
  if (lastError && policy.hooks.onFailure) {
    policy.hooks.onFailure(lastError, policy.maxAttempts, allErrors);
  }
  return err(lastError as Error);
};

// ============================================================================
// ASYNC RETRY (with policy)
// ============================================================================

/**
 * Handles a single attempt in async retry - returns the error if should stop, null if should continue
 */
const handleAsyncAttempt = async <T>(
  attempt: number,
  policy: RetryPolicy<Error>,
  fn: () => Promise<T>,
  signal: AbortSignal | undefined,
  startTime: number,
  allErrors: Error[]
): Promise<{ done: true; result: Result<T, Error> } | { done: false }> => {
  // Check maxTotalTime deadline
  if (isDeadlineExceeded(startTime, policy.maxTotalTime)) {
    const elapsed = Date.now() - startTime;
    return { done: true, result: err(RetryTimeoutError({ elapsed, maxTotalTime: policy.maxTotalTime as number })) };
  }

  try {
    const result = await fn();

    // Call onSuccess hook if provided
    if (policy.hooks.onSuccess) {
      policy.hooks.onSuccess(ok(result) as Ok<unknown, Error>, attempt);
    }

    return { done: true, result: ok(result) };
  } catch (error_: unknown) {
    const error = normalizeError(error_);
    allErrors.push(error);

    // Check if should retry this error - if not, return error immediately
    if (!shouldRetryError(error, policy.shouldRetry)) {
      // Call onFailure hook
      if (policy.hooks.onFailure) {
        policy.hooks.onFailure(error, attempt, allErrors);
      }
      return { done: true, result: err(error) };
    }

    // Check abort signal
    if (signal?.aborted) {
      return { done: true, result: err(RetryAbortedError({})) };
    }

    // If not last attempt, sleep with delay
    if (attempt < policy.maxAttempts) {
      const delay = calculateRetryDelay(attempt, policy.initialDelay, policy.backoffMultiplier, policy.maxDelay, policy.jitter);

      // Call onRetry hook before sleeping
      if (policy.hooks.onRetry) {
        policy.hooks.onRetry(attempt, error, delay);
      }

      // Sleep for the delay
      await sleep(delay);
    }

    return { done: false };
  }
};

type RetryAsyncPolicyFn = <T>(policy: RetryPolicy<Error>, fn: () => Promise<T>, signal?: AbortSignal) => Promise<Result<T, Error>>;

/**
 * Retries an async operation using a retry policy
 * @typeParam T - The type of the operation result
 * @param policy - The retry policy
 * @param fn - The async function to retry
 * @param signal - Optional AbortSignal to cancel retries
 * @returns Promise<Result<T, Error>>
 *
 * @example
 * const result = await retryAsyncPolicy(retryPolicy({ maxAttempts: 3 }), async () => doSomething());
 */
export const retryAsyncPolicy: RetryAsyncPolicyFn = async <T>(
  policy: RetryPolicy<Error>,
  fn: () => Promise<T>,
  signal?: AbortSignal
): Promise<Result<T, Error>> => {
  if (signal?.aborted) {
    return err(RetryAbortedError({}));
  }

  const startTime = Date.now();
  const allErrors: Error[] = [];

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    const outcome = await handleAsyncAttempt<T>(attempt, policy, fn, signal, startTime, allErrors);

    if (outcome.done) {
      return outcome.result;
    }
  }

  // All attempts exhausted - call onFailure and return last error
  const lastError = allErrors.at(-1);
  if (lastError && policy.hooks.onFailure) {
    policy.hooks.onFailure(lastError, policy.maxAttempts, allErrors);
  }
  return err(lastError as Error);
};

// ============================================================================
// LEGACY API (backwards compatibility)
// ============================================================================

/**
 * Legacy retry options for backwards compatibility with existing retryAsync
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
  predicate?: (error: globalThis.Error) => boolean;
  /** Callback on each retry */
  onRetry?: (error: globalThis.Error, attempt: number) => void;
  /** Add jitter to prevent thundering herd (default: false) */
  jitter?: boolean;
  /** AbortSignal to cancel retries */
  signal?: AbortSignal;
}

/**
 * Common backoff strategies (legacy, for backwards compatibility)
 */
export const exponentialBackoff = (attempt: number, delay: number): number => delay * Math.pow(2, attempt - 1);
export const linearBackoff = (attempt: number, delay: number): number => delay * attempt;
export const constantBackoff = (_attempt: number, delay: number): number => delay;

/**
 * Calculates the delay for a given attempt (legacy, for backwards compatibility)
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
 * Checks if we should stop retrying based on attempt and predicate
 */
const shouldStopRetrying = (
  attempt: number,
  attempts: number,
  predicate: (error: globalThis.Error) => boolean,
  lastError: globalThis.Error
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
 * Handles a single retry attempt failure
 * Returns the error to throw if all retries are exhausted, undefined if should continue
 */
const handleRetryAttempt = (
  error: unknown,
  attempt: number,
  attempts: number,
  predicate: (error: globalThis.Error) => boolean,
  onRetry: ((error: globalThis.Error, attempt: number) => void) | undefined,
  signal: AbortSignal | undefined
): Error | undefined => {
  if (signal?.aborted) {
    throw RetryAbortedError({});
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
  predicate: (error: globalThis.Error) => boolean,
  onRetry: ((error: globalThis.Error, attempt: number) => void) | undefined,
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
 * Retries an async function (legacy API for backwards compatibility)
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
    predicate = () => true,
    onRetry,
    jitter = false,
    signal,
  } = options;

  if (signal?.aborted) throw RetryAbortedError({});

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
  throw RetryAbortedError({ message: "Exhausted retries" });
};

