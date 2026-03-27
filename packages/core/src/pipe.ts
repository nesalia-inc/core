/**
 * Pipe and Flow utilities for functional composition
 */

// Type helpers
type AnyFn = (...args: unknown[]) => unknown;
type Thenable = { then: (onfulfilled: unknown, onrejected?: unknown) => unknown };

const isThenable = (value: unknown): value is Thenable =>
  value !== null && typeof value === "object" && typeof (value as Thenable).then === "function";

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
 * import { pipe } from '@deessejs/core';
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
 * import { flow } from '@deessejs/core';
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
 * import { pipe, tap } from '@deessejs/core';
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
 * import { pipe, tapAsync } from '@deessejs/core';
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
 * import { pipe, tapSafe } from '@deessejs/core';
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
  } catch (e) {
    if (onError) {
      onError(e);
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
 * import { pipeAsync } from '@deessejs/core';
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
  let result = await value;
  for (let i = 0; i < fns.length; i++) {
    const next = fns[i](result);
    // Only await if it's actually a thenable to avoid unnecessary microtasks
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
 * import { flowAsync } from '@deessejs/core';
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
      const next = fns[i](result);
      result = isThenable(next) ? await (next as Promise<unknown>) : next;
    }

    return result;
  };
}
