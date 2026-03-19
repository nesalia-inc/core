/**
 * Sleep utility - delay and timeout helpers
 */

/**
 * Sleep options
 */
export interface SleepOptions {
  /** Add jitter to prevent thundering herd
   * - true: full jitter (0.5 to 1.5 range)
   * - number: specific variance (e.g., 0.2 = 0.8 to 1.2 range)
   */
  jitter?: boolean | number;
}

/**
 * Timeout error type
 */
export type TimeoutError = Error & {
  name: string;
  timeout: number;
  elapsed?: number;
};

/**
 * Timeout options
 */
export interface TimeoutOptions {
  /** Custom error message */
  message?: string;
  /** Custom error name */
  name?: string;
  /** Include elapsed time in error data */
  includeElapsed?: boolean;
}

/**
 * Adds jitter to delay
 * @param delay - Base delay in milliseconds
 * @param jitter - Jitter option (true = full jitter, number = specific variance)
 * @returns Delayed value with jitter applied
 */
export const addJitter = (delay: number, jitter?: boolean | number): number => {
  if (jitter === undefined || jitter === false) return delay;

  // true = full jitter (0.5 to 1.5 range)
  // number = specific variance (e.g., 0.2 = 0.8 to 1.2 range)
  const variance = jitter === true ? 0.5 : jitter;
  const min = delay * (1 - variance);
  const max = delay * (1 + variance);
  return min + Math.random() * (max - min);
};

/**
 * Creates a promise that resolves after the specified delay
 * @param ms - The delay in milliseconds
 * @param options - Sleep options
 * @returns Promise<void>
 */
export const sleep = (ms: number, options?: SleepOptions): Promise<void> => {
  const actualDelay = addJitter(ms, options?.jitter);
  return new Promise((resolve) => setTimeout(resolve, actualDelay));
};

/**
 * Adds a timeout to a promise or function
 * @param promise - The promise or function to timeout
 * @param ms - Timeout in milliseconds
 * @param options - Timeout options
 * @returns The promise result or throws TimeoutError on timeout
 */
export const withTimeout = <T>(
  promise: Promise<T> | (() => Promise<T>),
  ms: number,
  options: TimeoutOptions = {}
): Promise<T> => {
  const { message, name = "TIMEOUT", includeElapsed = true } = options;

  // Convert function to promise if needed
  const p = typeof promise === "function" ? promise() : promise;

  const start = Date.now();

  // Create timeout promise with proper cleanup
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const elapsed = Date.now() - start;

      // Create error with proper typing
      const error = new Error(message ?? `Timeout after ${elapsed}ms`) as TimeoutError;
      error.name = name;
      error.timeout = ms;
      if (includeElapsed) {
        error.elapsed = elapsed;
      }

      reject(error);
    }, ms);
  });

  // Race between the promise and timeout
  return Promise.race([p, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

/**
 * Sleep with AbortController support
 * @param ms - The delay in milliseconds
 * @param signal - AbortSignal to cancel the sleep (legacy signature)
 * @returns Promise<void>
 */
export function sleepWithSignal(ms: number, signal: AbortSignal): Promise<void>;
/**
 * Sleep with AbortController support
 * @param ms - The delay in milliseconds
 * @param options - Sleep options (signal and jitter)
 * @returns Promise<void>
 */
export function sleepWithSignal(ms: number, options?: SleepOptions & { signal?: AbortSignal }): Promise<void>;
/**
 * Sleep with AbortController support - implementation
 */
export function sleepWithSignal(ms: number, optionsOrSignal?: SleepOptions & { signal?: AbortSignal } | AbortSignal): Promise<void> {
  // Handle backward compatibility - if second arg is AbortSignal, treat it as legacy signature
  let jitter: boolean | number | undefined;
  let signal: AbortSignal | undefined;

  if (optionsOrSignal instanceof AbortSignal) {
    signal = optionsOrSignal;
    jitter = undefined;
  } else {
    jitter = optionsOrSignal?.jitter;
    signal = optionsOrSignal?.signal;
  }

  const actualDelay = addJitter(ms, jitter);

  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, actualDelay);

    if (signal) {
      const abortHandler = () => {
        clearTimeout(id);
        const error = new Error("Sleep aborted") as TimeoutError;
        error.name = "ABORTED";
        reject(error);
      };

      if (signal.aborted) {
        clearTimeout(id);
        abortHandler();
      } else {
        signal.addEventListener("abort", abortHandler, { once: true });
      }
    }
  });
}
