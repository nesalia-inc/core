/**
 * Pipe and Flow utilities for functional composition
 */

// ============================================================================
// PIPE
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
// Fallback for more than 7 functions
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function pipe(value: unknown, ...fns: Array<(arg: unknown) => unknown>): unknown;

/**
 * @internal
 */
export function pipe(value: unknown, ...fns: Array<(arg: unknown) => unknown>): unknown {
  let result = value;
  for (let i = 0; i < fns.length; i++) {
    result = fns[i](result);
  }
  return result;
}

// ============================================================================
// FLOW
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
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function flow(...fns: Array<Function>): Function;

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function flow(...fns: Array<Function>): Function {
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
