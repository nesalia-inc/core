/**
 * Cause type - represents domain errors (business logic failures)
 * Unlike Exceptions, Causes are expected and recoverable errors
 */
import { unit } from "./unit.js";
/**
 * Creates a Cause (domain error)
 * @param options - The cause options
 * @returns Cause<T>
 */
export const cause = (options) => Object.freeze({
    name: options.name,
    message: options.message,
    data: options.data,
});
/**
 * Creates a Cause with Unit data (no data needed)
 * @param options - The cause options without data
 * @returns Cause<Unit>
 */
export const causeUnit = (options) => cause({
    ...options,
    data: unit,
});
/**
 * Type guard to check if a value is a Cause
 * @typeParam T - The type of the cause data
 * @param value - The value to check
 * @returns true if value is Cause<T>
 */
export const isCause = (value) => {
    if (value === null || typeof value !== "object") {
        return false;
    }
    const obj = value;
    return (typeof obj.name === "string" &&
        typeof obj.message === "string" &&
        "data" in obj &&
        !("stack" in obj) // Exclude Exception
    );
};
