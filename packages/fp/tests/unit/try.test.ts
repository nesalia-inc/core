import { describe, it, expect } from "vitest";
import {
  attempt,
  attemptAsync,
  isOk,
  isErr,
  map,
  flatMap,
  getOrElse,
  getOrComputeResult,
  tap,
  tapErr,
  match,
  toNullableResult,
  toUndefinedResult,
  Result,
} from "../../src/index.js";
import { error } from "../../src/error/index.js";

describe("attempt/attemptAsync (formerly Try)", () => {
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
        // eslint-disable-next-line no-throw-literal -- Testing library's ability to wrap non-Error throws
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
        // eslint-disable-next-line no-throw-literal -- Testing library's ability to wrap rejected promises
        throw "rejected";
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe("attempt with custom error handler", () => {
    it("should return success when no error", () => {
      const DatabaseError = error({ name: "DatabaseError" });
      const result = attempt(
        () => 42,
        (caught) => DatabaseError({ message: caught.message })
      );
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should transform error with custom handler", () => {
      const DatabaseError = error({ name: "DatabaseError" });
      const result = attempt(
        () => { throw new Error("connection failed"); },
        (caught) => DatabaseError({ message: caught.message })
      );
      expect(result.ok).toBe(false);
      expect(result.error.name).toBe("DatabaseError");
      expect(result.error.args.message).toBe("connection failed");
    });
  });

  describe("attemptAsync with custom error handler", () => {
    it("should return success when no error", async () => {
      const DatabaseError = error({ name: "DatabaseError" });
      const result = await attemptAsync(
        async () => 42,
        (caught) => DatabaseError({ message: caught.message })
      );
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should transform error with custom handler", async () => {
      const DatabaseError = error({ name: "DatabaseError" });
      const result = await attemptAsync(
        async () => { throw new Error("async connection failed"); },
        (caught) => DatabaseError({ message: caught.message })
      );
      expect(result.ok).toBe(false);
      expect(result.error.name).toBe("DatabaseError");
      expect(result.error.args.message).toBe("async connection failed");
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
      const value: Result<number, Error> = attempt(() => 42);
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
    it("should chain Results if success", () => {
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
      const result = getOrComputeResult(attempt(() => 42), () => 0);
      expect(result).toBe(42);
    });

    it("should return computed value if failure", () => {
      const result = getOrComputeResult(
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

  describe("tapErr", () => {
    it("should call function with error if failure", () => {
      let captured = "";
      tapErr(
        attempt(() => {
          throw new Error("test error");
        }),
        (e) => {
          captured = e.message;
        }
      );
      expect(captured).toBe("test error");
    });

    it("should not call function if success", () => {
      let called = false;
      tapErr(attempt(() => 5), () => {
        called = true;
      });
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
      const result = toNullableResult(attempt(() => 42));
      expect(result).toBe(42);
    });

    it("should return null if failure", () => {
      const result = toNullableResult(
        attempt(() => {
          throw new Error();
        })
      );
      expect(result).toBe(null);
    });
  });

  describe("toUndefined", () => {
    it("should return value if success", () => {
      const result = toUndefinedResult(attempt(() => 42));
      expect(result).toBe(42);
    });

    it("should return undefined if failure", () => {
      const result = toUndefinedResult(
        attempt(() => {
          throw new Error();
        })
      );
      expect(result).toBe(undefined);
    });
  });

  describe("methods (Result)", () => {
    it("should have map method that returns Result", () => {
      const result = attempt(() => 2);
      const mapped = map(result, (x) => x * 2);
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(4);
      }
    });

    it("should have flatMap method that chains Results", () => {
      const result = attempt(() => 2);
      const chained = flatMap(result, (x) => attempt(() => x * 2));
      expect(isOk(chained)).toBe(true);
      if (isOk(chained)) {
        expect(chained.value).toBe(4);
      }
    });

    it("should have getOrElse method", () => {
      const result = attempt(() => 42);
      expect(getOrElse(result, 0)).toBe(42);
    });

    it("should have getOrCompute method", () => {
      const result = attempt(() => 42);
      expect(getOrComputeResult(result, () => 0)).toBe(42);
    });

    it("should have tap function work", () => {
      const result = attempt(() => 5);
      let captured = 0;
      tap(result, (v) => { captured = v; });
      expect(captured).toBe(5);
    });

    it("should have match function work", () => {
      const result = attempt(() => 5);
      const matched = match(result, (v) => v * 2, () => 0);
      expect(matched).toBe(10);
    });

    it("should allow chaining functions", () => {
      const result = getOrElse(
        map(
          flatMap(
            attempt(() => 1),
            (x) => attempt(() => x + 1)
          ),
          (x) => x * 2
        ),
        0
      );
      expect(result).toBe(4);
    });
  });

  describe("methods (Err)", () => {
    it("should have map method that returns Err", () => {
      const result = attempt(() => { throw new Error("fail"); });
      const mapped = map(result, (x) => x * 2);
      expect(isErr(mapped)).toBe(true);
    });

    it("should have flatMap method that returns Err", () => {
      const result = attempt(() => { throw new Error("fail"); });
      const chained = flatMap(result, (x) => attempt(() => x * 2));
      expect(isErr(chained)).toBe(true);
    });

    it("should have getOrElse method", () => {
      const result = attempt(() => { throw new Error("fail"); });
      expect(getOrElse(result, 42)).toBe(42);
    });

    it("should have getOrCompute method", () => {
      const result = attempt(() => { throw new Error("fail"); });
      expect(getOrComputeResult(result, () => 42)).toBe(42);
    });

    it("should have tap function not call on failure", () => {
      const result = attempt(() => { throw new Error("fail"); });
      let called = false;
      tap(result, () => { called = true; });
      expect(called).toBe(false);
    });

    it("should have match function call errFn on failure", () => {
      const result = attempt(() => { throw new Error("fail"); });
      const matched = match(result, () => 0, (e) => e.message);
      expect(matched).toBe("fail");
    });
  });
});
