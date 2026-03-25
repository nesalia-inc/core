/**
 * Error utilities
 */

import type { Error, ErrorGroup } from "./types.js";
import { isError, isErrorGroup } from "./guards.js";

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
  if (isError(e)) {
    return [e];
  }
  return e.exceptions.flatMap(flattenErrorGroup);
};

/**
 * Filter errors in group by name
 */
export const filterErrorsByName = (group: ErrorGroup, name: string): Error[] =>
  flattenErrorGroup(group).filter((e) => e.name === name);
