/**
 * Error builder factory
 *
 * Creates Error<T> instances with Zod validation, enrichment, and chaining.
 * Inspired by Python's exception classes.
 */

import type { ErrorOptions, ErrorBuilder, Error, ErrorGroup, NativeError } from "./types";
import { isError, isErrorGroup } from "./guards";
import type { Err } from "../result";
import { some, none, type Maybe } from "../maybe";

/**
 * Captures and formats stack trace, removing internal frames
 */
const captureStack = (): string | undefined => {
  const err = new Error();
  return err.stack?.split('\n').slice(3).join('\n');
};

/**
 * Creates a base error object with all properties.
 * Uses simple object literal + Object.freeze pattern (no property descriptors).
 */
const createErrorObject = <T>(
  name: string,
  args: T,
  notes: readonly string[],
  cause: Maybe<Error>,
  message: string,
  stack: string | undefined,
  isValidationError = false
): Error<T> => {
  const errName = isValidationError ? `${name}ValidationError` : name;
  const errMessage = isValidationError ? `${errName}: ${message}` : message;

  const createNew = (
    newArgs: T,
    newNotes: readonly string[],
    newCause: Maybe<Error>,
    newIsValidationError: boolean
  ): Error<T> =>
    createErrorObject<T>(name, newArgs, newNotes, newCause, message, stack, newIsValidationError);

  const self: Error<T> = {
    // ErrorData (required by NativeError interface)
    name: errName,
    args,
    notes,
    cause,
    stack,
    message: errMessage,

    // ErrorResult
    ok: false as const,
    isOk(): false { return false; },
    isErr(): true { return true; },
    map(_fn: (value: never) => unknown): Error<T> { return self; },
    flatMap(_fn: (value: never) => Error<T>): Error<T> { return self; },
    mapErr<F extends NativeError>(_fn: (error: Error<T>) => F): Error<T> { return self; },
    getOrElse<T2>(defaultValue: T2): T2 { return defaultValue; },
    getOrCompute<T2>(_fn: () => T2): T2 { return _fn(); },
    tap(): Error<T> { return self; },
    tapErr(): Error<T> { return self; },
    match<U>(_ok: (value: never) => U, err: (error: Error<T>) => U): U { return err(self); },
    unwrap(): never { throw self; },

    // Self-reference (e.error === e)
    get error(): Error<T> { return self; },

    // Error-specific methods
    addNotes(...moreNotes: string[]): Error<T> {
      if (isValidationError) {
        return createNew(args, Object.freeze([...notes, "Cannot add notes to validation error"]), cause, true);
      }
      return createNew(args, Object.freeze([...notes, ...moreNotes]), cause, false);
    },

    from(newCause: Error | Err<Error> | Maybe<Error>): Error<T> {
      if (isValidationError) {
        return createNew(args, Object.freeze([...notes, "Cannot chain cause on validation error"]), cause, true);
      }
      const extractedCause = extractCause(newCause);
      return createErrorObject<T>(name, args, notes, extractedCause, message, stack, false);
    },
  } as Error<T>;

  return Object.freeze(self);
};

/**
 * Extracts Error from Err<Error>, Some<Error>, or plain Error
 */
const extractCause = (input: Error | Err<Error> | Maybe<Error>): Maybe<Error> => {
  // Helper to check if value is an object
  const isObject = (val: unknown): val is Record<string, unknown> =>
    val !== null && typeof val === 'object';

  // Check if it's Err<Error> first - has ok: false and error property
  if (isObject(input) && input.ok === false && 'error' in input) {
    return some((input as Err<Error>).error);
  }

  // Check if it's Some<Error> - has ok: true and value property
  if (isObject(input) && input.ok === true && 'value' in input) {
    const value = (input as { value: unknown }).value;
    return isError(value as Error) ? some(value as Error) : none();
  }

  // Check if it's None - has ok: false and no value/error properties
  if (isObject(input) && input.ok === false && !('error' in input)) {
    return none();
  }

  // Otherwise it's a plain Error (the library's Error type)
  if (isError(input as Error)) {
    return some(input as Error);
  }

  // Fallback - no valid cause
  return none();
};

/**
 * Creates an Error type builder with Zod validation
 */
export const error = <T>(options: ErrorOptions<T>): ErrorBuilder<T> => {
  const { name, schema, message: messageFn } = options;

  return (args: T): Error<T> => {
    const parsed = schema.safeParse(args);

    if (!parsed.success) {
      // Zod validation failed - create validation error
      const validationMessage = parsed.error.message;
      return createErrorObject<T>(
        name, args,
        Object.freeze([validationMessage]),
        none(),
        validationMessage,
        captureStack(),
        true // isValidationError
      );
    }

    // Valid args - create normal error
    const customMessage = messageFn ? messageFn(args) : `${name}: ${JSON.stringify(args)}`;
    return createErrorObject<T>(
      name, parsed.data,
      Object.freeze([]),
      none(),
      customMessage,
      captureStack()
    );
  };
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
  // Flatten nested errors
  const extractedErrors: Error[] = [];
  for (const e of exceptions) {
    if (isErrorGroup(e)) {
      extractedErrors.push(...e.exceptions);
    } else if (isError(e)) {
      extractedErrors.push(e);
    } else {
      extractedErrors.push(e.error);
    }
  }

  const errorCount = extractedErrors.length;
  const message = `ExceptionGroup: ${errorCount} error${errorCount !== 1 ? 's' : ''}`;

  const self: ErrorGroup = {
    // ErrorData
    name: "ExceptionGroup",
    args: Object.freeze(extractedErrors),
    notes: Object.freeze([]),
    cause: none(),
    stack: captureStack(),
    message,

    // Additional ErrorGroup property
    exceptions: Object.freeze(extractedErrors),

    // ErrorResult
    ok: false as const,
    isOk(): false { return false; },
    isErr(): true { return true; },
    map(_fn: (value: never) => unknown): ErrorGroup { return self; },
    flatMap(_fn: (value: never) => Error<unknown>): ErrorGroup { return self; },
    mapErr<F extends NativeError>(_fn: (error: ErrorGroup) => F): ErrorGroup { return self; },
    getOrElse<T>(defaultValue: T): T { return defaultValue; },
    getOrCompute<T>(_fn: () => T): T { return _fn(); },
    tap(): ErrorGroup { return self; },
    tapErr(): ErrorGroup { return self; },
    match<U>(_ok: (value: never) => U, err: (error: ErrorGroup) => U): U { return err(self); },
    unwrap(): never { throw self; },

    // Self-reference
    get error(): ErrorGroup { return self; },

    // ErrorGroup-specific: addNotes and from are no-ops
    addNotes(): ErrorGroup { return self; },
    from(): ErrorGroup { return self; },
  } as ErrorGroup;

  return Object.freeze(self);
};
