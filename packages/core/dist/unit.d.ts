/**
 * Unit type represents "no meaningful value" - like void but as an actual type.
 * Used for functions that don't return meaningful data or as default for Exception.
 */
declare const UNIT_BRAND: unique symbol;
/**
 * Unit type - a singleton type representing "nothing meaningful"
 */
export type Unit = Readonly<{
    readonly [UNIT_BRAND]: typeof UNIT_BRAND;
}>;
/**
 * The singleton value of type Unit
 */
export declare const unit: Unit;
/**
 * Type guard to check if a value is Unit
 */
export declare const isUnit: (value: unknown) => value is Unit;
export {};
//# sourceMappingURL=unit.d.ts.map