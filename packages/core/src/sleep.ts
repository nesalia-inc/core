/**
 * Sleep utility - delay and timeout helpers
 */

/**
 * Creates a promise that resolves after the specified delay
 * @param ms - The delay in milliseconds
 * @returns Promise<void>
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
 * Adds a timeout to a promise
 * @param promise - The promise to timeout
 * @param ms - Timeout in milliseconds
 * @param options - Timeout options
 * @returns The promise result or throws Exception on timeout
 */
export const withTimeout = async <T>(
  promise: Promise<T>,
  ms: number,
  options: TimeoutOptions = {}
): Promise<T> => {
  const { message, name = "TIMEOUT", includeElapsed = true } = options;

  const start = Date.now();

  return Promise.race([
    promise,
    sleep(ms).then(() => {
      const elapsed = Date.now() - start;
      const error = new Error(message ?? `Timeout after ${elapsed}ms`);
      error.name = name;

      // Attach additional data to the error
      Object.defineProperty(error, "data", {
        value: includeElapsed ? { elapsed, timeout: ms } : { timeout: ms },
        enumerable: true,
      });

      throw error;
    }),
  ]);
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
        const error = new Error("Sleep aborted");
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

/**
 * Retry with timeout
 * @param fn - The function to execute
 * @param ms - Timeout in milliseconds
 * @param options - Timeout options
 * @returns The function result or throws on timeout
 */
export const withTimeout_ = <T>(
  fn: () => Promise<T>,
  ms: number,
  options?: TimeoutOptions
): Promise<T> => withTimeout(fn(), ms, options);
