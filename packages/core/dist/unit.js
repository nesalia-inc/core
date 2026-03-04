/**
 * Unit type represents "no meaningful value" - like void but as an actual type.
 * Used for functions that don't return meaningful data or as default for Exception.
 */
// Branded type to ensure type safety
const UNIT_BRAND = Symbol("Unit");
/**
 * The singleton value of type Unit
 */
export const unit = Object.freeze({ [UNIT_BRAND]: UNIT_BRAND });
/**
 * Type guard to check if a value is Unit
 */
export const isUnit = (value) => value === unit;
