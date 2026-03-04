/**
 * Exception type - represents system errors (unexpected failures)
 * Unlike Causes, these are unexpected and typically unrecoverable
 */
import { Unit } from "./unit.js";
/**
 * Exception data structure
 * @typeParam T - The type of the exception data
 */
export type Exception<T = Unit> = {
    readonly name: string;
    readonly message: string;
    readonly data: T;
    readonly stack?: string;
};
/**
 * Exception options for creating an Exception
 * @typeParam T - The type of the exception data
 */
export type ExceptionOptions<T = Unit> = {
    readonly name: string;
    readonly message: string;
    readonly data?: T;
    readonly stack?: string;
};
/**
 * Creates an Exception (system error)
 * @param options - The exception options
 * @returns Exception<T>
 */
export declare const exception: <T = Unit>(options: ExceptionOptions<T>) => Exception<T>;
/**
 * Creates an Exception with current stack trace
 * @param options - The exception options (stack will be auto-generated)
 * @returns Exception<T>
 */
export declare const exceptionWithStack: <T = Unit>(options: Omit<ExceptionOptions<T>, "stack">) => Exception<T>;
/**
 * Creates an Exception with Unit data
 * @param options - The exception options without data
 * @returns Exception<Unit>
 */
export declare const exceptionUnit: (options: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
}) => Exception<Unit>;
/**
 * Type guard to check if a value is an Exception
 * @typeParam T - The type of the exception data
 * @param value - The value to check
 * @returns true if value is Exception<T>
 */
export declare const isException: <T = Unit>(value: unknown) => value is Exception<T>;
//# sourceMappingURL=exception.d.ts.map