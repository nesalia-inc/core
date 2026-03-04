/**
 * Unit type represents "no meaningful value" - like void but as an actual type.
 * Used for functions that don't return meaningful data or as default for Exception.
 */

// Branded type to ensure type safety
const UNIT_BRAND = Symbol("Unit");

/**
 * Unit type - a singleton type representing "nothing meaningful"
 */
export type Unit = Readonly<{ readonly [UNIT_BRAND]: typeof UNIT_BRAND }>;

/**
 * The singleton value of type Unit
 */
export const unit: Unit = Object.freeze({ [UNIT_BRAND]: UNIT_BRAND } as Unit);

/**
 * Type guard to check if a value is Unit
 */
export const isUnit = (value: unknown): value is Unit =>
  value === unit;
