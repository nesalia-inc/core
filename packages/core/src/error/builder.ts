/**
 * Error builder factory
 */

import type { ErrorOptions, ErrorBuilder, ErrWithMethods, Error, ErrorGroup, NativeError } from "./types";
import { isError, isErrorGroup, isErrWithError } from "./guards";
import type { Err } from "../result";
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

    const errorObj: Error<T> = Object.create(Error.prototype, {
      name: { value: name, enumerable: true, writable: false, configurable: false },
      args: { value: args, enumerable: true, writable: false, configurable: false },
      notes: { value: Object.freeze([...notes]), enumerable: true, writable: false, configurable: false },
      cause: { value: cause, enumerable: true, writable: false, configurable: false },
      stack: { value: stack, enumerable: true, writable: false, configurable: false },
      message: { value: customMessage, enumerable: true, writable: false, configurable: false },
    });
    Object.freeze(errorObj);

    const errWithMethods: ErrWithMethods<T> = Object.create(null, {
      ok: { value: false as const, enumerable: true, writable: false, configurable: false },
      error: { value: errorObj, enumerable: true, writable: false, configurable: false },
      isOk: { value: (): false => false as const, enumerable: true, writable: false, configurable: false },
      isErr: { value: (): true => true as const, enumerable: true, writable: false, configurable: false },
      map: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: function<_U>(): Err<Error<T>> { return this as Err<Error<T>>; },
        enumerable: true, writable: false, configurable: false
      },
      flatMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: function<_U>(): Err<Error<T>> { return this as Err<Error<T>>; },
        enumerable: true, writable: false, configurable: false
      },
      mapErr: {
        value: function<F extends NativeError>(_fn: (error: Error<T>) => F): Err<F> { return this as unknown as Err<F>; },
        enumerable: true, writable: false, configurable: false
      },
      getOrElse: { value: function<T2>(defaultValue: T2): T2 { return defaultValue; }, enumerable: true, writable: false, configurable: false },
      getOrCompute: { value: function<T2>(fn: () => T2): T2 { return fn(); }, enumerable: true, writable: false, configurable: false },
      tap: { value: function(): ErrWithMethods<T> { return this; }, enumerable: true, writable: false, configurable: false },
      tapErr: { value: function(): ErrWithMethods<T> { return this; }, enumerable: true, writable: false, configurable: false },
      match: { value: function<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(errorObj); }, enumerable: true, writable: false, configurable: false },
      unwrap: { value: function(): never { throw errorObj; }, enumerable: true, writable: false, configurable: false },
      addNotes: {
        value: (...moreNotes: string[]): ErrWithMethods<T> =>
          createErr(args, [...notes, ...moreNotes], cause),
        enumerable: true, writable: false, configurable: false
      },
      from: {
        value: (newCause: Error | Err<Error> | Maybe<Error>): ErrWithMethods<T> => {
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
        enumerable: true, writable: false, configurable: false
      },
    });
    return Object.freeze(errWithMethods);
  };

  /**
   * Wraps an existing Error object in ErrWithMethods
   * Used for validation errors - addNotes and from return special error messages
   */
  const wrapError = (errorObj: Error<T>): ErrWithMethods<T> => {
    const frozen: ErrWithMethods<T> = Object.create(null, {
      ok: { value: false as const, enumerable: true, writable: false, configurable: false },
      error: { value: errorObj, enumerable: true, writable: false, configurable: false },
      isOk: { value: (): false => false as const, enumerable: true, writable: false, configurable: false },
      isErr: { value: (): true => true as const, enumerable: true, writable: false, configurable: false },
      map: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: function<_U>(): Err<Error<T>> { return this as Err<Error<T>>; },
        enumerable: true, writable: false, configurable: false
      },
      flatMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: function<_U>(): Err<Error<T>> { return this as Err<Error<T>>; },
        enumerable: true, writable: false, configurable: false
      },
      mapErr: {
        value: function<F extends NativeError>(_fn: (error: Error<T>) => F): Err<F> { return this as unknown as Err<F>; },
        enumerable: true, writable: false, configurable: false
      },
      getOrElse: { value: function<T2>(defaultValue: T2): T2 { return defaultValue; }, enumerable: true, writable: false, configurable: false },
      getOrCompute: { value: function<T2>(fn: () => T2): T2 { return fn(); }, enumerable: true, writable: false, configurable: false },
      tap: { value: function(): ErrWithMethods<T> { return this; }, enumerable: true, writable: false, configurable: false },
      tapErr: { value: function(): ErrWithMethods<T> { return this; }, enumerable: true, writable: false, configurable: false },
      match: { value: function<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(errorObj); }, enumerable: true, writable: false, configurable: false },
      unwrap: { value: function(): never { throw errorObj; }, enumerable: true, writable: false, configurable: false },
      addNotes: {
        value: (): ErrWithMethods<T> => wrapError(Object.freeze(Object.assign(Object.create(Error.prototype), {
          ...errorObj,
          notes: [...errorObj.notes, "Cannot add notes to validation error"],
        }))),
        enumerable: true, writable: false, configurable: false
      },
      from: {
        value: (): ErrWithMethods<T> => wrapError(Object.freeze(Object.assign(Object.create(Error.prototype), {
          ...errorObj,
          notes: [...errorObj.notes, "Cannot chain cause on validation error"],
        }))),
        enumerable: true, writable: false, configurable: false
      },
    });
    return frozen;
  };

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

      const validationError: Error<T> = Object.create(Error.prototype, {
        name: { value: `${name}ValidationError`, enumerable: true, writable: false, configurable: false },
        args: { value: parsed.error.issues as unknown as T, enumerable: true, writable: false, configurable: false },
        notes: { value: Object.freeze([parsed.error.message]), enumerable: true, writable: false, configurable: false },
        cause: { value: none(), enumerable: true, writable: false, configurable: false },
        stack: { value: stack, enumerable: true, writable: false, configurable: false },
        message: { value: `${name}ValidationError: ${parsed.error.message}`, enumerable: true, writable: false, configurable: false },
      });
      Object.freeze(validationError);
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

  // Capture stack trace
  let stack: string | undefined;
  const err = new Error();
  if (err.stack) {
    stack = err.stack.split('\n').slice(3).join('\n');
  }

  const errorCount = extractedErrors.length;
  const message = `ExceptionGroup: ${errorCount} error${errorCount !== 1 ? 's' : ''}`;

  return Object.freeze(Object.create(Error.prototype, {
    name: { value: "ExceptionGroup", enumerable: true, writable: false, configurable: false },
    args: { value: Object.freeze(extractedErrors), enumerable: true, writable: false, configurable: false },
    notes: { value: Object.freeze([]), enumerable: true, writable: false, configurable: false },
    cause: { value: none(), enumerable: true, writable: false, configurable: false },
    stack: { value: stack, enumerable: true, writable: false, configurable: false },
    message: { value: message, enumerable: true, writable: false, configurable: false },
    exceptions: { value: Object.freeze(extractedErrors), enumerable: true, writable: false, configurable: false },
  }));
};
