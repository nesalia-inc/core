import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { pipe, flow, pipeAsync, flowAsync, tap, tapAsync, tapSafe, reduce } from "../../src/pipe.js";
import { ok, err } from "../../src/result/index.js";
import { some, none } from "../../src/maybe/index.js";

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

describe("reduce", () => {
  it("should reduce array to single value", () => {
    const sum = reduce(0, (acc: number, n: number) => acc + n);
    const result = pipe([1, 2, 3, 4, 5], sum);
    expect(result).toBe(15);
  });

  it("should work with initial value", () => {
    const sum = reduce(10, (acc: number, n: number) => acc + n);
    const result = pipe([1, 2, 3], sum);
    expect(result).toBe(16);
  });

  it("should receive index parameter", () => {
    const withIndex = reduce([] as number[], (acc: number[], n: number, i: number) => {
      acc.push(n + i);
      return acc;
    });
    const result = pipe([10, 20, 30], withIndex);
    expect(result).toEqual([10, 21, 32]);
  });

  it("should work with objects", () => {
    const toObject = reduce({} as Record<string, number>, (acc: Record<string, number>, val: string) => ({
      ...acc,
      [val]: (acc[val] ?? 0) + 1
    }));
    const result = pipe(["a", "b", "a"], toObject);
    expect(result).toEqual({ a: 2, b: 1 });
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

  it("should return first argument when no functions provided", async () => {
    const identity = flowAsync();
    const result = await identity(42);
    expect(result).toBe(42);
  });
});

// Helper
function fetchLike(): Promise<number> {
  return Promise.resolve(1);
}

// ============================================================================
// DUAL
// ============================================================================

import { dual } from "../../src/pipe.js";

describe("dual", () => {
  it("should work in data-first style", () => {
    const addOne = dual(2, (x: number, fn: (x: number) => number) => fn(x + 1));

    const result = addOne(5, x => x * 2);
    expect(result).toBe(12);
  });

  it("should work in data-last style", () => {
    const addOne = dual(2, (x: number, fn: (x: number) => number) => fn(x + 1));

    const result = addOne(x => x * 2)(5);
    expect(result).toBe(12);
  });

  it("should work with Result.map", () => {
    const result = ok(5);
    const double = (x: number) => x * 2;
    const curriedDouble = dual(2, (r: typeof result, fn: typeof double) => r.map(fn));

    // Data-first
    const first = curriedDouble(result, double);
    // Data-last
    const last = curriedDouble(double)(result);

    expect(first.value).toBe(10);
    expect(last.value).toBe(10);
  });
});

// ============================================================================
// DEBOUNCE
// ============================================================================

import { debounce } from "../../src/pipe.js";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should delay execution until after wait period", () => {
    let callCount = 0;
    const fn = vi.fn(() => { callCount++; });
    const debouncedFn = debounce(fn, { wait: 100 });

    debouncedFn();
    expect(callCount).toBe(0);

    vi.advanceTimersByTime(50);
    expect(callCount).toBe(0);

    vi.advanceTimersByTime(51);
    expect(callCount).toBe(1);
  });

  it("should reset timer on subsequent calls", () => {
    let callCount = 0;
    const fn = vi.fn(() => { callCount++; });
    const debouncedFn = debounce(fn, { wait: 100 });

    debouncedFn();
    vi.advanceTimersByTime(50);
    debouncedFn(); // Reset timer
    vi.advanceTimersByTime(50);
    expect(callCount).toBe(0);

    vi.advanceTimersByTime(51);
    expect(callCount).toBe(1);
  });

  it("should execute on leading edge when leading=true", () => {
    let callCount = 0;
    const fn = vi.fn(() => { callCount++; });
    const debouncedFn = debounce(fn, { wait: 100, leading: true });

    debouncedFn();
    expect(callCount).toBe(1);

    vi.advanceTimersByTime(50);
    debouncedFn();
    expect(callCount).toBe(2);
  });

  it("should not execute trailing call after leading execution", () => {
    // When leading=true, each call executes immediately (leading edge).
    // Trailing calls never fire regardless of wait period.
    let callCount = 0;
    const fn = vi.fn(() => { callCount++; });
    const debouncedFn = debounce(fn, { wait: 100, leading: true });

    debouncedFn(); // Leading: executes immediately
    expect(callCount).toBe(1);

    vi.advanceTimersByTime(50);
    debouncedFn(); // Also executes immediately (leading edge)
    expect(callCount).toBe(2);

    vi.advanceTimersByTime(100);
    expect(callCount).toBe(2); // No trailing executions
  });

  it("should cancel pending execution", () => {
    let callCount = 0;
    const fn = vi.fn(() => { callCount++; });
    const debouncedFn = debounce(fn, { wait: 100 });

    debouncedFn();
    debouncedFn.cancel();

    vi.advanceTimersByTime(200);
    expect(callCount).toBe(0);
  });
});

// ============================================================================
// THROTTLE
// ============================================================================

import { throttle } from "../../src/pipe.js";

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should execute at most once per interval", () => {
    let callCount = 0;
    const fn = vi.fn(() => { callCount++; });
    const throttledFn = throttle(fn, { interval: 100 });

    throttledFn();
    expect(callCount).toBe(1);

    throttledFn();
    expect(callCount).toBe(1); // Throttled

    vi.advanceTimersByTime(100);
    throttledFn();
    expect(callCount).toBe(2);
  });

  it("should execute pending call when interval passes", () => {
    // Test the branch where setTimeout fires and pendingArgs is not null
    let callCount = 0;
    const fn = vi.fn(() => { callCount++; });
    const throttledFn = throttle(fn, { interval: 100 });

    throttledFn(); // Executes immediately - callCount = 1
    expect(callCount).toBe(1);

    vi.advanceTimersByTime(50);
    throttledFn(); // Schedules pending execution (timeSinceLastExecution = 50 < 100)
    expect(callCount).toBe(1); // Not executed yet

    vi.advanceTimersByTime(60); // Total 110ms, interval passed, setTimeout fires
    expect(callCount).toBe(2); // Pending call executed
  });

  it("should cancel pending throttle", () => {
    let callCount = 0;
    const fn = vi.fn(() => { callCount++; });
    const throttledFn = throttle(fn, { interval: 100 });

    throttledFn();
    expect(callCount).toBe(1);

    throttledFn(); // Scheduled
    throttledFn.cancel();

    vi.advanceTimersByTime(200);
    expect(callCount).toBe(1);
  });
});

// ============================================================================
// MEMOIZE
// ============================================================================

import { memoize } from "../../src/pipe.js";

describe("memoize", () => {
  it("should cache results based on arguments", () => {
    let callCount = 0;
    const fn = (x: number) => { callCount++; return x * 2; };
    const memoizedFn = memoize(fn);

    expect(memoizedFn(5)).toBe(10);
    expect(callCount).toBe(1);

    expect(memoizedFn(5)).toBe(10);
    expect(callCount).toBe(1); // Cached

    expect(memoizedFn(3)).toBe(6);
    expect(callCount).toBe(2);
  });

  it("should respect maxSize option", () => {
    let callCount = 0;
    const fn = (x: number) => { callCount++; return x * 2; };
    const memoizedFn = memoize(fn, { maxSize: 2 });

    memoizedFn(1);
    memoizedFn(2);
    expect(callCount).toBe(2);

    memoizedFn(3); // Should evict 1
    expect(callCount).toBe(3);

    memoizedFn(1); // Should recompute since evicted
    expect(callCount).toBe(4);
  });

  it("should clear cache", () => {
    let callCount = 0;
    const fn = (x: number) => { callCount++; return x * 2; };
    const memoizedFn = memoize(fn);

    memoizedFn(5);
    expect(callCount).toBe(1);

    memoizedFn.clear();
    memoizedFn(5);
    expect(callCount).toBe(2);
  });

  it("should not cache Promise results", () => {
    // When a function returns a Promise, memoize should NOT cache it
    // (to avoid issues with Promise resolution and memory leaks)
    let callCount = 0;
    const fn = (x: number) => {
      callCount++;
      return Promise.resolve(x * 2);
    };
    const memoizedFn = memoize(fn);

    const result1 = memoizedFn(5);
    const result2 = memoizedFn(5);

    // Promises are not cached, so function is called twice
    expect(callCount).toBe(2);

    // Both return Promises that resolve to the same value
    expect(result1).not.toBe(result2); // Different Promise instances (not cached)

    // But they resolve to the same value
    return Promise.all([result1, result2]).then(([v1, v2]) => {
      expect(v1).toBe(10);
      expect(v2).toBe(10);
    });
  });

  it("should evict oldest entry when cache is full", () => {
    // Tests the branch where firstKey !== undefined and cache.delete(firstKey) is called
    let callCount = 0;
    const fn = (x: number) => { callCount++; return x * 2; };
    const memoizedFn = memoize(fn, { maxSize: 3 });

    memoizedFn(1); // callCount = 1
    memoizedFn(2); // callCount = 2
    memoizedFn(3); // callCount = 3, cache full

    expect(memoizedFn.cache.size).toBe(3);

    memoizedFn(4); // Evicts 1 (oldest), callCount = 4
    expect(memoizedFn.cache.size).toBe(3);
    expect(memoizedFn.cache.has("[1]")).toBe(false); // Key is JSON array string
    expect(memoizedFn.cache.has("[2]")).toBe(true);

    // Accessing 1 again should recompute since it was evicted
    memoizedFn(1); // callCount = 5
    expect(callCount).toBe(5);
  });
});

// ============================================================================
// TAPBOTH (Result)
// ============================================================================

describe("Result.tapBoth", () => {
  it("should call ok handler on Ok result", () => {
    const result = ok(42);
    let calledWith: number | undefined;

    result.tapBoth({
      ok: (value) => { calledWith = value; },
      err: () => { /* should not be called */ }
    });

    expect(calledWith).toBe(42);
  });

  it("should call err handler on Err result", () => {
    const result = err(new Error("fail"));
    let calledWith: Error | undefined;

    result.tapBoth({
      ok: () => { /* should not be called */ },
      err: (error) => { calledWith = error; }
    });

    expect(calledWith?.message).toBe("fail");
  });

  it("should return the same Result", () => {
    const result = ok(42);
    const returned = result.tapBoth({ ok: () => {}, err: () => {} });
    expect(returned).toBe(result);
  });

  it("should work as standalone function", async () => {
    const { tapBoth } = await import("../../src/result/index.js");
    const result = ok(10);
    let okValue: number | undefined;

    tapBoth(result, {
      ok: (v) => { okValue = v; },
      err: () => {}
    });

    expect(okValue).toBe(10);
  });
});

// ============================================================================
// TAPBOTH (Maybe)
// ============================================================================

describe("Maybe.tapBoth", () => {
  it("should call some handler on Some result", () => {
    const result = some(42);
    let calledWith: number | undefined;

    result.tapBoth({
      some: (value) => { calledWith = value; },
      none: () => { /* should not be called */ }
    });

    expect(calledWith).toBe(42);
  });

  it("should call none handler on None result", () => {
    const result = none();
    let calledNone = false;

    result.tapBoth({
      some: () => { /* should not be called */ },
      none: () => { calledNone = true; }
    });

    expect(calledNone).toBe(true);
  });

  it("should return the same Maybe", () => {
    const result = some(42);
    const returned = result.tapBoth({ some: () => {}, none: () => {} });
    expect(returned).toBe(result);
  });

  it("should work as standalone function", async () => {
    const { tapBoth } = await import("../../src/maybe/index.js");
    const result = some(10);
    let someValue: number | undefined;

    tapBoth(result, {
      some: (v) => { someValue = v; },
      none: () => {}
    });

    expect(someValue).toBe(10);
  });
});
