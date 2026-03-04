/**
 * Success type - represents a successful result with a value
 */
import { Unit } from "./unit.js";
/**
 * Success type representing a successful operation with a value
 * @typeParam T - The type of the success value
 */
export type Success<T> = {
    readonly ok: true;
    readonly value: T;
};
/**
 * Creates a Success type
 * @param value - The success value
 * @returns Success<T>
 */
export declare const success: <T>(value: T) => Success<T>;
/**
 * Creates a Success with Unit value (no meaningful return)
 * @returns Success<Unit>
 */
export declare const successUnit: () => Success<Unit>;
/**
 * Type guard to check if a result is Success
 * @typeParam T - The type of the success value
 * @param result - The result to check
 * @returns true if result is Success<T>
 */
export declare const isSuccess: <T, C, E>(result: {
    ok: boolean;
} & (C | E | {
    value?: T;
})) => result is Success<T>;
//# sourceMappingURL=success.d.ts.map