/**
 * Exception type - represents system errors (unexpected failures)
 * Unlike Causes, these are unexpected and typically unrecoverable
 */
import { unit } from "./unit.js";
/**
 * Creates an Exception (system error)
 * @param options - The exception options
 * @returns Exception<T>
 */
export const exception = (options) => {
    const data = options.data ?? unit;
    return Object.freeze({
        name: options.name,
        message: options.message,
        data: data,
        stack: options.stack ?? new Error().stack,
    });
};
/**
 * Creates an Exception with current stack trace
 * @param options - The exception options (stack will be auto-generated)
 * @returns Exception<T>
 */
export const exceptionWithStack = (options) => exception({
    ...options,
    stack: new Error().stack,
});
/**
 * Creates an Exception with Unit data
 * @param options - The exception options without data
 * @returns Exception<Unit>
 */
export const exceptionUnit = (options) => exception({
    name: options.name,
    message: options.message,
    data: unit,
    stack: options.stack,
});
/**
 * Type guard to check if a value is an Exception
 * @typeParam T - The type of the exception data
 * @param value - The value to check
 * @returns true if value is Exception<T>
 */
export const isException = (value) => {
    if (value === null || typeof value !== "object") {
        return false;
    }
    const obj = value;
    return (typeof obj.name === "string" &&
        typeof obj.message === "string" &&
        "data" in obj &&
        "stack" in obj);
};
