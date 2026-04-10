/**
 * Represents a void value - useful for operations that don't return a meaningful value.
 * Unit is a singleton - there is only one instance of Unit.
 */
export type Unit = {
  readonly [UNIT_BRAND]: true;
};

/**
 * The singleton Unit value
 * Object.create(null, {...}) creates a pure object without prototype.
 * enumerable: false hides the property from Object.keys() and for...in loops.
 */
const UNIT_BRAND = Symbol.for("deesse.unit");

export const unit: Unit = Object.create(null, {
  [UNIT_BRAND]: { value: true, enumerable: false, writable: false, configurable: false },
}) as Unit;

/**
 * Check if a value is Unit.
 * Reference comparison first (fast path for singleton), then structural check for cross-realm.
 */
export const isUnit = (value: unknown): value is Unit =>
  value === unit ||
  (typeof value === "object" &&
    value !== null &&
    UNIT_BRAND in value);
