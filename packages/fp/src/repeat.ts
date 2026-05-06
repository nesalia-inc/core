/**
 * Repeat utilities - executing operations multiple times with collection, early termination, and predicate-based iteration
 */

/* eslint-disable sonarjs/cognitive-complexity -- Complex polling logic inherently requires higher complexity */

import { sleep } from "./sleep.js";
import { error } from "./error/builder.js";
import { ok, err, type Result } from "./result/index.js";
import { type Maybe } from "./maybe/index.js";
import { type Error } from "./error/types.js";

// ============================================================================
// ERROR TYPES
// ============================================================================

export const RepeatExhaustedError = error({
  name: "RepeatExhaustedError",
  message: (args: { attempts: number; errors: unknown[] }) =>
    `Repeat exhausted after ${args.attempts} attempts: ${args.errors.length} error(s)`
});

export const InvalidRepeatOptionsError = error({
  name: "InvalidRepeatOptionsError",
  message: (args: { count: number }) => `Invalid repeat count: ${args.count}. Must be >= 0`
});

export const RepeatedUntilError = error({
  name: "RepeatedUntilError",
  message: (args: { attempts: number; lastValue: unknown; predicate: string }) =>
    `Predicate '${args.predicate}' not satisfied after ${args.attempts} attempts. Last value: ${JSON.stringify(args.lastValue)}`
});

/**
 * Abort error - operation was aborted
 * Note: This duplicates AbortError from timeout.ts to avoid circular dependencies.
 * The public API exports AbortError from timeout.ts.
 */
const AbortError = error({
  name: "AbortError",
  message: () => "Operation aborted"
});

// ============================================================================
// TYPES
// ============================================================================

export interface RepeatOptions {
  /** Number of repetitions (must be >= 0) */
  count: number;
  /** Delay between attempts in ms (default: 0) */
  delay?: number | ((attempt: number) => number);
  /** Stop on first error (default: false) */
  stopOnError?: boolean;
  /** Collect errors alongside values (default: false) */
  continueOnError?: boolean;
  /** AbortSignal to cancel the operation */
  abortSignal?: AbortSignal;
  /** Called before each attempt */
  onAttempt?: (attempt: number) => void;
}

export interface RepeatUntilOptions<T = unknown> {
  /** Maximum attempts (default: Infinity) */
  maxAttempts?: number;
  /** Delay between attempts in ms (default: 0) */
  delay?: number | ((attempt: number) => number);
  /** AbortSignal to cancel the operation */
  abortSignal?: AbortSignal;
  /** Called after each attempt with the attempt number and value */
  onAttempt?: (attempt: number, value: T) => void;
}

export interface RepeatedIsSomeOptions<T = unknown> {
  /** Maximum attempts (default: Infinity) */
  maxAttempts?: number;
  /** Delay between attempts in ms (default: 0) */
  delay?: number | ((attempt: number) => number);
  /** AbortSignal to cancel the operation */
  abortSignal?: AbortSignal;
  /** Called after each attempt with the attempt number and Maybe result */
  onAttempt?: (attempt: number, value: Maybe<T>) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

type DelayFn = number | ((attempt: number) => number) | undefined;

const getDelay = (delay: DelayFn, attempt: number): number => {
  if (typeof delay === "function") {
    return delay(attempt);
  }
  if (delay !== undefined && delay < 0) {
    return 0;
  }
  return delay ?? 0;
};

const normalizeError = (error: unknown): Error =>
  error instanceof globalThis.Error ? (error as Error) : (new globalThis.Error(String(error)) as Error);

const isAborted = (signal: AbortSignal | undefined): boolean => signal?.aborted ?? false;

const sleepIfNeeded = async (attempt: number, count: number, delay: DelayFn): Promise<void> => {
  if (attempt < count && getDelay(delay, attempt) > 0) {
    await sleep(getDelay(delay, attempt));
  }
};

// ============================================================================
// REPEAT
// ============================================================================

export const repeat = async <T, E extends Error = Error>(
  operation: () => Promise<Result<T, E>>,
  options: RepeatOptions
): Promise<Result<T[], Error | E>> => {
  const { count, delay, stopOnError = false, continueOnError = false, abortSignal, onAttempt } = options;

  if (count === 0) {
    return ok([]);
  }

  if (count < 0) {
    return err(InvalidRepeatOptionsError({ count }));
  }

  if (isAborted(abortSignal)) {
    return err(AbortError({}));
  }

  const results: (T | Error)[] = [];
  const errors: E[] = [];

  for (let attempt = 1; attempt <= count; attempt++) {
    if (isAborted(abortSignal)) {
      return err(AbortError({}));
    }

    onAttempt?.(attempt);

    try {
      const result = await operation();

      if (result.ok) {
        results.push(result.value);
      } else {
        errors.push(result.error);

        if (stopOnError) {
          return err(result.error);
        }

        if (continueOnError) {
          results.push(result.error);
        } else {
          continue;
        }
      }
    } catch (error_: unknown) {
      const err_ = normalizeError(error_);
      errors.push(err_ as E);

      if (stopOnError) {
        return err(err_ as E);
      }

      if (continueOnError) {
        results.push(err_);
      } else {
        continue;
      }
    }

    await sleepIfNeeded(attempt, count, delay);
  }

  if (!stopOnError && !continueOnError && errors.length > 0) {
    return err(RepeatExhaustedError({ attempts: count, errors }) as Error);
  }

  return ok(results as T[]);
};

// ============================================================================
// REPEAT UNTIL
// ============================================================================

export const repeatUntil = async <T, E extends Error = Error>(
  operation: () => Promise<Result<T, E>>,
  predicate: (value: T) => boolean,
  options: RepeatUntilOptions = {}
): Promise<Result<T, E | Error>> => {
  const { maxAttempts = Infinity, delay, abortSignal, onAttempt } = options;

  if (maxAttempts === 0) {
    return err(RepeatedUntilError({
      attempts: 0,
      lastValue: undefined,
      predicate: predicate.toString()
    }) as Error);
  }

  if (isAborted(abortSignal)) {
    return err(AbortError({}));
  }

  let lastValue: T | undefined;
  const actualMaxAttempts = maxAttempts === Infinity ? Number.MAX_SAFE_INTEGER : maxAttempts;

  for (let attempt = 1; attempt <= actualMaxAttempts; attempt++) {
    if (isAborted(abortSignal)) {
      return err(AbortError({}));
    }

    try {
      const result = await operation();

      if (result.ok) {
        lastValue = result.value;
        onAttempt?.(attempt, result.value);

        if (predicate(result.value)) {
          return ok(result.value);
        }
      } else {
        return err(result.error);
      }
    } catch (error_: unknown) {
      const error = normalizeError(error_);
      return err(error as E);
    }

    if (attempt < actualMaxAttempts) {
      const delayMs = getDelay(delay, attempt);
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  return err(RepeatedUntilError({
    attempts: maxAttempts,
    lastValue,
    predicate: predicate.toString()
  }) as Error);
};

// ============================================================================
// REPEATED IS SOME
// ============================================================================

export const repeatedIsSome = async <T>(
  operation: () => Promise<Maybe<T>>,
  options: RepeatedIsSomeOptions = {}
): Promise<Result<T, Error>> => {
  const { maxAttempts = Infinity, delay, abortSignal, onAttempt } = options;

  if (maxAttempts === 0) {
    return err(RepeatedUntilError({
      attempts: 0,
      lastValue: null,
      predicate: "isSome"
    }));
  }

  if (isAborted(abortSignal)) {
    return err(AbortError({}));
  }

  const actualMaxAttempts = maxAttempts === Infinity ? Number.MAX_SAFE_INTEGER : maxAttempts;

  for (let attempt = 1; attempt <= actualMaxAttempts; attempt++) {
    if (isAborted(abortSignal)) {
      return err(AbortError({}));
    }

    try {
      const result = await operation();
      onAttempt?.(attempt, result);

      if (result.ok) {
        return ok(result.value);
      }
    } catch (error_: unknown) {
      const error = normalizeError(error_);
      return err(error);
    }

    if (attempt < actualMaxAttempts) {
      const delayMs = getDelay(delay, attempt);
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  return err(RepeatedUntilError({
    attempts: maxAttempts,
    lastValue: null,
    predicate: "isSome"
  }));
};

/* eslint-enable sonarjs/cognitive-complexity */