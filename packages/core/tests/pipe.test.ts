import { describe, it, expect } from "vitest";
import { pipe, flow, pipeAsync, flowAsync, tap, tapAsync, tapSafe } from "../src/pipe";

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

describe("tap", () => {
  it("should execute side effect and return original value", () => {
    let logged: string | undefined;
    const log = tap((x: string) => { logged = x; });

    const result = log("hello");

    expect(logged).toBe("hello");
    expect(result).toBe("hello");
  });

  it("should work in a pipe", () => {
    let logged: number | undefined;
    const result = pipe(
      42,
      tap(x => { logged = x; }),
      x => x * 2
    );

    expect(logged).toBe(42);
    expect(result).toBe(84);
  });
});

describe("tapAsync", () => {
  it("should execute async side effect and return original value", async () => {
    let logged: string | undefined;
    const logAsync = tapAsync(async (x: string) => { logged = x; });

    const result = await logAsync("hello");

    expect(logged).toBe("hello");
    expect(result).toBe("hello");
  });

  it("should work in pipeAsync", async () => {
    let logged: number | undefined;
    const result = await pipeAsync(
      Promise.resolve(42),
      tapAsync(async x => { logged = x; }),
      async x => x * 2
    );

    expect(logged).toBe(42);
    expect(result).toBe(84);
  });
});

describe("tapSafe", () => {
  it("should execute side effect and return original value", () => {
    let logged: string | undefined;
    const log = tapSafe((x: string) => { logged = x; });

    const result = log("hello");

    expect(logged).toBe("hello");
    expect(result).toBe("hello");
  });

  it("should catch errors in side effect and continue", () => {
    let caught: unknown;
    const log = tapSafe(
      (_x: string) => { throw new Error("fail"); },
      err => { caught = err; }
    );

    const result = log("hello");

    expect(caught).toBeInstanceOf(Error);
    expect(result).toBe("hello");
  });

  it("should work in pipe without onError", () => {
    const result = pipe(
      42,
      tapSafe(() => { throw new Error("oops"); }),
      x => x * 2
    );

    expect(result).toBe(84);
  });
});

describe("pipeAsync", () => {
  it("should resolve promises at each step", async () => {
    const result = await pipeAsync(
      Promise.resolve(1),
      async (x: number) => x + 1,
      async (x: number) => x * 2
    );

    expect(result).toBe(4);
  });

  it("should handle mixed sync and async functions", async () => {
    const result = await pipeAsync(
      1,
      async (x: number) => x + 1,
      (x: number) => x * 2
    );

    expect(result).toBe(4);
  });

  it("should work with a promise value", async () => {
    const result = await pipeAsync(
      fetchLike(),
      async (x: number) => x + 1
    );

    expect(result).toBe(2);
  });

  it("should pipe through multiple async steps", async () => {
    const result = await pipeAsync(
      Promise.resolve("hello"),
      async (s: string) => s.toUpperCase(),
      async (s: string) => s + "!"
    );

    expect(result).toBe("HELLO!");
  });
});

describe("flowAsync", () => {
  it("should create an async function", async () => {
    const process = flowAsync(
      async (x: number) => x + 1,
      async (x: number) => x * 2
    );

    const result = await process(1);
    expect(result).toBe(4);
  });

  it("should handle mixed sync and async", async () => {
    const process = flowAsync(
      async (x: number) => x + 1,
      (x: number) => x * 2
    );

    const result = await process(1);
    expect(result).toBe(4);
  });

  it("should accept multiple arguments in first function", async () => {
    const addAndDouble = flowAsync(
      async (a: number, b: number) => a + b,
      async (sum: number) => sum * 2
    );

    const result = await addAndDouble(3, 7);
    expect(result).toBe(20);
  });
});

// Helper
function fetchLike(): Promise<number> {
  return Promise.resolve(1);
}
