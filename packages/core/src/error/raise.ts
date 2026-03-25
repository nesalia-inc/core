/**
 * Functional throw - throws the error and returns never
 */

/**
 * Functional throw - throws the error and returns never
 * Use for early exit in Result-returning functions
 *
 * @example
 * const decimal = (p: number, s: number): Result<Column, Error<...>> => {
 *   if (p < s) raise(DecimalError({ precision: p, scale: s }));
 *   return ok({ name: 'decimal', precision: p, scale: s });
 * };
 */
export const raise = <E extends globalThis.Error>(error: E): never => {
  throw error;
};
