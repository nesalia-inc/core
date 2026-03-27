import { describe, it, expect } from "vitest";
import { pipe, flow } from "../src/pipe";

describe("pipe", () => {
  it("should pipe a value through a single function", () => {
    const result = pipe(1, (x: number) => x + 1);
    expect(result).toBe(2);
  });

  it("should pipe a value through two functions", () => {
    const result = pipe(1, (x: number) => x + 1, (x: number) => x * 2);
    expect(result).toBe(4);
  });

  it("should pipe a value through three functions", () => {
    const result = pipe(
      "hello",
      (s: string) => s.toUpperCase(),
      (s: string) => s + "!",
      (s: string) => s.length
    );
    expect(result).toBe(6);
  });

  it("should pipe a value through four functions", () => {
    const result = pipe(
      2,
      (x: number) => x + 1,
      (x: number) => x * 2,
      (x: number) => x - 1,
      (x: number) => x.toString()
    );
    expect(result).toBe("5");
  });

  it("should return value unchanged with no functions", () => {
    const result = pipe(42);
    expect(result).toBe(42);
  });

  it("should work with objects", () => {
    const result = pipe(
      { name: "test" },
      (o: { name: string }) => o.name,
      (s: string) => s.toUpperCase()
    );
    expect(result).toBe("TEST");
  });
});

describe("flow", () => {
  it("should create a reusable function with one transform", () => {
    const double = flow((x: number) => x * 2);
    expect(double(5)).toBe(10);
    expect(double(3)).toBe(6);
  });

  it("should create a reusable function with two transforms", () => {
    const processString = flow(
      (s: string) => s.toUpperCase(),
      (s: string) => s + "!"
    );
    expect(processString("hello")).toBe("HELLO!");
    expect(processString("world")).toBe("WORLD!");
  });

  it("should create a reusable function with three transforms", () => {
    const process = flow(
      (x: number) => x + 1,
      (x: number) => x * 2,
      (x: number) => x.toString()
    );
    expect(process(5)).toBe("12");
  });

  it("should accept multiple arguments in first function", () => {
    const addAndStringify = flow(
      (a: number, b: number) => a + b,
      (sum: number) => sum.toString()
    );
    expect(addAndStringify(5, 10)).toBe("15");
    expect(addAndStringify(2, 3)).toBe("5");
  });

  it("should accept three arguments in first function", () => {
    const sumThree = flow(
      (a: number, b: number, c: number) => a + b + c,
      (sum: number) => sum * 2
    );
    expect(sumThree(1, 2, 3)).toBe(12);
  });

  it("should return first argument when no functions provided", () => {
    const identity = flow();
    expect(identity(42)).toBe(42);
    expect(identity("hello")).toBe("hello");
  });
});
