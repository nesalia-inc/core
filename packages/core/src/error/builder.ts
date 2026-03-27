/**
 * Error builder factory
 *
 * Creates Error<T> instances with Zod validation, enrichment, and chaining.
 * Inspired by Python's exception classes.
 */

import type { ErrorOptions, ErrorBuilder, Error, ErrorGroup } from "./types";
import { isError, isErrorGroup } from "./guards";
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
 *
 * Error<T> is a plain error object - Result methods come from err() wrapper.
 */
const createErrorObject = <T>(
  name: string,
  args: T,
  notes: readonly string[],
  cause: Maybe<Error>,
  message: string,
  stack: string | undefined,
  isValidationError: boolean
): Error<T> => {
  const errName = isValidationError ? `${name}ValidationError` : name;
  const errMessage = isValidationError ? `${errName}: ${message}` : message;

  const self: Error<T> = {
    name: errName,
    args,
    notes,
    cause,
    stack,
    message: errMessage,
    addNotes(this: Error<T>, ...moreNotes: string[]): Error<T> {
      if (isValidationError) {
        return createErrorObject(name, args, Object.freeze([...notes, "Cannot add notes to validation error"]), cause, message, stack, true);
      }
      return createErrorObject(name, args, Object.freeze([...notes, ...moreNotes]), cause, message, stack, false);
    },
    from(this: Error<T>, newCause: Error | Maybe<Error>): Error<T> {
      if (isValidationError) {
        return createErrorObject(name, args, Object.freeze([...notes, "Cannot chain cause on validation error"]), cause, message, stack, true);
      }
      const extractedCause = extractCause(newCause);
      return createErrorObject(name, args, notes, extractedCause, message, stack, false);
    },
  } as Error<T>;

  return Object.freeze(self);
};

/**
 * Extracts Error from Err<Error>, Some<Error>, or plain Error
 */
const extractCause = (input: Error | Maybe<Error>): Maybe<Error> => {
  // Helper to check if value is an object
  const isObject = (val: unknown): val is Record<string, unknown> =>
    val !== null && typeof val === 'object';

  // Check if it's Some<Error> - has ok: true and value property
  if (isObject(input) && input.ok === true && 'value' in input) {
    const value = (input as { value: unknown }).value;
    return isError(value as Error) ? some(value as Error) : none();
  }

  // Check if it's Err<Error> - has ok: false and error property
  if (isObject(input) && input.ok === false && 'error' in input) {
    const error = (input as unknown as { error: unknown }).error;
    return isError(error as Error) ? some(error as Error) : none();
  }

  // Check if it's None - has ok: false and no value/error properties
  if (isObject(input) && input.ok === false) {
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
 * Creates an Error type builder with optional Zod validation
 */
export const error = <T>(options: ErrorOptions<T>): ErrorBuilder<T> => {
  const { name, schema, message: messageFn } = options;

  return (args: T): Error<T> => {
    // If no schema provided, skip validation and use args directly
    if (!schema) {
      const customMessage = messageFn ? messageFn(args) : `${name}: ${JSON.stringify(args)}`;
      return createErrorObject<T>(
        name, args,
        Object.freeze([]),
        none(),
        customMessage,
        captureStack(),
        false
      );
    }

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
    const customMessage = messageFn ? messageFn(args) : `${name}: ${JSON.stringify(parsed.data)}`;
    return createErrorObject<T>(
      name, parsed.data,
      Object.freeze([]),
      none(),
      customMessage,
      captureStack(),
      false
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
export const exceptionGroup = (exceptions: readonly (Error | ErrorGroup)[]): ErrorGroup => {
  // Flatten nested errors
  const extractedErrors: Error[] = [];
  for (const e of exceptions) {
    if (isErrorGroup(e)) {
      extractedErrors.push(...e.exceptions);
    } else if (isError(e)) {
      extractedErrors.push(e);
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

    // Error-specific methods (no-ops for ErrorGroup)
    addNotes(): ErrorGroup { return self; },
    from(): ErrorGroup { return self; },
  } as ErrorGroup;

  return Object.freeze(self);
};
