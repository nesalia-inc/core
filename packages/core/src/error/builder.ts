/**
 * Error builder factory
 */

import type { ErrorOptions, ErrorBuilder, ErrWithMethods, Error, ErrorGroup } from "./types.js";
import type { NativeError } from "../result.js";
import { isError, isErrorGroup, isErrWithError } from "./guards.js";
import type { Err } from "../result.js";
import { some, none, type Maybe } from "../maybe";

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

  /**
   * Creates an ErrWithMethods from args
   */
  const createErr = (args: T, notes: string[] = [], cause: Maybe<Error> = none()): ErrWithMethods<T> => {
    // Capture stack trace
    let stack: string | undefined;
    const err = new Error();
    if (err.stack) {
      stack = err.stack.split('\n').slice(3).join('\n');
    }

    // Generate custom message if provided, otherwise use default
    const customMessage = messageFn ? messageFn(args) : `${name}: ${JSON.stringify(args)}`;

    const errorObj: Error<T> = Object.freeze({
      name,
      args,
      notes: Object.freeze([...notes]),
      cause,
      stack,
      message: customMessage,
    });

    return Object.freeze({
      ok: false as const,
      error: errorObj,
      isOk(): false { return false; },
      isErr(): true { return true; },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      map<_U>(): Err<Error<T>> { return this as Err<Error<T>>; },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      flatMap<_U>(): Err<Error<T>> { return this as Err<Error<T>>; },
      mapErr<F extends NativeError>(_fn: (error: Error<T>) => F): Err<F> { return this as unknown as Err<F>; },
      getOrElse<T2>(defaultValue: T2): T2 { return defaultValue; },
      getOrCompute<T2>(fn: () => T2): T2 { return fn(); },
      tap(): ErrWithMethods<T> { return this; },
      tapErr(): ErrWithMethods<T> { return this; },
      match<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(errorObj); },
      unwrap(): never { throw errorObj; },
      addNotes: (...moreNotes: string[]): ErrWithMethods<T> =>
        createErr(args, [...notes, ...moreNotes], cause),
      from: (newCause: Error | Err<Error> | Maybe<Error>): ErrWithMethods<T> => {
        // Helper to check if value is a plain object
        const isObject = (val: unknown): val is Record<string, unknown> =>
          val !== null && typeof val === "object";

        // Check if it's Some<T> - has 'value' property (None and Err don't have this)
        if (isObject(newCause) && "value" in newCause) {
          const err = newCause.value;
          if (isErrWithError(err as unknown as Err<Error>)) {
            return createErr(args, notes, some((err as unknown as Err<Error>).error));
          }
          return createErr(args, notes, some(err as Error));
        }

        // Check if it's Err<Error> - has 'ok: false' and 'error' property
        if (isObject(newCause) && newCause.ok === false && "error" in newCause) {
          return createErr(args, notes, some((newCause as Err<Error>).error));
        }

        // Otherwise it's a plain Error (or something else)
        // Wrap it in some if it's an Error
        if (isError(newCause as unknown as Error)) {
          return createErr(args, notes, some(newCause as Error));
        }

        // Fallback: no cause
        return createErr(args, notes, none());
      },
    });
  };

  /**
   * Wraps an existing Error object in ErrWithMethods
   * Used for validation errors - addNotes and from return special error messages
   */
  const wrapError = (errorObj: Error<T>): ErrWithMethods<T> =>
    Object.freeze({
      ok: false as const,
      error: errorObj,
      isOk(): false { return false; },
      isErr(): true { return true; },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      map<_U>(): Err<Error<T>> { return this as Err<Error<T>>; },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      flatMap<_U>(): Err<Error<T>> { return this as Err<Error<T>>; },
      mapErr<F extends NativeError>(_fn: (error: Error<T>) => F): Err<F> { return this as unknown as Err<F>; },
      getOrElse<T2>(defaultValue: T2): T2 { return defaultValue; },
      getOrCompute<T2>(fn: () => T2): T2 { return fn(); },
      tap(): ErrWithMethods<T> { return this; },
      tapErr(): ErrWithMethods<T> { return this; },
      match<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(errorObj); },
      unwrap(): never { throw errorObj; },
      addNotes: (): ErrWithMethods<T> => wrapError({
        ...errorObj,
        notes: [...errorObj.notes, "Cannot add notes to validation error"],
      }),
      from: (): ErrWithMethods<T> => wrapError({
        ...errorObj,
        notes: [...errorObj.notes, "Cannot chain cause on validation error"],
      }),
    });

  // Main builder function that validates args with Zod schema
  const validateAndCreate = (args: T): ErrWithMethods<T> => {
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
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
        cause: none(),
        stack,
        message: `${name}ValidationError: ${parsed.error.message}`,
      });
      return wrapError(validationError);
    }
    return createErr(parsed.data, [], none());
  };

  return validateAndCreate;
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
