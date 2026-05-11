import { describe, it, expect } from "vitest";
import {
  ok,
  err,
  okAsync,
  errAsync,
  map,
  flatMap,
  mapErr,
  tapBoth,
  getOrElse,
  getOrCompute,
  unwrap,
  unwrapOr,
  unwrapOrCompute,
  orElse,
  swap,
  toNullable,
  toUndefined,
  toMaybe,
  all,
  race,
  traverse,
  allSettled,
  AsyncResult,
  error,
} from "../../src/index.js";

// Test error types
const TestError = error({ name: "TestError" });
const AnotherError = error({ name: "AnotherError" });

describe("Unified API - mapErr overloads", () => {
  it("should transform error on Err Result", () => {
    const result = err(TestError({ message: "original" }));
    const mapped = mapErr(result, (e) => AnotherError({ message: e.message }));
    expect(mapped.ok).toBe(false);
    if (!mapped.ok) {
      expect(mapped.error.name).toBe("AnotherError");
    }
  });

  it("should pass through Ok Result", () => {
    const result = ok(42);
    const mapped = mapErr(result, (e) => AnotherError({ message: e.message }));
    expect(mapped.ok).toBe(true);
    if (mapped.ok) {
      expect(mapped.value).toBe(42);
    }
  });

  it("should transform error on Err AsyncResult", async () => {
    const result = errAsync(TestError({ message: "original" }));
    const mapped = mapErr(result, (e) => AnotherError({ message: e.message }));
    const awaited = await mapped;
    expect(awaited.ok).toBe(false);
    if (!awaited.ok) {
      expect(awaited.error.name).toBe("AnotherError");
    }
  });
});

describe("Unified API - tapBoth overloads", () => {
  it("should call ok handler on Ok Result", () => {
    let calledWith: number | null = null;
    const result = tapBoth(ok(42), {
      ok: (v) => { calledWith = v; },
      err: () => {}
    });
    expect(calledWith).toBe(42);
    expect(result.ok).toBe(true);
  });

  it("should call err handler on Err Result", () => {
    let calledWith = "";
    tapBoth(err(TestError({ message: "error" })), {
      ok: () => {},
      err: (e) => { calledWith = e.name; }
    });
    expect(calledWith).toBe("TestError");
  });

  it("should call ok handler on Ok AsyncResult", async () => {
    let calledWith: number | null = null;
    // eslint-disable-next-line @typescript-eslint/await-thenable -- tapBoth returns Thenable, must await to trigger side effect
    await tapBoth(okAsync(42), {
      ok: (v) => { calledWith = v; },
      err: () => {}
    });
    expect(calledWith).toBe(42);
  });
});

describe("Unified API - getOrCompute overloads", () => {
  it("should return value on Ok Result", () => {
    const result = ok(42);
    expect(getOrCompute(result, () => 0)).toBe(42);
  });

  it("should return computed value on Err Result", () => {
    const result = err(TestError({ message: "error" }));
    expect(getOrCompute(result, () => 42)).toBe(42);
  });

  it("should return value on Ok AsyncResult", async () => {
    const result = okAsync(42);
    expect(await getOrCompute(result, () => 0)).toBe(42);
  });

  it("should return computed value on Err AsyncResult", async () => {
    const result = errAsync(TestError({ message: "error" }));
    expect(await getOrCompute(result, () => 42)).toBe(42);
  });
});

describe("Unified API - unwrap overloads", () => {
  it("should return value on Ok Result", () => {
    const result = ok(42);
    expect(unwrap(result)).toBe(42);
  });

  it("should throw on Err Result", () => {
    const error = TestError({ message: "error" });
    expect(() => unwrap(err(error))).toThrow();
  });

  it("should return value on Ok AsyncResult", async () => {
    const result = okAsync(42);
    expect(await unwrap(result)).toBe(42);
  });

  it("should throw on Err AsyncResult", async () => {
    const error = TestError({ message: "error" });
    const result = errAsync(error);
    await expect(unwrap(result)).rejects.toThrow();
  });
});

describe("Unified API - unwrapOr overloads", () => {
  it("should return value on Ok Result", () => {
    const result = ok(42);
    expect(unwrapOr(result, 0)).toBe(42);
  });

  it("should return default on Err Result", () => {
    const result = err(TestError({ message: "error" }));
    expect(unwrapOr(result, 0)).toBe(0);
  });

  it("should return value on Ok AsyncResult", async () => {
    const result = okAsync(42);
    expect(await unwrapOr(result, 0)).toBe(42);
  });

  it("should return default on Err AsyncResult", async () => {
    const result = errAsync(TestError({ message: "error" }));
    expect(await unwrapOr(result, 0)).toBe(0);
  });
});

describe("Unified API - unwrapOrCompute overloads", () => {
  it("should return value on Ok Result", () => {
    const result = ok(42);
    expect(unwrapOrCompute(result, () => 0)).toBe(42);
  });

  it("should return computed default on Err Result", () => {
    const result = err(TestError({ message: "error" }));
    expect(unwrapOrCompute(result, () => 42)).toBe(42);
  });

  it("should return value on Ok AsyncResult", async () => {
    const result = okAsync(42);
    expect(await unwrapOrCompute(result, () => 0)).toBe(42);
  });

  it("should return computed default on Err AsyncResult", async () => {
    const result = errAsync(TestError({ message: "error" }));
    expect(await unwrapOrCompute(result, () => 42)).toBe(42);
  });
});

describe("Unified API - orElse overloads", () => {
  it("should pass through Ok Result", () => {
    const result = ok(42);
    const transformed = orElse(result, () => ok(0));
    expect(transformed.ok).toBe(true);
    if (transformed.ok) {
      expect(transformed.value).toBe(42);
    }
  });

  it("should transform Err Result", () => {
    const result = err(TestError({ message: "error" }));
    const transformed = orElse(result, () => ok(0));
    expect(transformed.ok).toBe(true);
    if (transformed.ok) {
      expect(transformed.value).toBe(0);
    }
  });

  it("should pass through Ok AsyncResult", async () => {
    const result = okAsync(42);
    const transformed = orElse(result, () => okAsync(0));
    const awaited = await transformed;
    expect(awaited.ok).toBe(true);
    if (awaited.ok) {
      expect(awaited.value).toBe(42);
    }
  });

  it("should transform Err AsyncResult", async () => {
    const result = errAsync(TestError({ message: "error" }));
    const transformed = orElse(result, () => okAsync(0));
    const awaited = await transformed;
    expect(awaited.ok).toBe(true);
    if (awaited.ok) {
      expect(awaited.value).toBe(0);
    }
  });
});

describe("Unified API - swap overloads", () => {
  it("should swap Ok to Err", () => {
    const result = ok(42);
    const swapped = swap(result);
    expect(swapped.ok).toBe(false);
    if (!swapped.ok) {
      expect(swapped.error).toBe(42);
    }
  });

  it("should swap Err to Ok", () => {
    const result = err(TestError({ message: "error" }));
    const swapped = swap(result);
    expect(swapped.ok).toBe(true);
    if (swapped.ok) {
      expect(swapped.value.name).toBe("TestError");
    }
  });

  it("should swap Ok AsyncResult to Err", async () => {
    const result = okAsync(42);
    const swapped = swap(result);
    const awaited = await swapped as AsyncResult<Error, number>;
    expect(awaited.ok).toBe(false);
    if (!awaited.ok) {
      expect(awaited.error).toBe(42);
    }
  });
});

describe("Unified API - toNullable overloads", () => {
  it("should return value on Ok Result", () => {
    const result = ok(42);
    expect(toNullable(result)).toBe(42);
  });

  it("should return null on Err Result", () => {
    const result = err(TestError({ message: "error" }));
    expect(toNullable(result)).toBe(null);
  });

  it("should return value on Ok AsyncResult", async () => {
    const result = okAsync(42);
    expect(await toNullable(result)).toBe(42);
  });

  it("should return null on Err AsyncResult", async () => {
    const result = errAsync(TestError({ message: "error" }));
    expect(await toNullable(result)).toBe(null);
  });
});

describe("Unified API - toUndefined overloads", () => {
  it("should return value on Ok Result", () => {
    const result = ok(42);
    expect(toUndefined(result)).toBe(42);
  });

  it("should return undefined on Err Result", () => {
    const result = err(TestError({ message: "error" }));
    expect(toUndefined(result)).toBe(undefined);
  });

  it("should return value on Ok AsyncResult", async () => {
    const result = okAsync(42);
    expect(await toUndefined(result)).toBe(42);
  });

  it("should return undefined on Err AsyncResult", async () => {
    const result = errAsync(TestError({ message: "error" }));
    expect(await toUndefined(result)).toBe(undefined);
  });
});

describe("Unified API - toMaybe overloads", () => {
  it("should convert Ok Result to Some", () => {
    const result = ok(42);
    const maybe = toMaybe(result);
    expect(maybe.ok).toBe(true);
    if (maybe.ok) {
      expect(maybe.value).toBe(42);
    }
  });

  it("should convert Err Result to None", () => {
    const result = err(TestError({ message: "error" }));
    const maybe = toMaybe(result);
    expect(maybe.ok).toBe(false);
  });

  it("should convert Ok AsyncResult to Some", async () => {
    const result = okAsync(42);
    const maybe = await toMaybe(result);
    expect(maybe.ok).toBe(true);
    if (maybe.ok) {
      expect(maybe.value).toBe(42);
    }
  });

  it("should convert Err AsyncResult to None", async () => {
    const result = errAsync(TestError({ message: "error" }));
    const maybe = await toMaybe(result);
    expect(maybe.ok).toBe(false);
  });
});

describe("Unified API - all overloads", () => {
  it("should combine multiple Ok Results", () => {
    const result = all(ok(1), ok(2), ok(3));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([1, 2, 3]);
    }
  });

  it("should return first Err", () => {
    const result = all(ok(1), err(TestError({ message: "error" })), ok(3));
    expect(result.ok).toBe(false);
  });

  it("should combine multiple Ok AsyncResults", async () => {
    const result = all(okAsync(1), okAsync(2), okAsync(3));
    const awaited = await result;
    expect(awaited.ok).toBe(true);
    if (awaited.ok) {
      expect(awaited.value).toEqual([1, 2, 3]);
    }
  });
});

describe("Unified API - race overloads", () => {
  it("should return first AsyncResult to resolve", async () => {
    const slow = okAsync(1);
    const fast = okAsync(2);
    expect(await race(fast, slow)).toBe(2);
  });
});

describe("Unified API - traverse overloads", () => {
  it("should traverse Result array", () => {
    const double = (n: number) => ok(n * 2);
    const result = traverse([1, 2, 3], double);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([2, 4, 6]);
    }
  });

  it("should short-circuit on Err", () => {
    const risky = (n: number) => n === 2 ? err(TestError({ message: "bad" })) : ok(n * 2);
    const result = traverse([1, 2, 3], risky);
    expect(result.ok).toBe(false);
  });

  it("should traverse AsyncResult array", async () => {
    const doubleAsync = (n: number) => okAsync(n * 2);
    const result = traverse([1, 2, 3], doubleAsync);
    const awaited = await result;
    expect(awaited.ok).toBe(true);
    if (awaited.ok) {
      expect(awaited.value).toEqual([2, 4, 6]);
    }
  });
});

describe("Unified API - allSettled overloads", () => {
  it("should return all results from AsyncResults", async () => {
    const results = allSettled(okAsync(1), okAsync(2), errAsync(TestError({ message: "error" })));
    const awaited = await results;
    expect(awaited.ok).toBe(true);
    if (awaited.ok) {
      expect(awaited.value[0]).toEqual([1, 2]);
      expect(awaited.value[1]).toHaveLength(1);
    }
  });
});

describe("pipe/flow with unified API (manual chaining)", () => {
  it("should chain operations on AsyncResult", async () => {
    const base = okAsync(2);

    // Chain using the unified functions
    const doubled = map(base, (n) => n * 2);
    const incremented = map(doubled, (n) => n + 1);
    const finalResult = await getOrElse(incremented, 0);

    expect(finalResult).toBe(5);
  });

  it("should work with Err path", async () => {
    const base = errAsync(TestError({ message: "error" }));

    const doubled = map(base, (n) => n * 2);
    const finalResult = await getOrElse(doubled, 42);

    expect(finalResult).toBe(42);
  });

  it("should chain flatMap operations", async () => {
    const base = okAsync(2);

    const chained = flatMap(base, (n) => okAsync(n * 2));
    const finalResult = await getOrElse(chained, 0);

    expect(finalResult).toBe(4);
  });

  it("should transform errors through chain", async () => {
    const base = errAsync(TestError({ message: "original" }));

    const mapped = mapErr(base, (e) => AnotherError({ message: e.message }));
    const finalResult = await toMaybe(mapped);

    expect(finalResult.ok).toBe(false);
  });
});

describe("Integration with retry", () => {
  it("should work with retry result", async () => {
    const { retryAsyncPolicy, retryPolicy } = await import("../../src/retry.js");

    let attempts = 0;
    const flakyOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw TestError({ message: "retry" });
      }
      return 42;
    };

    const policy = retryPolicy({ maxAttempts: 5 });
    const result = await retryAsyncPolicy(policy, flakyOperation);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });
});

describe("Integration with repeat", () => {
  it("should work with repeat result", async () => {
    const { repeat } = await import("../../src/repeat.js");

    let count = 0;
    const operation = async () => {
      count++;
      return ok(count);
    };

    const result = await repeat(operation, { count: 3 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([1, 2, 3]);
    }
  });
});

describe("Integration with timeout", () => {
  it("should work with timeout result", async () => {
    const { timeout } = await import("../../src/timeout.js");

    const operation = Promise.resolve(ok(42));
    const result = await timeout(operation, { deadline: 5000 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });
});

describe("Full pipeline - async to sync", () => {
  it("should transform AsyncResult through sync functions", async () => {
    const asyncResult = okAsync({ id: 1, name: "Alice" });

    // Extract and transform manually since pipe doesn't work with unified API directly
    const r1 = map(asyncResult, (user) => user.name);
    const r2 = map(r1, (name) => name.toUpperCase());

    // AsyncResult is thenable, so ok is undefined until resolved
    // Use getOrElse to extract the value after chaining
    const finalResult = await getOrElse(r2, "");
    expect(finalResult).toBe("ALICE");
  });

  it("should handle error path through pipeline", async () => {
    const asyncResult = errAsync(TestError({ message: "original" }));

    const r1 = mapErr(asyncResult, (e) => AnotherError({ message: e.message }));
    const finalResult = await toMaybe(r1);

    expect(finalResult.ok).toBe(false);
  });
});
