import { describe, it, expect } from "vitest";
import {
  okAsync,
  errAsync,
  fromPromise,
  isOk,
  isErr,
  map,
  flatMap,
  mapAsync,
  flatMapAsync,
  getOrElse,
  getOrCompute,
  tap,
  match,
  race,
  all,
  traverse,
  toNullable,
  toUndefined,
} from "../src/async-result";

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
      expect(result.error).toBeInstanceOf(Error);
    });

    it("should convert non-Error rejection to Error", async () => {
      const result = await fromPromise(Promise.reject("string error"));
      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("string error");
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
      const results = await all(okAsync(1), okAsync(2), okAsync(3));
      expect(results).toEqual([1, 2, 3]);
    });

    it("should reject on any error", async () => {
      await expect(
        all(okAsync(1), errAsync("error"), okAsync(3))
      ).rejects.toBe("error");
    });
  });

  describe("traverse", () => {
    it("should run function for each item", async () => {
      const result = await traverse([1, 2, 3], async (x) => okAsync(x * 2));
      expect(result).toEqual([2, 4, 6]);
    });

    it("should reject on any error", async () => {
      await expect(
        traverse([1, 2, 3], async (x) => (x === 2 ? errAsync("error") : okAsync(x)))
      ).rejects.toBe("error");
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
});
