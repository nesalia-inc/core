/**
 * Error utilities
 */

import { type Error, type ErrorGroup, type Panic } from "./types.js";
import { isErrorGroup } from "./guards.js";

/**
 * Get the message from an Error or ErrorGroup
 */
export const getErrorMessage = (e: Error | ErrorGroup): string => {
  if (isErrorGroup(e)) {
    return `${e.name}: ${e.exceptions.length} error(s)`;
  }
  // If args is undefined/null, return just the name
  if (e.args === undefined || e.args === null) {
    return e.name;
  }
  return e.message;
};

/**
 * Flatten ErrorGroup to array of Errors
 */
export const flattenErrorGroup = (e: Error | ErrorGroup): Error[] => {
  if (isErrorGroup(e)) {
    return e.exceptions.flatMap(flattenErrorGroup);
  }
  return [e];
};

/**
 * Filter errors in group by name
 */
export const filterErrorsByName = (group: ErrorGroup, name: string): Error[] =>
  flattenErrorGroup(group).filter((e) => e.name === name);

/**
 * Partial error matching with fallback handler
 *
 * Unlike matchError which requires exhaustive handling of all error types,
 * matchErrorPartial allows a fallback handler for unmatched errors.
 *
 * @param error - The error to match
 * @param handlers - Object mapping error names to handler functions
 * @param fallback - Default handler for errors not matched by handlers
 * @returns Result of the matched handler
 *
 * @example
 * const message = matchErrorPartial(result.error, {
 *   NotFoundError: (e) => `Missing: ${e.id}`,
 *   ValidationError: (e) => `Invalid: ${e.field}`,
 * }, (e) => `Unknown error: ${e.name}`);
 */
export const matchErrorPartial = <R>(
  error: Error | Panic,
  handlers: Partial<Record<string, (error: Error | Panic) => R>>,
  fallback: (error: Error | Panic) => R
): R => {
  // For Panic, use _tag as the error name; for regular errors, use name
  const errorName = "_tag" in error ? (error as Panic)._tag : (error as Error).name;
  const handler = handlers[errorName];
  if (handler !== undefined) {
    return handler(error);
  }
  return fallback(error);
};
