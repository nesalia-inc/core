/**
 * Error builder factory
 */

import type { ErrorOptions, ErrorBuilder, Error, ErrorGroup, NativeError } from "./types";
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
 * e.ok === false; // true
 * e.error === e;  // true (self-reference)
 */
export const error = <T>(options: ErrorOptions<T>): ErrorBuilder<T> => {
  const name = options.name;
  const schema = options.schema;
  const messageFn = options.message;

  // Prototype with error getter for self-reference
  const errorPrototype = Object.create(Error.prototype, {
    error: {
      get(this: Error<T>): Error<T> { return this; },
      enumerable: true,
      configurable: false
    }
  });

  /**
   * Creates an Error<T> from args with self-referential error property
   */
  const createErr = (args: T, notes: string[] = [], cause: Maybe<Error> = none()): Error<T> => {
    // Capture stack trace
    let stack: string | undefined;
    const err = new Error();
    if (err.stack) {
      stack = err.stack.split('\n').slice(3).join('\n');
    }

    // Generate custom message if provided, otherwise use default
    const customMessage = messageFn ? messageFn(args) : `${name}: ${JSON.stringify(args)}`;

    const errorObj: Error<T> = Object.create(errorPrototype, {
      name: { value: name, enumerable: true, writable: false, configurable: false },
      args: { value: args, enumerable: true, writable: false, configurable: false },
      notes: { value: Object.freeze([...notes]), enumerable: true, writable: false, configurable: false },
      cause: { value: cause, enumerable: true, writable: false, configurable: false },
      stack: { value: stack, enumerable: true, writable: false, configurable: false },
      message: { value: customMessage, enumerable: true, writable: false, configurable: false },
      ok: { value: false as const, enumerable: true, writable: false, configurable: false },
      isOk: { value: (): false => false as const, enumerable: true, writable: false, configurable: false },
      isErr: { value: (): true => true as const, enumerable: true, writable: false, configurable: false },
      map: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: function<_U>(): Error<T> { return this as Error<T>; },
        enumerable: true, writable: false, configurable: false
      },
      flatMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: function<_U>(): Error<T> { return this as Error<T>; },
        enumerable: true, writable: false, configurable: false
      },
      mapErr: {
        value: function<F extends NativeError>(_fn: (error: Error<T>) => F): Error<T> { return this as Error<T>; },
        enumerable: true, writable: false, configurable: false
      },
      getOrElse: { value: function<T2>(defaultValue: T2): T2 { return defaultValue; }, enumerable: true, writable: false, configurable: false },
      getOrCompute: { value: function<T2>(fn: () => T2): T2 { return fn(); }, enumerable: true, writable: false, configurable: false },
      tap: { value: function(): Error<T> { return this; }, enumerable: true, writable: false, configurable: false },
      tapErr: { value: function(): Error<T> { return this; }, enumerable: true, writable: false, configurable: false },
      match: {
        value: function<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(this); },
        enumerable: true, writable: false, configurable: false
      },
      unwrap: {
        value: function(): never { throw this; },
        enumerable: true, writable: false, configurable: false
      },
      addNotes: {
        value: (...moreNotes: string[]): Error<T> =>
          createErr(args, [...notes, ...moreNotes], cause),
        enumerable: true, writable: false, configurable: false
      },
      from: {
        value: (newCause: Error | Err<Error> | Maybe<Error>): Error<T> => {
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
    return Object.freeze(errorObj);
  };

  /**
   * Creates a validation Error with special behavior for addNotes and from
   */
  const createValidationError = (args: T, errorMessage: string, parsedStack?: string): Error<T> => {
    // Capture the initial notes and message for use in closures
    const initialNotes = Object.freeze([errorMessage]);
    const initialMessage = `${name}ValidationError: ${errorMessage}`;

    const validationError: Error<T> = Object.create(errorPrototype, {
      name: { value: `${name}ValidationError`, enumerable: true, writable: false, configurable: false },
      args: { value: args, enumerable: true, writable: false, configurable: false },
      notes: { value: initialNotes, enumerable: true, writable: false, configurable: false },
      cause: { value: none(), enumerable: true, writable: false, configurable: false },
      stack: { value: parsedStack, enumerable: true, writable: false, configurable: false },
      message: { value: initialMessage, enumerable: true, writable: false, configurable: false },
      ok: { value: false as const, enumerable: true, writable: false, configurable: false },
      isOk: { value: (): false => false as const, enumerable: true, writable: false, configurable: false },
      isErr: { value: (): true => true as const, enumerable: true, writable: false, configurable: false },
      map: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: function<_U>(): Error<T> { return this as Error<T>; },
        enumerable: true, writable: false, configurable: false
      },
      flatMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        value: function<_U>(): Error<T> { return this as Error<T>; },
        enumerable: true, writable: false, configurable: false
      },
      mapErr: {
        value: function<F extends NativeError>(_fn: (error: Error<T>) => F): Error<T> { return this as Error<T>; },
        enumerable: true, writable: false, configurable: false
      },
      getOrElse: { value: function<T2>(defaultValue: T2): T2 { return defaultValue; }, enumerable: true, writable: false, configurable: false },
      getOrCompute: { value: function<T2>(fn: () => T2): T2 { return fn(); }, enumerable: true, writable: false, configurable: false },
      tap: { value: function(): Error<T> { return this; }, enumerable: true, writable: false, configurable: false },
      tapErr: { value: function(): Error<T> { return this; }, enumerable: true, writable: false, configurable: false },
      match: {
        value: function<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(this); },
        enumerable: true, writable: false, configurable: false
      },
      unwrap: {
        value: function(): never { throw this; },
        enumerable: true, writable: false, configurable: false
      },
      addNotes: {
        value: function(): Error<T> {
          const self = this as Error<T>;
          return Object.freeze(Object.assign(Object.create(errorPrototype, {
            name: { value: `${name}ValidationError`, enumerable: true, writable: false, configurable: false },
            args: { value: self.args, enumerable: true, writable: false, configurable: false },
            notes: { value: Object.freeze([...self.notes, "Cannot add notes to validation error"]), enumerable: true, writable: false, configurable: false },
            cause: { value: self.cause, enumerable: true, writable: false, configurable: false },
            stack: { value: self.stack, enumerable: true, writable: false, configurable: false },
            message: { value: self.message, enumerable: true, writable: false, configurable: false },
            ok: { value: false as const, enumerable: true, writable: false, configurable: false },
            isOk: { value: (): false => false as const, enumerable: true, writable: false, configurable: false },
            isErr: { value: (): true => true as const, enumerable: true, writable: false, configurable: false },
            map: {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              value: function<_U>(): Error<T> { return this as Error<T>; },
              enumerable: true, writable: false, configurable: false
            },
            flatMap: {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              value: function<_U>(): Error<T> { return this as Error<T>; },
              enumerable: true, writable: false, configurable: false
            },
            mapErr: {
              value: function<F extends NativeError>(_fn: (error: Error<T>) => F): Error<T> { return this as Error<T>; },
              enumerable: true, writable: false, configurable: false
            },
            getOrElse: { value: function<T2>(defaultValue: T2): T2 { return defaultValue; }, enumerable: true, writable: false, configurable: false },
            getOrCompute: { value: function<T2>(fn: () => T2): T2 { return fn(); }, enumerable: true, writable: false, configurable: false },
            tap: { value: function(): Error<T> { return this; }, enumerable: true, writable: false, configurable: false },
            tapErr: { value: function(): Error<T> { return this; }, enumerable: true, writable: false, configurable: false },
            match: {
              value: function<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(this); },
              enumerable: true, writable: false, configurable: false
            },
            unwrap: {
              value: function(): never { throw this; },
              enumerable: true, writable: false, configurable: false
            },
            addNotes: {
              value: function(): Error<T> { return self.addNotes(); },
              enumerable: true, writable: false, configurable: false
            },
            from: {
              value: function(): Error<T> {
                // Create a new validation error with "Cannot chain cause" appended, ignoring the argument
                return Object.freeze(Object.assign(Object.create(errorPrototype, {
                  name: { value: `${name}ValidationError`, enumerable: true, writable: false, configurable: false },
                  args: { value: self.args, enumerable: true, writable: false, configurable: false },
                  notes: { value: Object.freeze([...self.notes, "Cannot chain cause on validation error"]), enumerable: true, writable: false, configurable: false },
                  cause: { value: self.cause, enumerable: true, writable: false, configurable: false },
                  stack: { value: self.stack, enumerable: true, writable: false, configurable: false },
                  message: { value: self.message, enumerable: true, writable: false, configurable: false },
                  ok: { value: false as const, enumerable: true, writable: false, configurable: false },
                  isOk: { value: (): false => false as const, enumerable: true, writable: false, configurable: false },
                  isErr: { value: (): true => true as const, enumerable: true, writable: false, configurable: false },
                  map: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    value: function<_U>(): Error<T> { return this as Error<T>; },
                    enumerable: true, writable: false, configurable: false
                  },
                  flatMap: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    value: function<_U>(): Error<T> { return this as Error<T>; },
                    enumerable: true, writable: false, configurable: false
                  },
                  mapErr: {
                    value: function<F extends NativeError>(_fn: (error: Error<T>) => F): Error<T> { return this as Error<T>; },
                    enumerable: true, writable: false, configurable: false
                  },
                  getOrElse: { value: function<T2>(defaultValue: T2): T2 { return defaultValue; }, enumerable: true, writable: false, configurable: false },
                  getOrCompute: { value: function<T2>(fn: () => T2): T2 { return fn(); }, enumerable: true, writable: false, configurable: false },
                  tap: { value: function(): Error<T> { return this; }, enumerable: true, writable: false, configurable: false },
                  tapErr: { value: function(): Error<T> { return this; }, enumerable: true, writable: false, configurable: false },
                  match: {
                    value: function<T2>(_: unknown, errFn: (e: Error<T>) => T2): T2 { return errFn(this); },
                    enumerable: true, writable: false, configurable: false
                  },
                  unwrap: {
                    value: function(): never { throw this; },
                    enumerable: true, writable: false, configurable: false
                  },
                  addNotes: {
                    value: function(): Error<T> { return self.addNotes(); },
                    enumerable: true, writable: false, configurable: false
                  },
                  from: {
                    value: function(): Error<T> { return self.from(none()); },
                    enumerable: true, writable: false, configurable: false
                  },
                })));
              },
              enumerable: true, writable: false, configurable: false
            },
          })));
        },
        enumerable: true, writable: false, configurable: false
      },
    });
    return Object.freeze(validationError);
  };

  // Main builder function that validates args with Zod schema
  const validateAndCreate = (args: T): Error<T> => {
    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      // Capture stack trace
      let stack: string | undefined;
      const err = new Error();
      if (err.stack) {
        stack = err.stack.split('\n').slice(3).join('\n');
      }

      return createValidationError(parsed.error.issues as unknown as T, parsed.error.message, stack);
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

  // Prototype with error getter for self-reference
  const errorGroupPrototype = Object.create(Error.prototype, {
    error: {
      get(this: ErrorGroup): ErrorGroup { return this; },
      enumerable: true,
      configurable: false
    }
  });

  return Object.freeze(Object.create(errorGroupPrototype, {
    name: { value: "ExceptionGroup", enumerable: true, writable: false, configurable: false },
    args: { value: Object.freeze(extractedErrors), enumerable: true, writable: false, configurable: false },
    notes: { value: Object.freeze([]), enumerable: true, writable: false, configurable: false },
    cause: { value: none(), enumerable: true, writable: false, configurable: false },
    stack: { value: stack, enumerable: true, writable: false, configurable: false },
    message: { value: message, enumerable: true, writable: false, configurable: false },
    exceptions: { value: Object.freeze(extractedErrors), enumerable: true, writable: false, configurable: false },
    ok: { value: false as const, enumerable: true, writable: false, configurable: false },
    isOk: { value: (): false => false as const, enumerable: true, writable: false, configurable: false },
    isErr: { value: (): true => true as const, enumerable: true, writable: false, configurable: false },
    map: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      value: function<_U>(): ErrorGroup { return this as ErrorGroup; },
      enumerable: true, writable: false, configurable: false
    },
    flatMap: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      value: function<_U>(): ErrorGroup { return this as ErrorGroup; },
      enumerable: true, writable: false, configurable: false
    },
    mapErr: {
      value: function<F extends NativeError>(_fn: (error: ErrorGroup) => F): ErrorGroup { return this as ErrorGroup; },
      enumerable: true, writable: false, configurable: false
    },
    getOrElse: { value: function<T2>(defaultValue: T2): T2 { return defaultValue; }, enumerable: true, writable: false, configurable: false },
    getOrCompute: { value: function<T2>(fn: () => T2): T2 { return fn(); }, enumerable: true, writable: false, configurable: false },
    tap: { value: function(): ErrorGroup { return this; }, enumerable: true, writable: false, configurable: false },
    tapErr: { value: function(): ErrorGroup { return this; }, enumerable: true, writable: false, configurable: false },
    match: {
      value: function<T2>(_: unknown, errFn: (e: ErrorGroup) => T2): T2 { return errFn(this); },
      enumerable: true, writable: false, configurable: false
    },
    unwrap: {
      value: function(): never { throw this; },
      enumerable: true, writable: false, configurable: false
    },
    addNotes: {
      value: function(): ErrorGroup { return this; },
      enumerable: true, writable: false, configurable: false
    },
    from: {
      value: function(): ErrorGroup { return this; },
      enumerable: true, writable: false, configurable: false
    },
  }));
};
