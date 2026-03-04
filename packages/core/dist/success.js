/**
 * Success type - represents a successful result with a value
 */
import { unit } from "./unit.js";
/**
 * Creates a Success type
 * @param value - The success value
 * @returns Success<T>
 */
export const success = (value) => Object.freeze({
    ok: true,
    value,
});
/**
 * Creates a Success with Unit value (no meaningful return)
 * @returns Success<Unit>
 */
export const successUnit = () => success(unit);
/**
 * Type guard to check if a result is Success
 * @typeParam T - The type of the success value
 * @param result - The result to check
 * @returns true if result is Success<T>
 */
export const isSuccess = (result) => result.ok === true;
