/**
 * Sleep utility - delay and timeout helpers
 */

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
 * Creates a promise that resolves after the specified delay
 * @param ms - The delay in milliseconds
 * @returns Promise<void>
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
 * @param signal - AbortSignal to cancel the sleep
 * @returns Promise<void>
 */
export const sleepWithSignal = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);

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
