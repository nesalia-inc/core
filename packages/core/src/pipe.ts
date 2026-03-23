/**
 * Pipe and Flow utilities for functional composition
 */

/**
 * Pipes a value through a sequence of functions.
 * Reads left-to-right, applying each function to the result of the previous.
 *
 * @param value - The initial value
 * @param fns - The functions to apply in sequence
 * @returns The final result after applying all functions
 *
 * @example
 * import { pipe, map, getOrElse } from '@deessejs/core';
 *
 * const result = pipe(
 *   "hello",
 *   s => s.toUpperCase(),
 *   s => s + "!",
 * );
 * // result: "HELLO!"
 */
export const pipe = (value: unknown, ...fns: Array<(arg: unknown) => unknown>): unknown =>
  fns.reduce((acc, fn) => fn(acc), value);

/**
 * Creates a reusable function that composes multiple functions.
 * Unlike pipe, flow returns a function that can be called later with an initial value.
 *
 * @param fns - The functions to compose
 * @returns A new function that applies all functions in sequence
 *
 * @example
 * import { flow, map, getOrElse } from '@deessejs/core';
 *
 * const processString = flow(
 *   (s: string) => s.toUpperCase(),
 *   (s: string) => s + "!"
 * );
 *
 * processString("hello"); // "HELLO!"
 * processString("world"); // "WORLD!"
 *
 * @example
 * With monads:
 * import { flow, map, flatMap, getOrElse, ok } from '@deessejs/core';
 *
 * const processUser = flow(
 *   (id: string) => ok({ id, email: "user@test.com" }),
 *   map(u => u.email),
 *   getOrElse(() => 'unknown')
 * );
 *
 * processUser("123"); // "user@test.com"
 */
export const flow = (...fns: Array<(arg: unknown) => unknown>) => (value: unknown): unknown =>
  fns.reduce((acc, fn) => fn(acc), value);
