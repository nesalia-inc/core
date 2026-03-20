/**
 * Yield utility - yield control to the event loop
 */

/**
 * Yields control to the event loop, allowing it to process other tasks.
 * Uses setTimeout(0) for cross-browser compatibility (setImmediate is not available in browsers).
 * @returns Promise<void>
 */
export const yieldControl = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Alias for yieldControl() - yields control to the event loop.
 * @returns Promise<void>
 */
export const immediate = (): Promise<void> => yieldControl();
