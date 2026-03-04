/**
 * Cause type - represents domain errors (business logic failures)
 * Unlike Exceptions, Causes are expected and recoverable errors
 */
import { Unit } from "./unit.js";
/**
 * Cause data structure
 * @typeParam T - The type of the cause data
 */
export type Cause<T = unknown> = {
    readonly name: string;
    readonly message: string;
    readonly data: T;
};
/**
 * Cause options for creating a Cause
 * @typeParam T - The type of the cause data
 */
export type CauseOptions<T = unknown> = {
    readonly name: string;
    readonly message: string;
    readonly data: T;
};
/**
 * Creates a Cause (domain error)
 * @param options - The cause options
 * @returns Cause<T>
 */
export declare const cause: <T = unknown>(options: CauseOptions<T>) => Cause<T>;
/**
 * Creates a Cause with Unit data (no data needed)
 * @param options - The cause options without data
 * @returns Cause<Unit>
 */
export declare const causeUnit: (options: Omit<CauseOptions<Unit>, "data">) => Cause<Unit>;
/**
 * Type guard to check if a value is a Cause
 * @typeParam T - The type of the cause data
 * @param value - The value to check
 * @returns true if value is Cause<T>
 */
export declare const isCause: <T = unknown>(value: unknown) => value is Cause<T>;
//# sourceMappingURL=cause.d.ts.map