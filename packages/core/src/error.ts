/**
 * Error system - Inspired by Python's exception handling
 * Provides structured errors with enrichment, chaining, and grouping
 */

import { Err, Result } from "./result.js";
import { Try, TryFailure } from "./try.js";
import { ZodType, ZodSchema } from "zod";

/**
 * Base Error type with enrichment and chaining
 * @typeParam T - The type of error arguments
 */
export type Error<T = unknown> = Readonly<{
  readonly name: string;
  readonly args: T;
  readonly notes: readonly string[];
  readonly cause: Error | null;
}>;

/**
 * ErrorGroup - wraps multiple errors
 */
export type ErrorGroup = Readonly<{
  readonly name: string;
  readonly exceptions: readonly Error[];
}>;

/**
 * Options for creating an Error
 * @typeParam T - The type of error arguments
 */
export type ErrorOptions<T> = {
  readonly name: string;
  readonly args: T;
  readonly defaultDescription?: string;
};

/**
 * Zod schema wrapper for error arguments validation
 * @typeParam T - The type of error arguments
 */
export type ZodErrorOptions<T> = {
  readonly name: string;
  readonly schema: ZodSchema<T>;
  readonly defaultDescription?: string;
};

/**
 * Err with error methods for fluent API
 */
interface ErrWithMethods<T> extends Err<Error<T>> {
  addNotes(...notes: string[]): ErrWithMethods<T>;
  from(cause: Error | Err<Error>): ErrWithMethods<T>;
}

/**
 * Internal ErrorBuilder for fluent API
 */
type ErrorBuilder<T> = {
  (args: T): ErrWithMethods<T>;
  addNotes(...notes: string[]): ErrorBuilder<T>;
  from(cause: Error | Err<Error>): ErrorBuilder<T>;
};

/**
 * Type guard to check if options has a Zod schema
 */
const hasSchema = (options: ErrorOptions<unknown> | ZodErrorOptions<unknown>): options is ZodErrorOptions<unknown> =>
  "schema" in options && options.schema instanceof ZodType;

/**
 * Creates an Error type builder
 * Use like Python exception classes
 *
 * @example
 * // With Zod schema (recommended for validation)
 * const SizeError = error({
 *   name: "SizeError",
 *   schema: z.object({ current: z.number(), wanted: z.number() })
 * });
 *
 * // Use as Err - args will be validated
 * const e = SizeError({ current: 3, wanted: 5 });
 *
 * @example
 * // Without Zod (plain type)
 * const SizeError = error({
 *   name: "SizeError",
 *   args: {} as { current: number; wanted: number }
 * });
 *
 * // Use as Err
 * const e = SizeError({ current: 3, wanted: 5 });
 */
export const error = <T>(options: ErrorOptions<T> | ZodErrorOptions<T>): ErrorBuilder<T> => {
  const isZod = hasSchema(options);
  const name = options.name;
  const schema = isZod ? options.schema : null;

  const createError = (args: T, notes: string[] = [], cause: Error | null = null): Error<T> =>
    Object.freeze({
      name,
      args,
      notes: Object.freeze([...notes]),
      cause,
    });

  const createErrWithMethods = (args: T, notes: string[] = [], cause: Error | null = null): ErrWithMethods<T> => {
    const errorObj = createError(args, notes, cause);
    // Create a plain object that's compatible with Err but extensible so we can add methods
    const result: ErrWithMethods<T> = {
      ok: false as const,
      error: errorObj,
      isOk(): false { return false; },
      isErr(): true { return true; },
      // @ts-expect-error - simplified for ErrWithMethods
      map(): unknown { return this; },
      // @ts-expect-error - simplified for ErrWithMethods
      flatMap(): unknown { return this; },
      // @ts-expect-error - simplified for ErrWithMethods
      mapErr(): unknown { return this; },
      getOrElse<T2>(defaultValue: T2): T2 { return defaultValue; },
      getOrCompute<T2>(fn: () => T2): T2 { return fn(); },
      tap(): ErrWithMethods<T> { return this as ErrWithMethods<T>; },
      tapErr(): ErrWithMethods<T> { return this as ErrWithMethods<T>; },
      match<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(errorObj); },
      addNotes: (...moreNotes: string[]): ErrWithMethods<T> =>
        createErrWithMethods(args, [...notes, ...moreNotes], cause),
      from: (newCause: Error | Err<Error>): ErrWithMethods<T> =>
        createErrWithMethods(args, notes, isError(newCause) ? newCause : newCause.error),
    };
    // Freeze only the outer object, not the methods (they create new instances)
    return Object.freeze(result);
  };

  const createBuilderWithNotes = (initialNotes: string[]): ErrorBuilder<T> => {
    const builderFn = (args: T): ErrWithMethods<T> => createErrWithMethods(args, initialNotes);
    return Object.assign(builderFn, {
      addNotes: (...notes: string[]): ErrorBuilder<T> =>
        createBuilderWithNotes([...initialNotes, ...notes]),
      from: (cause: Error | Err<Error>): ErrorBuilder<T> => {
        const newCause = isError(cause) ? cause : cause.error;
        return createBuilderWithCause(newCause, initialNotes);
      },
    });
  };

  const createBuilderWithCause = (cause: Error, initialNotes: string[]): ErrorBuilder<T> => {
    const builderFn = (args: T): ErrWithMethods<T> =>
      createErrWithMethods(args, initialNotes, cause);
    return Object.assign(builderFn, {
      addNotes: (...notes: string[]): ErrorBuilder<T> =>
        createBuilderWithCause(cause, [...initialNotes, ...notes]),
      from: (newCause: Error | Err<Error>): ErrorBuilder<T> =>
        createBuilderWithCause(isError(newCause) ? newCause : newCause.error, initialNotes),
    });
  };

  // Main builder function that validates args if schema is provided
  const validateAndCreate = (args: T): ErrWithMethods<T> => {
    if (schema) {
      const parsed = schema.safeParse(args);
      if (!parsed.success) {
        // Return error with validation issues as args
        const validationError: Error<T> = Object.freeze({
          name: `${name}ValidationError`,
          args: parsed.error.issues as unknown as T,
          notes: Object.freeze([parsed.error.message]),
          cause: null,
        });
        const errResult: ErrWithMethods<T> = {
          ok: false as const,
          error: validationError,
          isOk(): false { return false; },
          isErr(): true { return true; },
          // @ts-expect-error - simplified for validation error
          map(): unknown { return this; },
          // @ts-expect-error - simplified for validation error
          flatMap(): unknown { return this; },
          // @ts-expect-error - simplified for validation error
          mapErr(): unknown { return this; },
          getOrElse<T2>(defaultValue: T2): T2 { return defaultValue; },
          getOrCompute<T2>(fn: () => T2): T2 { return fn(); },
          tap(): ErrWithMethods<T> { return errResult; },
          tapErr(): ErrWithMethods<T> { return errResult; },
          match<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(validationError); },
          addNotes: (): ErrWithMethods<T> => errResult,
          from: (): ErrWithMethods<T> => errResult,
        };
        return Object.freeze(errResult);
      }
    }
    return createErrWithMethods(args);
  };

  const builder: ErrorBuilder<T> = Object.assign(
    validateAndCreate,
    {
      addNotes: (...notes: string[]): ErrorBuilder<T> => createBuilderWithNotes(notes),
      from: (cause: Error | Err<Error>): ErrorBuilder<T> =>
        createBuilderWithCause(isError(cause) ? cause : cause.error, []),
    }
  );

  return builder;
};

/**
 * Creates an ExceptionGroup with multiple errors
 *
 * @example
 * const errors = exceptionGroup([
 *   SizeError({ current: 3, wanted: 5 }),
 *   ValidationError({ field: "email" })
 * ]);
 */
export const exceptionGroup = (exceptions: readonly (Error | Err<Error> | ErrorGroup)[]): ErrorGroup => {
  const extractedErrors: Error[] = [];
  for (const e of exceptions) {
    if (isErrorGroup(e)) {
      // Flatten nested ErrorGroups
      extractedErrors.push(...e.exceptions);
    } else if (isError(e)) {
      extractedErrors.push(e);
    } else {
      // Handle Err<Error>
      extractedErrors.push(e.error);
    }
  }
  return Object.freeze({
    name: "ExceptionGroup",
    exceptions: Object.freeze(extractedErrors),
  });
};

/**
 * Functional throw - converts a value to Err for use in transformations
 *
 * @example
 * const result = ok(value).map(x => {
 *   if (!x) return raise(SizeError({ current: 0, wanted: 1 }));
 *   return ok(x);
 * });
 */
export const raise = <E>(error: Err<E>): Err<E> => {
  return error;
};

/**
 * Type guard to check if a value is an Error
 */
export const isError = (value: unknown): value is Error =>
  value !== null &&
  typeof value === "object" &&
  "name" in value &&
  "args" in value &&
  "notes" in value &&
  "cause" in value;

/**
 * Type guard to check if a value is an ErrorGroup
 */
export const isErrorGroup = (value: unknown): value is ErrorGroup =>
  value !== null &&
  typeof value === "object" &&
  "name" in value &&
  "exceptions" in value &&
  Array.isArray((value as ErrorGroup).exceptions) &&
  ((value as ErrorGroup).exceptions.length === 0 || isError((value as ErrorGroup).exceptions[0]));

/**
 * Check if Result is Err with Error type
 */
export const isErrWithError = (result: Result<unknown, unknown>): result is Err<Error> =>
  result.ok === false && isError(result.error as Error);

/**
 * Check if Try is TryFailure with Error type
 */
export const isErrTryWithError = (t: Try<unknown, unknown>): t is TryFailure<Error> =>
  t.ok === false && isError(t.error as Error);

/**
 * Get the message from an Error or ErrorGroup
 */
export const getErrorMessage = (e: Error | ErrorGroup): string => {
  if (isErrorGroup(e)) {
    return `${e.name}: ${e.exceptions.length} error(s)`;
  }
  return e.args
    ? `${e.name}: ${JSON.stringify(e.args)}`
    : e.name;
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
