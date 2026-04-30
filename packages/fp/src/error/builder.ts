/**
 * Error builder factory
 *
 * Creates Error<T> instances with Zod validation, enrichment, and chaining.
 * Inspired by Python's exception classes.
 */

import { type ErrorOptions, type ErrorBuilder, type Error, type ErrorGroup } from "./types.js";
import { isError, isErrorGroup } from "./guards.js";
import { some, none, type Maybe } from "../maybe/index.js";

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
  // If it's a plain Error (the library's Error type), return it wrapped in Some
  if (isError(input as Error)) {
    return some(input as Error);
  }

  // Helper to check if value is an object
  const isObject = (val: unknown): val is Record<string, unknown> =>
    val !== null && typeof val === "object";

  // If not an object, can't be a Maybe type
  if (!isObject(input)) {
    return none();
  }

  // It's a Maybe type
  if (input.ok === true) {
    // Some<Error> - has ok: true and value property
    const value = (input as { value: unknown }).value;
    return isError(value as Error) ? some(value as Error) : none();
  }

  // ok === false - could be Err<Error> or None
  // Check if it's Err<Error> - has ok: false and error property
  if ("error" in input) {
    const error = (input as unknown as { error: unknown }).error;
    return isError(error as Error) ? some(error as Error) : none();
  }

  // It's None - ok: false with no error property
  return none();
};

/**
 * List of field names that are considered sensitive and should be redacted
 * from error messages to prevent accidental credential exposure.
 */
const SENSITIVE_FIELD_NAMES = [
  'password',
  'passwd',
  'secret',
  'token',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'apikey',
  'api_key',
  'apikey',
  'privatekey',
  'private_key',
  'credential',
  'auth',
  'authorization',
  'bearertoken',
  'bearer',
];

/**
 * Checks if a field name is sensitive (case-insensitive check)
 */
const isSensitiveField = (fieldName: string): boolean => {
  const lowerFieldName = fieldName.toLowerCase();
  return SENSITIVE_FIELD_NAMES.some(sensitive =>
    lowerFieldName.includes(sensitive)
  );
};

/**
 * Redacts sensitive fields from an object for safe logging
 */
const redactSensitive = <T extends Record<string, unknown>>(obj: T): T => {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      // eslint-disable-next-line security/detect-object-injection -- Safe: key is from Object.entries, assigning to local object
      redacted[key] = '[REDACTED]';
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively redact nested objects
      // eslint-disable-next-line security/detect-object-injection -- Safe: key is from Object.entries, assigning to local object
      redacted[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      // eslint-disable-next-line security/detect-object-injection -- Safe: key is from Object.entries, assigning to local object
      redacted[key] = value;
    }
  }

  return redacted as T;
};

/**
 * Creates an Error type builder with optional Zod validation
 */
export const error = <T>(options: ErrorOptions<T>): ErrorBuilder<T> => {
  const { name, schema, message: messageFn } = options;

  return (args?: T): Error<T> => {
    // If no schema provided, skip validation and use args directly
    if (!schema) {
      // Redact sensitive fields to prevent credential leakage in error messages
      const safeArgs = args ? redactSensitive(args as Record<string, unknown>) : args;
      const customMessage = messageFn ? messageFn(args as T) : `${name}: ${JSON.stringify(safeArgs)}`;
      return createErrorObject<T>(
        name, args as T,
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
        name, args as T,
        Object.freeze([validationMessage]),
        none(),
        validationMessage,
        captureStack(),
        true // isValidationError
      );
    }

    // Valid args - create normal error
    // Redact sensitive fields to prevent credential leakage in error messages
    const safeData = redactSensitive(parsed.data as Record<string, unknown>);
    const customMessage = messageFn ? messageFn(args as T) : `${name}: ${JSON.stringify(safeData)}`;
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
