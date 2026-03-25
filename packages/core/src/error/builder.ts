/**
 * Error builder factory
 */

import type { ErrorOptions, ErrorBuilder, ErrWithMethods, Error, ErrorGroup } from "./types.js";
import { isError, isErrorGroup } from "./guards.js";
import type { Err } from "../result.js";

/**
 * Native JavaScript Error type alias
 */
type NativeError = globalThis.Error;

/**
 * Creates an Error type builder with Zod validation
 * Use like Python exception classes
 *
 * @example
 * const SizeError = error({
 *   name: "SizeError",
 *   schema: z.object({ current: z.number(), wanted: z.number() })
 * });
 *
 * // Use as Err - args will be validated
 * const e = SizeError({ current: 3, wanted: 5 });
 */
export const error = <T>(options: ErrorOptions<T>): ErrorBuilder<T> => {
  const name = options.name;
  const schema = options.schema;
  const messageFn = options.message;

  const createError = (args: T, notes: string[] = [], cause: NativeError | null = null): Error<T> => {
    // Capture stack trace
    let stack: string | undefined;
    const err = new Error();
    if (err.stack) {
      // Extract just the stack trace lines, skipping the first few lines that are internal
      stack = err.stack.split('\n').slice(3).join('\n');
    }

    // Generate custom message if provided, otherwise use default
    const customMessage = messageFn ? messageFn(args) : `${name}: ${JSON.stringify(args)}`;

    return Object.freeze({
      name,
      args,
      notes: Object.freeze([...notes]),
      cause,
      stack,
      message: customMessage,
    }) as Error<T>;
  };

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

  // Main builder function that validates args with Zod schema
  const validateAndCreate = (args: T): ErrWithMethods<T> => {
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      // Return error with validation issues as args
      // Capture stack trace
      let stack: string | undefined;
      const err = new Error();
      if (err.stack) {
        stack = err.stack.split('\n').slice(3).join('\n');
      }

      const validationError: Error<T> = Object.freeze({
        name: `${name}ValidationError`,
        args: parsed.error.issues as unknown as T,
        notes: Object.freeze([parsed.error.message]),
        cause: null,
        stack,
        message: `${name}ValidationError: ${parsed.error.message}`,
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
    return createErrWithMethods(parsed.data, [], null);
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
