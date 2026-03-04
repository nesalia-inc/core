/**
 * Unit type represents "no meaningful value" - like void but as an actual type.
 * Used for functions that don't return meaningful data or as default for Exception.
 */

// Branded type to ensure type safety
declare const __unitBrand: unique symbol;

/**
 * Unit type - a singleton type representing "nothing meaningful"
 */
export type Unit = Readonly<{ readonly [__unitBrand]: unique symbol }>;

/**
 * The singleton value of type Unit
 */
export const unit: Unit = Object.freeze({} as Unit);

/**
 * Type guard to check if a value is Unit
 */
export function isUnit(value: unknown): value is Unit {
  return value === unit;
}
