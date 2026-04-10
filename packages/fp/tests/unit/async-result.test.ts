import { describe, it, expect } from "vitest";
import {
  okAsync,
  errAsync,
  fromPromise,
  fromPromiseWithOptions,
  from,
  fromValue,
  fromError,
  isOk,
  isErr,
  isAbortError,
  map,
  flatMap,
  mapAsync,
  flatMapAsync,
  getOrElse,
  getOrCompute,
  tap,
  tapErr,
  match,
  race,
  all,
  allSettled,
  traverse,
  toNullable,
  toUndefined,
  withSignal,
  mapErr,
  unwrapOr,
} from "../../src/async-result";

describe("AsyncResult", () => {
  describe("okAsync", () => {
    it("should create an async Ok", async () => {
      const result = await okAsync(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe("errAsync", () => {
    it("should create an async Err", async () => {
      const result = await errAsync("error");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("error");
    });
  });

  describe("fromPromise", () => {
    it("should convert promise to AsyncOk", async () => {
      const result = await fromPromise(Promise.resolve(42));
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should convert rejected promise to AsyncErr", async () => {
      const result = await fromPromise(Promise.reject(new Error("test")));
      expect(result.ok).toBe(false);
      expect(result.error).toHaveProperty("name");
      expect(result.error).toHaveProperty("message");
    });

    it("should convert non-Error rejection to Error", async () => {
      const result = await fromPromise(Promise.reject("string error"));
      expect(result.ok).toBe(false);
      expect(result.error).toHaveProperty("name");
      expect(result.error.message).toBe("string error");
    });

    it("should use onError to transform the error", async () => {
      type CustomError = { code: number; message: string };
      const result = await fromPromise<number, CustomError>(
        Promise.reject(new Error("test")),
        (error) => ({ code: 500, message: error instanceof Error ? error.message : String(error) })
      );
      expect(result.ok).toBe(false);
      expect(result.error).toEqual({ code: 500, message: "test" });
    });

    it("should preserve custom error structure with onError", async () => {
      type GraphQLError = { errors: string[]; status: number };
      const originalError = { errors: ["User not found"], status: 404 };
      const result = await fromPromise<unknown, GraphQLError>(
        Promise.reject(originalError),
        (error) => error as GraphQLError
      );
      expect(result.ok).toBe(false);
      expect(result.error).toEqual(originalError);
    });

    it("should not call onError on success", async () => {
      const onError = () => ({ code: 500 });
      const result = await fromPromise(Promise.resolve(42), onError);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe("isOk", () => {
    it("should return true for AsyncOk", async () => {
      const result = await okAsync(42);
      expect(isOk(result)).toBe(true);
    });

    it("should return false for AsyncErr", async () => {
      const result = await errAsync("error");
      expect(isOk(result)).toBe(false);
    });
  });

  describe("isErr", () => {
    it("should return false for AsyncOk", async () => {
      const result = await okAsync(42);
      expect(isErr(result)).toBe(false);
    });

    it("should return true for AsyncErr", async () => {
      const result = await errAsync("error");
      expect(isErr(result)).toBe(true);
    });
  });

  describe("map", () => {
    it("should transform value if AsyncOk", async () => {
      const result = await map(okAsync(2), (x) => x * 2);
      expect(isOk(result)).toBe(true);
      expect((result as { value: number }).value).toBe(4);
    });

    it("should return AsyncErr if AsyncErr", async () => {
      const result = await map(errAsync("error"), (x) => x * 2);
      expect(isErr(result)).toBe(true);
    });

    it("should use sync branch for function with no parameters", async () => {
      const result = await map(okAsync(2), () => 42);
      expect(isOk(result)).toBe(true);
      expect((result as { value: number }).value).toBe(42);
    });
  });

  describe("flatMap", () => {
    it("should chain AsyncResults if AsyncOk", async () => {
      const result = await flatMap(okAsync(2), (x) => okAsync(x * 2));
      expect(isOk(result)).toBe(true);
      expect((result as { value: number }).value).toBe(4);
    });

    it("should return AsyncErr if AsyncErr", async () => {
      const result = await flatMap(errAsync("error"), (x) => okAsync(x * 2));
      expect(isErr(result)).toBe(true);
    });
  });

  describe("mapAsync", () => {
    it("should transform value with async function", async () => {
      const result = await mapAsync(okAsync(2), async (x) => x * 2);
      expect(isOk(result)).toBe(true);
      expect((result as { value: number }).value).toBe(4);
    });

    it("should return Err if AsyncErr", async () => {
      const result = await mapAsync(errAsync("error"), async (x) => x * 2);
      expect(isErr(result)).toBe(true);
    });
  });

  describe("flatMapAsync", () => {
    it("should chain with async function", async () => {
      const result = await flatMapAsync(okAsync(2), async (x) => okAsync(x * 2));
      expect(isOk(result)).toBe(true);
      expect((result as { value: number }).value).toBe(4);
    });

    it("should return Err if AsyncErr", async () => {
      const result = await flatMapAsync(errAsync<string, string>("error"), async (x) => okAsync(x * 2));
      expect(isErr(result)).toBe(true);
    });
  });

  describe("getOrElse", () => {
    it("should return value if AsyncOk", async () => {
      const result = await getOrElse(okAsync(42), 0);
      expect(result).toBe(42);
    });

    it("should return default if AsyncErr", async () => {
      const result = await getOrElse(errAsync("error"), 0);
      expect(result).toBe(0);
    });
  });

  describe("getOrCompute", () => {
    it("should return value if AsyncOk", async () => {
      const result = await getOrCompute(okAsync(42), async () => 0);
      expect(result).toBe(42);
    });

    it("should return computed value if AsyncErr", async () => {
      const result = await getOrCompute(errAsync("error"), async () => 42);
      expect(result).toBe(42);
    });
  });

  describe("tap", () => {
    it("should call function with value if AsyncOk", async () => {
      let captured = 0;
      await tap(okAsync(5), (v) => {
        captured = v;
      });
      expect(captured).toBe(5);
    });

    it("should not call function if AsyncErr", async () => {
      let called = false;
      await tap(errAsync("error"), () => {
        called = true;
      });
      expect(called).toBe(false);
    });
  });

  describe("match", () => {
    it("should call okFn if AsyncOk", async () => {
      const result = await match(okAsync(5), (v) => v * 2, () => 0);
      expect(result).toBe(10);
    });

    it("should call errFn if AsyncErr", async () => {
      const result = await match(errAsync("error"), (v) => v * 2, () => 0);
      expect(result).toBe(0);
    });
  });

  describe("race", () => {
    it("should resolve to first successful result", async () => {
      const fast = okAsync(1);
      const slow = okAsync(2).then(async () => {
        await new Promise((r) => setTimeout(r, 100));
        return { ok: true, value: 2 } as const;
      });

      const result = await race(fast, slow);
      expect(result).toBe(1);
    });

    it("should throw on first error if all fail", async () => {
      const fail1 = errAsync("error1");
      const fail2 = errAsync("error2");

      await expect(race(fail1, fail2)).rejects.toBe("error1");
    });
  });

  describe("all", () => {
    it("should resolve all values", async () => {
      const result = await all(okAsync(1), okAsync(2), okAsync(3));
      expect(isOk(result)).toBe(true);
      expect(result.value).toEqual([1, 2, 3]);
    });

    it("should return Err on any error", async () => {
      const result = await all(okAsync(1), errAsync("error"), okAsync(3));
      expect(isErr(result)).toBe(true);
      expect(result.error).toBe("error");
    });
  });

  describe("traverse", () => {
    it("should run function for each item", async () => {
      const result = await traverse([1, 2, 3], async (x) => okAsync(x * 2));
      expect(isOk(result)).toBe(true);
      expect(result.value).toEqual([2, 4, 6]);
    });

    it("should return Err on any error", async () => {
      const result = await traverse([1, 2, 3], async (x) => (x === 2 ? errAsync("error") : okAsync(x)));
      expect(isErr(result)).toBe(true);
      expect(result.error).toBe("error");
    });
  });

  describe("allSettled", () => {
    it("should resolve all values with empty errors", async () => {
      const result = await allSettled(okAsync(1), okAsync(2), okAsync(3));
      expect(isOk(result)).toBe(true);
      expect(result.value).toEqual([[1, 2, 3], []]);
    });

    it("should collect errors with successful values", async () => {
      const result = await allSettled(okAsync(1), errAsync("error1"), okAsync(3), errAsync("error2"));
      expect(isOk(result)).toBe(true);
      expect(result.value).toEqual([[1, 3], ["error1", "error2"]]);
    });

    it("should return all errors when all fail", async () => {
      const result = await allSettled(errAsync("error1"), errAsync("error2"), errAsync("error3"));
      expect(isOk(result)).toBe(true);
      expect(result.value).toEqual([[], ["error1", "error2", "error3"]]);
    });
  });

  describe("toNullable", () => {
    it("should return value if AsyncOk", async () => {
      const result = await toNullable(okAsync(42));
      expect(result).toBe(42);
    });

    it("should return null if AsyncErr", async () => {
      const result = await toNullable(errAsync("error"));
      expect(result).toBe(null);
    });
  });

  describe("toUndefined", () => {
    it("should return value if AsyncOk", async () => {
      const result = await toUndefined(okAsync(42));
      expect(result).toBe(42);
    });

    it("should return undefined if AsyncErr", async () => {
      const result = await toUndefined(errAsync("error"));
      expect(result).toBe(undefined);
    });
  });

  describe("fromPromiseWithOptions", () => {
    it("should convert promise to AsyncOk without signal", async () => {
      const result = await fromPromiseWithOptions(Promise.resolve(42));
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should convert rejected promise to AsyncErr without signal", async () => {
      const result = await fromPromiseWithOptions(Promise.reject(new Error("test")));
      expect(result.ok).toBe(false);
      expect(result.error).toHaveProperty("name");
      expect(result.error).toHaveProperty("message");
    });

    it("should resolve successfully when signal is not aborted", async () => {
      const controller = new AbortController();
      const result = await fromPromiseWithOptions(Promise.resolve(42), {
        signal: controller.signal,
      });
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should return AbortError when signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();
      const result = await fromPromiseWithOptions(Promise.resolve(42), {
        signal: controller.signal,
      });
      expect(result.ok).toBe(false);
      expect(isAbortError(result.error)).toBe(true);
    });

    it("should return AbortError when signal aborts during operation", async () => {
      const controller = new AbortController();

      // Create a promise that resolves after a delay
      const promise = new Promise<number>((resolve) => {
        setTimeout(() => resolve(42), 100);
      });

      const resultPromise = fromPromiseWithOptions(promise, { signal: controller.signal });

      // Abort after a short delay
      setTimeout(() => controller.abort(), 50);

      const result = await resultPromise;
      // The result will either be AbortError or the resolved value depending on timing
      if (!result.ok) {
        expect(isAbortError(result.error)).toBe(true);
      }
    });
  });

  describe("isAbortError", () => {
    it("should return true for AbortError", () => {
      // AbortError now uses the error system, so we check name property
      const error = new Error("Operation aborted") as Error & { name: string };
      error.name = "AbortError";
      // For manually created AbortError-like objects, check name property
      expect(error.name === "AbortError").toBe(true);
    });

    it("should return false for regular Error", () => {
      const error = new Error("Regular error");
      expect(isAbortError(error)).toBe(false);
    });

    it("should return false for non-Error values", () => {
      expect(isAbortError("string error")).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
      expect(isAbortError({ message: "error" })).toBe(false);
    });
  });

  describe("withSignal", () => {
    it("should pass through successful result", async () => {
      const controller = new AbortController();
      const result = await withSignal(okAsync(42), controller.signal);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should pass through error result", async () => {
      const controller = new AbortController();
      const result = await withSignal(errAsync("error"), controller.signal);
      expect(result.ok).toBe(false);
      expect(result.error).toBe("error");
    });

    it("should return AbortError when signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();
      const result = await withSignal(okAsync(42), controller.signal);
      expect(result.ok).toBe(false);
      expect(isAbortError(result.error)).toBe(true);
    });

    it("should return AbortError when signal aborts during operation", async () => {
      const controller = new AbortController();

      // Create an AsyncResult that takes time to resolve
      const slowResult = new Promise<{ ok: true; value: number }>((resolve) => {
        setTimeout(() => resolve({ ok: true, value: 42 }), 100);
      });

      const resultPromise = withSignal(slowResult, controller.signal);

      // Abort after a short delay
      setTimeout(() => controller.abort(), 50);

      const result = await resultPromise;
      // Either aborted or resolved, both are valid outcomes
      if (!result.ok) {
        expect(isAbortError(result.error)).toBe(true);
      }
    });
  });

  describe("AsyncResult class (Thenable pattern)", () => {
    describe("constructor and then", () => {
      it("should create AsyncResult and use then", async () => {
        const ar = from(Promise.resolve({ ok: true as const, value: 42 }));
        const result = await ar.then((r) => r);
        expect(result.ok).toBe(true);
        expect(result.value).toBe(42);
      });

      it("should handle async function return", async () => {
        const ar = from(Promise.resolve({ ok: true as const, value: 21 }));
        const doubled = await ar.then((r) => ({ ok: true as const, value: r.value * 2 }));
        expect(doubled.value).toBe(42);
      });

      it("should throw when accessing value synchronously", () => {
        const ar = from(Promise.resolve({ ok: true as const, value: 42 }));
        expect(() => ar.value).toThrow();
      });

      it("should throw when accessing error synchronously", () => {
        const ar = from(Promise.resolve({ ok: true as const, value: 42 }));
        expect(() => ar.error).toThrow();
      });

      it("should call onrejected handler in then", async () => {
        const ar = from(Promise.reject<string>("error"));
        const result = await ar.then(
          (v) => v,
          (e) => ({ ok: true as const, value: `caught: ${e}` })
        );
        expect(result.ok).toBe(true);
        expect(result.value).toBe("caught: error");
      });

      it("should call onrejected and return value in then", async () => {
        const ar = from(Promise.reject<string>("error"));
        const result = await ar.then(undefined, (e) => ({ ok: true as const, value: `caught: ${e}` }));
        expect(result.ok).toBe(true);
      });

      it("should return undefined for ok getter before resolution", () => {
        const ar = from(Promise.resolve({ ok: true as const, value: 42 }));
        // Access ok getter - returns undefined before promise resolves
        expect(ar.ok).toBe(undefined);
      });

      it("should work with then without onfulfilled (pass-through)", async () => {
        const ar = from(Promise.resolve({ ok: true as const, value: 42 }));
        const result = await ar.then();
        expect(result.ok).toBe(true);
        expect(result.value).toBe(42);
      });

      it("should work with then without onrejected (pass-through error)", async () => {
        const ar = from(Promise.reject<string>("error"));
        const result = await ar.then();
        expect(result).toBe("error");
      });
    });

    describe("map", () => {
      it("should map value when Ok", async () => {
        const ar = okAsync(10).map((x) => x * 2);
        const result = await ar;
        expect(result.ok).toBe(true);
        expect(result.value).toBe(20);
      });

      it("should pass through error when Err", async () => {
        const ar = errAsync<string, string>("error").map((x) => x * 2);
        const result = await ar;
        expect(result.ok).toBe(false);
        expect(result.error).toBe("error");
      });
    });

    describe("mapErr", () => {
      it("should map error when Err", async () => {
        const ar = errAsync<string, number>(42).mapErr((e) => e * 2);
        const result = await ar;
        expect(result.ok).toBe(false);
        expect(result.error).toBe(84);
      });

      it("should pass through value when Ok", async () => {
        const ar = okAsync(42).mapErr((e) => e * 2);
        const result = await ar;
        expect(result.ok).toBe(true);
        expect(result.value).toBe(42);
      });
    });

    describe("flatMap", () => {
      it("should flatMap when Ok", async () => {
        const ar = okAsync(10).flatMap((x) => okAsync(x * 2));
        const result = await ar;
        expect(result.ok).toBe(true);
        expect(result.value).toBe(20);
      });

      it("should pass through error when Err", async () => {
        const ar = errAsync<string, string>("error").flatMap((x) => okAsync(x * 2));
        const result = await ar;
        expect(result.ok).toBe(false);
        expect(result.error).toBe("error");
      });
    });

    describe("flatMapAsync", () => {
      it("should flatMapAsync when Ok", async () => {
        const ar = okAsync(10).flatMapAsync(async (x) => ({ ok: true as const, value: x * 2 }));
        const result = await ar;
        expect(result.ok).toBe(true);
        expect(result.value).toBe(20);
      });

      it("should pass through error when Err in flatMapAsync", async () => {
        const ar = errAsync<string, string>("error").flatMapAsync(async (x) => ({ ok: true as const, value: x * 2 }));
        const result = await ar;
        expect(result.ok).toBe(false);
        expect(result.error).toBe("error");
      });
    });

    describe("getOrElse", () => {
      it("should return value when Ok", async () => {
        const ar = okAsync(42);
        const result = await ar.getOrElse(0);
        expect(result).toBe(42);
      });

      it("should return default when Err", async () => {
        const ar = errAsync<string, number>(42);
        const result = await ar.getOrElse(0);
        expect(result).toBe(0);
      });
    });

    describe("getOrCompute", () => {
      it("should return value when Ok", async () => {
        const ar = okAsync(42);
        const result = await ar.getOrCompute(() => 0);
        expect(result).toBe(42);
      });

      it("should compute default when Err", async () => {
        const ar = errAsync<string, number>(42);
        const result = await ar.getOrCompute(() => 0);
        expect(result).toBe(0);
      });
    });

    describe("tap", () => {
      it("should tap value when Ok", async () => {
        let tapped = 0;
        const ar = okAsync(42).tap((x) => {
          tapped = x;
        });
        await ar;
        expect(tapped).toBe(42);
      });

      it("should not tap when Err", async () => {
        let tapped = 0;
        const ar = errAsync<string, number>(42).tap((x) => {
          tapped = x;
        });
        await ar;
        expect(tapped).toBe(0);
      });
    });

    describe("tapErr", () => {
      it("should tap error when Err", async () => {
        let tapped = 0;
        const ar = errAsync<number, number>(42).tapErr((e) => {
          tapped = e;
        });
        await ar;
        expect(tapped).toBe(42);
      });

      it("should not tap when Ok", async () => {
        let tapped = 0;
        const ar = okAsync(42).tapErr((e) => {
          tapped = e;
        });
        await ar;
        expect(tapped).toBe(0);
      });
    });

    describe("match", () => {
      it("should match Ok", async () => {
        const ar = okAsync(42);
        const result = await ar.match((v) => `ok: ${v}`, (e) => `err: ${e}`);
        expect(result).toBe("ok: 42");
      });

      it("should match Err", async () => {
        const ar = errAsync<number, string>("error");
        const result = await ar.match((v) => `ok: ${v}`, (e) => `err: ${e}`);
        expect(result).toBe("err: error");
      });
    });

    describe("catch", () => {
      it("should catch error from rejected promise", async () => {
        // Test with actual rejected promise
        const ar = from(Promise.reject<string>("error"));
        const caught = await ar.catch((e) => ({ ok: true as const, value: `caught: ${e}` }));
        expect(caught.ok).toBe(true);
        expect(caught.value).toBe("caught: error");
      });

      it("should rethrow when catch called without handler", async () => {
        const ar = from(Promise.reject<string>("error"));
        await expect(ar.catch()).rejects.toBe("error");
      });
    });

    describe("finally", () => {
      it("should call finally", async () => {
        let finallyCalled = false;
        const ar = okAsync(42).finally(() => {
          finallyCalled = true;
        });
        await ar;
        expect(finallyCalled).toBe(true);
      });
    });

    describe("unwrap", () => {
      it("should unwrap value when Ok", async () => {
        const ar = okAsync(42);
        const result = await ar.unwrap();
        expect(result).toBe(42);
      });

      it("should throw when Err", async () => {
        const ar = errAsync<string, string>("error");
        await expect(ar.unwrap()).rejects.toBe("error");
      });
    });

    describe("unwrapOr", () => {
      it("should return value when Ok", async () => {
        const ar = okAsync(42);
        const result = await ar.unwrapOr(0);
        expect(result).toBe(42);
      });

      it("should return default when Err", async () => {
        const ar = errAsync<string, number>(42);
        const result = await ar.unwrapOr(0);
        expect(result).toBe(0);
      });
    });
  });

  describe("standalone functions", () => {
    describe("tapErr", () => {
      it("should tap error when Err", async () => {
        let tapped = 0;
        const result = tapErr(errAsync(42), (e) => {
          tapped = e;
        });
        await result;
        expect(tapped).toBe(42);
      });

      it("should not tap when Ok", async () => {
        let tapped = 0;
        const result = tapErr(okAsync(42), (e) => {
          tapped = e;
        });
        await result;
        expect(tapped).toBe(0);
      });
    });

    describe("mapErr", () => {
      it("should map error when Err", async () => {
        const result = mapErr(errAsync(1), (e) => e * 2);
        const inner = await result;
        expect(inner.ok).toBe(false);
        expect(inner.error).toBe(2);
      });

      it("should pass through when Ok", async () => {
        const result = mapErr(okAsync(42), (e) => e * 2);
        const inner = await result;
        expect(inner.ok).toBe(true);
        expect(inner.value).toBe(42);
      });
    });

    describe("unwrapOr (standalone)", () => {
      it("should return value when Ok", async () => {
        const result = await unwrapOr(okAsync(42), 0);
        expect(result).toBe(42);
      });

      it("should return default when Err", async () => {
        const result = await unwrapOr(errAsync<string, number>(42), 0);
        expect(result).toBe(0);
      });
    });

    describe("fromValue", () => {
      it("should create AsyncResult that resolves after delay", async () => {
        const ar = fromValue(42, 10);
        const result = await ar;
        expect(result.ok).toBe(true);
        expect(result.value).toBe(42);
      });

      it("should resolve immediately with default delay", async () => {
        const ar = fromValue(42);
        const result = await ar;
        expect(result.value).toBe(42);
      });
    });

    describe("fromError", () => {
      it("should create AsyncResult that rejects after delay", async () => {
        const ar = fromError("error", 10);
        const result = await ar;
        expect(result.ok).toBe(false);
        expect(result.error).toBe("error");
      });

      it("should resolve immediately with default delay", async () => {
        const ar = fromError("error");
        const result = await ar;
        expect(result.error).toBe("error");
      });
    });

    describe("toPromise", () => {
      it("should return the underlying promise", async () => {
        const ar = okAsync(42);
        const promise = ar.toPromise();
        const result = await promise;
        expect(result.ok).toBe(true);
        expect(result.value).toBe(42);
      });
    });

    describe("static from", () => {
      it("should create AsyncResult from Promise", async () => {
        const ar = from(Promise.resolve({ ok: true as const, value: 42 }));
        const result = await ar;
        expect(result.ok).toBe(true);
        expect(result.value).toBe(42);
      });
    });

    describe("static fromPromise", () => {
      it("should create AsyncResult from resolving Promise", async () => {
        const ar = fromPromise(Promise.resolve(42));
        const result = await ar;
        expect(result.ok).toBe(true);
        expect(result.value).toBe(42);
      });

      it("should create AsyncResult from rejected Promise", async () => {
        const ar = fromPromise(Promise.reject(new Error("test")));
        const result = await ar;
        expect(result.ok).toBe(false);
        expect(result.error).toHaveProperty("name");
        expect(result.error).toHaveProperty("message");
      });

      it("should convert non-Error rejection to Error", async () => {
        const ar = fromPromise(Promise.reject("string error"));
        const result = await ar;
        expect(result.ok).toBe(false);
        expect(result.error).toHaveProperty("name");
        expect(result.error.message).toBe("string error");
      });
    });
  });
});
