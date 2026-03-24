/**
 * Represents a void value - useful for operations that don't return a meaningful value.
 * Unit is a singleton - there is only one instance of Unit.
 */
export type Unit = object & { readonly __unit: unique symbol };

declare const __unit: unique symbol;

/**
 * The singleton Unit value
 */
export const unit: Unit = Object.assign(Object.create(null), {
  __unit,
}) as Unit;

/**
 * Check if a value is Unit
 */
export const isUnit = (value: unknown): value is Unit =>
  typeof value === "object" && value !== null && __unit in value;
