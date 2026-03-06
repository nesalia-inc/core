/**
 * Conversion helpers - convert between Result, Outcome, Maybe and other types
 */

import { ok, err, Result, isOk } from "./result.js";
import { some, none, Maybe, isSome } from "./maybe.js";
import { success, cause, Outcome } from "./outcome.js";

/**
 * Options for converting Maybe to Result
 */
export interface ToResultOptions<E> {
  /** Error to use when Maybe is None */
  onNone: () => E;
}

/**
 * Converts Maybe to Result
 * @param maybe - The Maybe to convert
 * @param onNone - Error to use when Maybe is None
 * @returns Result<T, E>
 */
export const toResult = <T, E>(maybe: Maybe<T>, onNone: () => E): Result<T, E> =>
  isSome(maybe) ? ok(maybe.value) : err(onNone());

/**
 * Converts Maybe to Outcome
 * @param maybe - The Maybe to convert
 * @param options - Options for the Cause when None
 * @returns Outcome<T, CauseData, never>
 */
export const toOutcome = <T, CauseData = unknown>(
  maybe: Maybe<T>,
  options?: { name?: string; message?: string; data?: CauseData }
): Outcome<T, CauseData, never> => {
  if (isSome(maybe)) {
    return success(maybe.value);
  }
  const { name = "NONE", message = "Value is none", data } = options ?? {};
  return cause({ name, message, data: data as CauseData });
};

/**
 * Converts Result to Outcome
 * @param result - The Result to convert
 * @returns Outcome<T, E, never>
 */
export const toOutcomeFromResult = <T, E>(result: Result<T, E>): Outcome<T, E, never> =>
  isOk(result) ? success(result.value) : cause({ name: "ERROR", message: String(result.error), data: result.error as E });

/**
 * Converts Outcome to Result
 * @param outcome - The Outcome to convert
 * @returns Result<T, C | E>
 */
export const toResultFromOutcome = <T, C, E>(outcome: Outcome<T, C, E>): Result<T, C | E> => {
  const o = outcome as { ok: boolean } & ({ value?: unknown } | { error: unknown });
  if (o.ok === true && "value" in o) {
    return ok(o.value as T);
  }
  if (!o.ok && "error" in o) {
    return err(o.error as C | E);
  }
  // Fallback - should not happen
  return err(o as C | E);
};

/**
 * Converts Result to Maybe
 * @param result - The Result to convert
 * @returns Maybe<T> (loses error info)
 */
export const toMaybeFromResult = <T, E>(result: Result<T, E>): Maybe<T> =>
  isOk(result) ? some(result.value) : none();

/**
 * Converts Outcome to Maybe
 * @param outcome - The Outcome to convert
 * @returns Maybe<T> (loses error info)
 */
export const toMaybeFromOutcome = <T, C, E>(outcome: Outcome<T, C, E>): Maybe<T> => {
  const o = outcome as { ok: boolean } & ({ value?: unknown });
  if (o.ok === true && "value" in o) {
    return some(o.value as T);
  }
  return none();
};

/**
 * Converts undefined to None, otherwise to Some
 * @param value - The value to convert
 * @returns Maybe<T>
 */
export const fromUndefinedable = <T>(value: T | undefined): Maybe<T> =>
  value === undefined ? none() : some(value);

/**
 * Default options for converting Outcome to Result
 */
export interface ToResultFromOutcomeOptions {
  /** Whether to include Exception in error (default: true) */
  includeException?: boolean;
}

/**
 * Converts Outcome to Result with options
 * @param outcome - The Outcome to convert
 * @param options - Options
 * @returns Result<T, C | E>
 */
export const toResultFromOutcome_ = <T, C, E>(
  outcome: Outcome<T, C, E>,
  _options: ToResultFromOutcomeOptions = {}
): Result<T, C | E> => {
  const o = outcome as { ok: boolean } & ({ value?: unknown } | { error: unknown });

  if (o.ok === true && "value" in o) {
    return ok(o.value as T);
  }

  if (!o.ok && "error" in o) {
    return err(o.error as C | E);
  }

  // Fallback - should not happen
  return err(o as C | E);
};
