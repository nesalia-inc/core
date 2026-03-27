/**
 * Yield utility - yield control to the event loop
 */

// Type definitions for environment-specific globals
interface SchedulerYield {
  yield: () => Promise<void>;
}

interface ImmediateFn {
  (callback: () => void): void;
}

interface RuntimeGlobal {
  scheduler?: SchedulerYield;
  setImmediate?: ImmediateFn;
}

const _global = globalThis as RuntimeGlobal;

/**
 * Yields control to the event loop, allowing it to process other tasks (like UI rendering or I/O).
 *
 * Environment Optimization Strategy:
 * 1. `scheduler.yield()` - Modern standard (avoids task queue demotion)
 * 2. `setImmediate` - Zero-delay Node.js/Bun macrotask
 * 3. `MessageChannel` - Zero-delay Browser macrotask (avoids the 4ms setTimeout clamp)
 * 4. `setTimeout(0)` - Universal fallback
 *
 * @returns Promise<void>
 */
export const yieldControl = (): Promise<void> => {
  // 1. Modern Web: scheduler.yield() (WICG Draft / Origin Trials)
  // Keeps the current task priority instead of sending it to the back of the queue.
  if (_global.scheduler && typeof _global.scheduler.yield === "function") {
    return _global.scheduler.yield();
  }

  // 2. Node.js / Bun: setImmediate
  // Bypasses the Node timer queue entirely, executing on the next iteration of the event loop.
  if (typeof _global.setImmediate === "function") {
    return new Promise((resolve) => _global.setImmediate!(resolve));
  }

  // 3. Modern Browsers: MessageChannel polyfill
  // This is the trick used by React's Scheduler. It queues a true macrotask
  // without the HTML5 4ms minimum timeout penalty.
  if (typeof MessageChannel !== "undefined") {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close(); // Prevent memory leaks
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }

  // 4. Ultimate Fallback (Legacy browsers)
  return new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Alias for yieldControl() - yields control to the event loop.
 * Passes the reference directly to avoid allocating a new closure on every call.
 */
export const immediate = yieldControl;
