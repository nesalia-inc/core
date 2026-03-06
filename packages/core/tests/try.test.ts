import { describe, it, expect } from "vitest";
import {
  attempt,
  attemptAsync,
  isOk,
  isErr,
  map,
  flatMap,
  getOrElse,
  getOrCompute,
  tap,
  match,
  toNullable,
  toUndefined,
  Try,
} from "../src/try";

describe("Try", () => {
  describe("attempt", () => {
    it("should return success with value", () => {
      const result = attempt(() => 42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should return failure with Error on throw", () => {
      const result = attempt(() => {
        throw new Error("test error");
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("test error");
    });

    it("should wrap non-Error throws", () => {
      const result = attempt(() => {
        throw "string error";
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("string error");
    });
  });

  describe("attemptAsync", () => {
    it("should return success with value", async () => {
      const result = await attemptAsync(async () => 42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should return failure with Error on throw", async () => {
      const result = await attemptAsync(async () => {
        throw new Error("async error");
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("async error");
    });

    it("should wrap rejected promise", async () => {
      const result = await attemptAsync(async () => {
        throw "rejected";
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe("isOk", () => {
    it("should return true for success", () => {
      const result = attempt(() => 42);
      expect(isOk(result)).toBe(true);
    });

    it("should return false for failure", () => {
      const result = attempt(() => {
        throw new Error();
      });
      expect(isOk(result)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const value: Try<number> = attempt(() => 42);
      if (isOk(value)) {
        expect(value.value).toBe(42);
      }
    });
  });

  describe("isErr", () => {
    it("should return false for success", () => {
      const result = attempt(() => 42);
      expect(isErr(result)).toBe(false);
    });

    it("should return true for failure", () => {
      const result = attempt(() => {
        throw new Error();
      });
      expect(isErr(result)).toBe(true);
    });
  });

  describe("map", () => {
    it("should transform value if success", () => {
      const result = map(attempt(() => 2), (x) => x * 2);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(4);
      }
    });

    it("should return failure if failure", () => {
      const result = map(
        attempt(() => {
          throw new Error("error");
        }),
        (x) => x * 2
      );
      expect(isErr(result)).toBe(true);
    });
  });

  describe("flatMap", () => {
    it("should chain Tries if success", () => {
      const result = flatMap(attempt(() => 2), (x) => attempt(() => x * 2));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(4);
      }
    });

    it("should return failure if failure", () => {
      const result = flatMap(
        attempt(() => {
          throw new Error("error");
        }),
        (x) => attempt(() => x * 2)
      );
      expect(isErr(result)).toBe(true);
    });
  });

  describe("getOrElse", () => {
    it("should return value if success", () => {
      const result = getOrElse(attempt(() => 42), 0);
      expect(result).toBe(42);
    });

    it("should return default if failure", () => {
      const result = getOrElse(
        attempt(() => {
          throw new Error();
        }),
        0
      );
      expect(result).toBe(0);
    });
  });

  describe("getOrCompute", () => {
    it("should return value if success", () => {
      const result = getOrCompute(attempt(() => 42), () => 0);
      expect(result).toBe(42);
    });

    it("should return computed value if failure", () => {
      const result = getOrCompute(
        attempt(() => {
          throw new Error();
        }),
        () => 42
      );
      expect(result).toBe(42);
    });
  });

  describe("tap", () => {
    it("should call function with value if success", () => {
      let captured = 0;
      tap(attempt(() => 5), (v) => {
        captured = v;
      });
      expect(captured).toBe(5);
    });

    it("should not call function if failure", () => {
      let called = false;
      tap(
        attempt(() => {
          throw new Error();
        }),
        () => {
          called = true;
        }
      );
      expect(called).toBe(false);
    });
  });

  describe("match", () => {
    it("should call okFn if success", () => {
      const result = match(attempt(() => 5), (v) => v * 2, () => 0);
      expect(result).toBe(10);
    });

    it("should call errFn if failure", () => {
      const result = match(
        attempt(() => {
          throw new Error();
        }),
        (v) => v * 2,
        () => 0
      );
      expect(result).toBe(0);
    });
  });

  describe("toNullable", () => {
    it("should return value if success", () => {
      const result = toNullable(attempt(() => 42));
      expect(result).toBe(42);
    });

    it("should return null if failure", () => {
      const result = toNullable(
        attempt(() => {
          throw new Error();
        })
      );
      expect(result).toBe(null);
    });
  });

  describe("toUndefined", () => {
    it("should return value if success", () => {
      const result = toUndefined(attempt(() => 42));
      expect(result).toBe(42);
    });

    it("should return undefined if failure", () => {
      const result = toUndefined(
        attempt(() => {
          throw new Error();
        })
      );
      expect(result).toBe(undefined);
    });
  });
});
