/**
 * Pipe and Flow utilities for functional composition
 */

// Type helpers
type AnyFn = (...args: unknown[]) => unknown;

interface Thenable {
  then: (onfulfilled: unknown, onrejected?: unknown) => unknown;
}

const isThenable = (value: unknown): value is Thenable =>
  !!value &&
  (typeof value === "object" || typeof value === "function") &&
  typeof (value as { then?: unknown }).then === "function";

// ============================================================================
// DUAL (DATA-FIRST / DATA-LAST)
// ============================================================================

/**
 * Creates a function that works both as data-first and data-last.
 * The first argument can be either data or a function that transforms data.
 *
 * @typeParam A - First argument type (the data or function)
 * @typeParam B - Second argument type (the function or data)
 * @typeParam R - Return type
 * @param arity - The arity of the function (number of arguments)
 * @param fn - The actual implementation
 * @returns A function that can be called with data-first or data-last style
 *
 * @example
 * import { dual } from '@deessejs/fp';
 *
 * // 2-ary function - can be called map(result, fn) or map(fn)(result)
 * const map = dual(2, <A, B>(result: { map: (fn: (a: A) => B) => unknown }, fn: (a: A) => B) =>
 *   result.map(fn)
 * );
 *
 * // Data-first
 * map(result, fn)
 *
 * // Data-last
 * map(fn)(result)
 */
export function dual(arity: 2 | 3 | 4, fn: AnyFn): AnyFn {
  return function(this: unknown, ...args: unknown[]): unknown {
    if (args.length === arity - 1 && typeof args[0] === "function") {
      // Data-last: first arg is a function, we need to return a function that takes data
      const [transformFn, ...rest] = args;
      return (data: unknown) => fn.call(this, data, transformFn, ...rest);
    }
    // Data-first: all args provided
    return fn.apply(this, args);
  };
}

// ============================================================================
// PIPE (SYNC)
// ============================================================================

/**
 * Pipes a value through a sequence of functions.
 * Reads left-to-right, applying each function to the result of the previous.
 *
 * @param value - The initial value
 * @param fns - The functions to apply in sequence
 * @returns The final result after applying all functions
 *
 * @example
 * import { pipe } from '@deessejs/fp';
 *
 * const result = pipe(
 *   "hello",
 *   s => s.toUpperCase(),
 *   s => s + "!",
 * );
 * // result: "HELLO!"
 */

// Overloads for up to 7 functions (covers 99.9% of use cases)
export function pipe<A>(value: A): A;
export function pipe<A, B>(value: A, ab: (a: A) => B): B;
export function pipe<A, B, C>(value: A, ab: (a: A) => B, bc: (b: B) => C): C;
export function pipe<A, B, C, D>(value: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
export function pipe<A, B, C, D, E>(value: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E): E;
export function pipe<A, B, C, D, E, F>(value: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F): F;
export function pipe<A, B, C, D, E, F, G>(value: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G): G;
// Fallback
export function pipe(value: unknown, ...fns: AnyFn[]): unknown;

/**
 * @internal
 */
export function pipe(value: unknown, ...fns: AnyFn[]): unknown {
  let result = value;
  for (let i = 0; i < fns.length; i++) {
    // eslint-disable-next-line security/detect-object-injection -- Safe: fns is a local array, i is a loop counter
    result = fns[i](result);
  }
  return result;
}

// ============================================================================
// FLOW (SYNC)
// ============================================================================

/**
 * Creates a reusable function that composes multiple functions.
 * Unlike pipe, flow returns a function that can be called later with an initial value.
 * The first function in the flow can accept multiple arguments.
 *
 * @param fns - The functions to compose
 * @returns A new function that applies all functions in sequence
 *
 * @example
 * import { flow } from '@deessejs/fp';
 *
 * const processString = flow(
 *   (s: string) => s.toUpperCase(),
 *   (s: string) => s + "!"
 * );
 *
 * processString("hello"); // "HELLO!"
 *
 * @example
 * First function can take multiple arguments:
 *
 * const addAndStringify = flow(
 *   (a: number, b: number) => a + b,
 *   (sum) => sum.toString()
 * );
 *
 * addAndStringify(5, 10); // "15"
 */

// Overloads for up to 7 functions
export function flow<A extends ReadonlyArray<unknown>, B>(ab: (...a: A) => B): (...a: A) => B;
export function flow<A extends ReadonlyArray<unknown>, B, C>(ab: (...a: A) => B, bc: (b: B) => C): (...a: A) => C;
export function flow<A extends ReadonlyArray<unknown>, B, C, D>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D): (...a: A) => D;
export function flow<A extends ReadonlyArray<unknown>, B, C, D, E>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E): (...a: A) => E;
export function flow<A extends ReadonlyArray<unknown>, B, C, D, E, F>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F): (...a: A) => F;
export function flow<A extends ReadonlyArray<unknown>, B, C, D, E, F, G>(ab: (...a: A) => B, bc: (b: B) => C, cd: (c: C) => D, de: (d: D) => E, ef: (e: E) => F, fg: (f: F) => G): (...a: A) => G;
// Fallback
export function flow(...fns: AnyFn[]): (...args: unknown[]) => unknown;

/**
 * @internal
 */
export function flow(...fns: AnyFn[]): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => {
    if (fns.length === 0) return args[0];

    // First function handles the initial arity (multiple arguments)
    let result = fns[0](...args);

    // Subsequent functions are strictly unary
    for (let i = 1; i < fns.length; i++) {
      // eslint-disable-next-line security/detect-object-injection -- Safe: fns is a local array, i is a loop counter
      result = fns[i](result);
    }

    return result;
  };
}

// ============================================================================
// TAP (SIDE EFFECTS)
// ============================================================================

/**
 * Executes a side effect function and returns the original value unchanged.
 * Useful for debugging, logging, or injecting effects into a pipe/flow without altering the value.
 *
 * @param fn - The side effect function to execute
 * @returns A function that executes the side effect and returns the original value
 *
 * @example
 * import { pipe, tap } from '@deessejs/fp';
 *
 * const result = pipe(
 *   { name: "test" },
 *   tap(user => console.log(`User: ${user.name}`)),
 *   user => user.name.toUpperCase()
 * );
 * // Logs: "User: test"
 * // result: "TEST"
 */
export const tap = <T>(fn: (value: T) => void) => (value: T): T => {
  fn(value);
  return value;
};

/**
 * Executes an async side effect function and returns the original value unchanged.
 * Useful for async operations like analytics tracking without altering the flow.
 *
 * @param fn - The async side effect function to execute
 * @returns A function that executes the async side effect and returns the original value
 *
 * @example
 * import { pipe, tapAsync } from '@deessejs/fp';
 *
 * const result = await pipe(
 *   { userId: "123" },
 *   tapAsync(user => sendAnalytics(user.userId)),
 *   fetchUser
 * );
 */
export const tapAsync = <T>(fn: (value: T) => Promise<void>) => async (value: T): Promise<T> => {
  await fn(value);
  return value;
};

/**
 * Safe version of tap that catches errors in the side effect function.
 * If the side effect throws, the error is logged but the value is still returned.
 *
 * @param fn - The side effect function to execute
 * @param onError - Optional error handler
 * @returns A function that executes the side effect safely and returns the original value
 *
 * @example
 * import { pipe, tapSafe } from '@deessejs/fp';
 *
 * const result = pipe(
 *   { name: "test" },
 *   tapSafe(
 *     user => riskyLogging(user),
 *     err => console.error("Logging failed:", err)
 *   ),
 *   user => user.name.toUpperCase()
 * );
 */
export const tapSafe = <T>(
  fn: (value: T) => void,
  onError?: (error: unknown) => void
) => (value: T): T => {
  try {
    fn(value);
  } catch (error) {
    if (onError) {
      onError(error);
    }
  }
  return value;
};

// ============================================================================
// PIPE ASYNC
// ============================================================================

/**
 * Pipes a value through a sequence of functions, awaiting each step if it returns a Promise.
 * Allows mixing sync and async functions seamlessly.
 * Only awaits if the return value is actually a thenable (Promise-like).
 *
 * @param value - The initial value or Promise
 * @param fns - The functions to apply in sequence
 * @returns The final result after applying all functions
 *
 * @example
 * import { pipeAsync } from '@deessejs/fp';
 *
 * const result = await pipeAsync(
 *   fetchUser(id),
 *   async user => await validateUser(user),
 *   user => user.profile
 * );
 */

// Overloads for up to 7 functions
export function pipeAsync<A>(value: A | Promise<A>): Promise<A>;
export function pipeAsync<A, B>(value: A | Promise<A>, ab: (a: A) => B | Promise<B>): Promise<B>;
export function pipeAsync<A, B, C>(value: A | Promise<A>, ab: (a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>): Promise<C>;
export function pipeAsync<A, B, C, D>(value: A | Promise<A>, ab: (a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>, cd: (c: C) => D | Promise<D>): Promise<D>;
export function pipeAsync<A, B, C, D, E>(value: A | Promise<A>, ab: (a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>, cd: (c: C) => D | Promise<D>, de: (d: D) => E | Promise<E>): Promise<E>;
export function pipeAsync<A, B, C, D, E, F>(value: A | Promise<A>, ab: (a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>, cd: (c: C) => D | Promise<D>, de: (d: D) => E | Promise<E>, ef: (e: E) => F | Promise<F>): Promise<F>;
export function pipeAsync<A, B, C, D, E, F, G>(value: A | Promise<A>, ab: (a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>, cd: (c: C) => D | Promise<D>, de: (d: D) => E | Promise<E>, ef: (e: E) => F | Promise<F>, fg: (f: F) => G | Promise<G>): Promise<G>;
// Fallback
export function pipeAsync(value: unknown, ...fns: AnyFn[]): Promise<unknown>;

/**
 * @internal
 */
export async function pipeAsync(value: unknown, ...fns: AnyFn[]): Promise<unknown> {
  // Check initial value too to avoid unnecessary microtasks
  let result = isThenable(value) ? await (value as Promise<unknown>) : value;
  for (let i = 0; i < fns.length; i++) {
    // eslint-disable-next-line security/detect-object-injection -- Safe: fns is a local array, i is a loop counter
    const next = fns[i](result);
    // eslint-disable-next-line no-await-in-loop -- Sequential execution is required for pipe semantics
    result = isThenable(next) ? await (next as Promise<unknown>) : next;
  }
  return result;
}

// ============================================================================
// FLOW ASYNC
// ============================================================================

/**
 * Creates a reusable async function that composes multiple functions.
 * The returned function can be called with a value or Promise, and will await each step.
 * The first function can accept multiple arguments.
 *
 * @param fns - The functions to compose
 * @returns A new async function that applies all functions in sequence
 *
 * @example
 * import { flowAsync } from '@deessejs/fp';
 *
 * const processUser = flowAsync(
 *   async (id: string) => await fetchUser(id),
 *   async user => await validateUser(user),
 *   user => user.profile
 * );
 *
 * const result = await processUser("123");
 */

// Overloads for up to 7 functions
export function flowAsync<A extends ReadonlyArray<unknown>, B>(ab: (...a: A) => B | Promise<B>): (...a: A) => Promise<B>;
export function flowAsync<A extends ReadonlyArray<unknown>, B, C>(ab: (...a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>): (...a: A) => Promise<C>;
export function flowAsync<A extends ReadonlyArray<unknown>, B, C, D>(ab: (...a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>, cd: (c: C) => D | Promise<D>): (...a: A) => Promise<D>;
export function flowAsync<A extends ReadonlyArray<unknown>, B, C, D, E>(ab: (...a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>, cd: (c: C) => D | Promise<D>, de: (d: D) => E | Promise<E>): (...a: A) => Promise<E>;
export function flowAsync<A extends ReadonlyArray<unknown>, B, C, D, E, F>(ab: (...a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>, cd: (c: C) => D | Promise<D>, de: (d: D) => E | Promise<E>, ef: (e: E) => F | Promise<F>): (...a: A) => Promise<F>;
export function flowAsync<A extends ReadonlyArray<unknown>, B, C, D, E, F, G>(ab: (...a: A) => B | Promise<B>, bc: (b: B) => C | Promise<C>, cd: (c: C) => D | Promise<D>, de: (d: D) => E | Promise<E>, ef: (e: E) => F | Promise<F>, fg: (f: F) => G | Promise<G>): (...a: A) => Promise<G>;
// Fallback
export function flowAsync(...fns: AnyFn[]): (...args: unknown[]) => Promise<unknown>;

/**
 * @internal
 */
export function flowAsync(...fns: AnyFn[]): (...args: unknown[]) => Promise<unknown> {
  return async (...args: unknown[]) => {
    if (fns.length === 0) return args[0];

    let result = await fns[0](...args);
    for (let i = 1; i < fns.length; i++) {
      // eslint-disable-next-line security/detect-object-injection -- Safe: fns is a local array, i is a loop counter
      const next = fns[i](result);
      // eslint-disable-next-line no-await-in-loop -- Sequential execution is required for flow semantics
      result = isThenable(next) ? await (next as Promise<unknown>) : next;
    }

    return result;
  };
}

// ============================================================================
// REDUCE (FUNCTIONAL ARRAY ACCUMULATION)
// ============================================================================

/**
 * A curried reduce function for functional array accumulation.
 * Enables pipe/flow composition by accepting the array as the final argument.
 *
 * @param initial - The initial accumulator value
 * @param fn - The reduction function: (accumulator, currentValue, index) => newAccumulator
 * @returns A unary function that accepts an array and returns the accumulated result
 *
 * @example
 * import { pipe, reduce } from '@deessejs/fp';
 *
 * const sum = reduce(0, (acc, n) => acc + n);
 * pipe([1, 2, 3, 4, 5], sum); // 15
 *
 * @example
 * const toObject = reduce({} as Record<string, number>, (acc, val) => ({
 *   ...acc,
 *   [val]: (acc[val] ?? 0) + 1
 * }));
 * toObject(['a', 'b', 'a']); // { a: 2, b: 1 }
 */
export const reduce = <A, B>(
  initial: B,
  fn: (accumulator: B, value: A, index: number) => B
): ((array: ReadonlyArray<A>) => B) =>
  (array): B => {
    let accumulator = initial;
    for (let i = 0; i < array.length; i++) {
      // eslint-disable-next-line security/detect-object-injection -- Safe: i is a loop counter
      accumulator = fn(accumulator, array[i], i);
    }
    return accumulator;
  };

// ============================================================================
// DEBOUNCE
// ============================================================================

/**
 * Options for debounce
 */
export interface DebounceOptions {
  /** Wait time in milliseconds before executing */
  wait: number;
  /** If true, execute on the leading edge instead of trailing */
  leading?: boolean;
}

/**
 * Creates a debounced version of a function.
 * The function will be delayed by the specified wait time, but if called again
 * within the wait period, the timer resets.
 *
 * @typeParam T - The function type to debounce
 * @param fn - The function to debounce
 * @param options - Debounce options (wait is required)
 * @returns A debounced function
 *
 * @example
 * import { debounce } from '@deessejs/fp';
 *
 * const debouncedSearch = debounce(searchUser, { wait: 300 });
 * // Calls searchUser 300ms after the last call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: DebounceOptions
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: unknown[] | null = null;

  const debounced = function(this: unknown, ...args: unknown[]): unknown {
    lastArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (options.leading && timeoutId === null) {
      return fn.apply(this, args);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (lastArgs !== null && !options.leading) {
        fn.apply(this, lastArgs);
        lastArgs = null;
      }
    }, options.wait);
    // eslint-disable-next-line @typescript-eslint/consistent-return -- setTimeout callback doesn't need to return
    return undefined;
  } as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

// ============================================================================
// THROTTLE
// ============================================================================

/**
 * Options for throttle
 */
export interface ThrottleOptions {
  /** Minimum interval between executions in milliseconds */
  interval: number;
}

/**
 * Creates a throttled version of a function.
 * The function will execute at most once per the specified interval.
 *
 * @typeParam T - The function type to throttle
 * @param fn - The function to throttle
 * @param options - Throttle options (interval is required)
 * @returns A throttled function
 *
 * @example
 * import { throttle } from '@deessejs/fp';
 *
 * const throttledSave = throttle(saveUser, { interval: 1000 });
 * // Calls saveUser at most once per second
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: ThrottleOptions
): T & { cancel: () => void } {
  let lastExecution = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: unknown[] | null = null;

  const throttled = function(this: unknown, ...args: unknown[]): unknown {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecution;

    if (timeSinceLastExecution >= options.interval) {
      lastExecution = now;
      return fn.apply(this, args);
    }

    // Schedule execution for when the interval has passed
    if (timeoutId === null) {
      const remaining = options.interval - timeSinceLastExecution;
      pendingArgs = args;
      timeoutId = setTimeout(() => {
        lastExecution = Date.now();
        timeoutId = null;
        if (pendingArgs !== null) {
          fn.apply(this, pendingArgs);
          pendingArgs = null;
        }
      }, remaining);
    }
    // eslint-disable-next-line @typescript-eslint/consistent-return -- setTimeout callback doesn't need to return
    return undefined;
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}

// ============================================================================
// MEMOIZE
// ============================================================================

/**
 * Options for memoize
 */
export interface MemoizeOptions {
  /** Maximum number of entries to cache */
  maxSize?: number;
}

/**
 * Creates a memoized version of a function.
 * Results are cached based on the serialized arguments.
 *
 * @typeParam T - The function type to memoize
 * @param fn - The function to memoize
 * @param options - Memoize options (maxSize is optional)
 * @returns A memoized function
 *
 * @example
 * import { memoize } from '@deessejs/fp';
 *
 * const memoizedFetch = memoize(fetchUser, { maxSize: 100 });
 * // Subsequent calls with same arguments return cached result
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): T & { cache: Map<string, unknown>; clear: () => void } {
  const maxSize = options.maxSize ?? 100;
  const cache = new Map<string, unknown>();

  const memoized = function(this: unknown, ...args: unknown[]): unknown {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    // Only cache non-Promise results by default for safety
    if (!isThenable(result)) {
      if (cache.size >= maxSize) {
        // Remove oldest entry (Map preserves insertion order)
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) {
          cache.delete(firstKey);
        }
      }
      cache.set(key, result);
    }
    return result;
  } as T & { cache: Map<string, unknown>; clear: () => void };

  memoized.cache = cache;
  memoized.clear = () => { cache.clear(); };

  return memoized;
}
