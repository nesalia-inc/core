/**
 * Represents a void value - useful for operations that don't return a meaningful value.
 * Unit is a singleton - there is only one instance of Unit.
 */
export type Unit = object & { readonly __unit: "unit" };

const UNIT_KEY = "__unit" as const;

/**
 * The singleton Unit value
 */
export const unit: Unit = Object.freeze({ [UNIT_KEY]: "unit" }) as Unit;

/**
 * Check if a value is Unit
 */
export const isUnit = (value: unknown): value is Unit =>
  typeof value === "object" &&
  value !== null &&
  UNIT_KEY in value &&
  (value as Record<string, unknown>)[UNIT_KEY] === "unit";
