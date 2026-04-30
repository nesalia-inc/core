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
  /** AbortController to abort the operation on timeout */
  abortController?: AbortController;
}

/**
 * Cleanup function returned by withTimeout
 */
export type TimeoutCleanup = () => void;

/**
 * Result of withTimeout when using signal injection
 */
export interface TimeoutResult<T> {
  promise: Promise<T>;
  cleanup: TimeoutCleanup;
}

/**
 * Adds jitter to delay
 * @param delay - Base delay in milliseconds
 * @param jitter - Jitter option (true = full jitter, number = specific variance)
 * @returns Delayed value with jitter applied
 */
export const addJitter = (delay: number, jitter?: boolean | number): number => {
  if (jitter === undefined || jitter === false) return delay;

  // Validate jitter value - treat negative as 0 (no jitter)
  if (typeof jitter === "number" && jitter < 0) {
    return delay;
  }

  // true = full jitter (0.5 to 1.5 range)
  // number = specific variance (e.g., 0.2 = 0.8 to 1.2 range)
  const variance = jitter === true ? 0.5 : jitter;
  const min = delay * (1 - variance);
  const max = delay * (1 + variance);
  // Math.random is acceptable here - it's for jitter, not security
  // eslint-disable-next-line sonarjs/pseudo-random
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
 * Deferred promise for fine-grained control
 */
const createDeferredPromise = <T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
} => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

/**
 * Adds a timeout to a promise or function
 * @param promise - The promise or function to timeout
 * @param ms - Timeout in milliseconds
 * @param options - Timeout options
 * @returns The promise result or throws TimeoutError on timeout. When using signal injection with a function, returns TimeoutResult with promise and cleanup
 */
export const withTimeout = <T>(
  promise: Promise<T> | ((signal: AbortSignal) => Promise<T>) | (() => Promise<T>),
  ms: number,
  options: TimeoutOptions = {}
): Promise<T> | TimeoutResult<T> => {
  const { message, name = "TIMEOUT", includeElapsed = true, abortController } = options;

  // Create internal AbortController for timeout handling
  const controller = abortController ?? new AbortController();
  const signal = controller.signal;

  // Check if promise is a function
  const isFunction = typeof promise === "function";

  // Determine if this is signal injection mode (function expects signal parameter)
  // For backward compatibility: if function takes no parameters, use old behavior
  const isSignalInjection = isFunction && (promise as (...args: unknown[]) => Promise<T>).length > 0;

  // Convert function to promise
  const convertToPromise = (): Promise<T> => {
    if (!isFunction) return promise as Promise<T>;
    if (isSignalInjection) return (promise as (signal: AbortSignal) => Promise<T>)(signal);
    return (promise as () => Promise<T>)();
  };
  const p = convertToPromise();

  const start = Date.now();

  // Create deferred promise wrapper for signal injection mode
  const deferred = isSignalInjection ? createDeferredPromise<T>() : null;

  // Create timeout promise with proper cleanup
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const elapsed = Date.now() - start;

      // Abort the operation
      if (!signal.aborted) {
        controller.abort();
      }

      // For signal injection mode, reject the deferred promise
      if (deferred) {
        const error = new Error(message ?? `Timeout after ${elapsed}ms`) as TimeoutError;
        error.name = name;
        error.timeout = ms;
        if (includeElapsed) {
          error.elapsed = elapsed;
        }
        deferred.reject(error);
      } else {
        // Original behavior: reject timeout promise
        const error = new Error(message ?? `Timeout after ${elapsed}ms`) as TimeoutError;
        error.name = name;
        error.timeout = ms;
        if (includeElapsed) {
          error.elapsed = elapsed;
        }
        reject(error);
      }
    }, ms);
  });

  // Track if cleanup has been called to prevent double calls
  let cleanupCalled = false;

  // Define cleanup function
  const cleanup: TimeoutCleanup = () => {
    if (cleanupCalled) return;
    cleanupCalled = true;

    clearTimeout(timeoutId);

    // Capture abort state before calling abort(), since abort() sets
    // signal.aborted = true synchronously, which would make the condition
    // below always false and leave the promise pending forever
    const wasAborted = signal.aborted;

    if (!wasAborted) {
      controller.abort();
    }

    // For signal injection mode, reject deferred promise on manual cleanup
    if (deferred && !wasAborted) {
      const error = new Error("Aborted") as TimeoutError;
      error.name = "ABORTED";
      deferred.reject(error);
    }
  };

  // For signal injection mode, return result object with wrapped promise
  if (isSignalInjection) {
    // Race between the operation and timeout
    // Also clean up timeout when the promise resolves/rejects
    Promise.race([p, timeoutPromise]).then(
      (value) => {
        clearTimeout(timeoutId);
        deferred?.resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        deferred?.reject(error);
      }
    );

    return {
      promise: deferred!.promise.finally(() => {
        clearTimeout(timeoutId);
      }),
      cleanup,
    };
  }

  // Original behavior: return just the promise
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
