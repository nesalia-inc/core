import { describe, it, expect } from "vitest";
import {
  ok,
  err,
  isOk,
  isErr,
  map,
  flatMap,
  mapErr,
  getOrElse,
  getOrCompute,
  tap,
  tapErr,
  match,
  swap,
  toNullable,
  toUndefined,
  all,
  Result,
} from "../src/result";

describe("Result", () => {
  describe("ok", () => {
    it("should create an Ok with a value", () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should create a frozen object", () => {
      const result = ok({ id: 1 });
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("should preserve type of value", () => {
      const strResult = ok("hello");
      expect(strResult.value).toBe("hello");

      const objResult = ok({ key: "value" });
      expect(objResult.value).toEqual({ key: "value" });

      const arrResult = ok([1, 2, 3]);
      expect(arrResult.value).toEqual([1, 2, 3]);
    });

    it("ok() method should return true", () => {
      const result = ok(42);
      expect(result.isOk()).toBe(true);
    });

    it("isErr() method should return false", () => {
      const result = ok(42);
      expect(result.isErr()).toBe(false);
    });
  });

  describe("err", () => {
    it("should create an Err with an error", () => {
      const result = err("error");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("error");
    });

    it("should create a frozen object", () => {
      const result = err(new Error("error"));
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("should work with object errors", () => {
      const error = { code: "NOT_FOUND", message: "Not found" };
      const result = err(error);
      expect(result.error).toEqual(error);
    });

    it("isOk() method should return false", () => {
      const result = err("error");
      expect(result.isOk()).toBe(false);
    });

    it("isErr() method should return true", () => {
      const result = err("error");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("isOk", () => {
    it("should return true for Ok", () => {
      const result = ok(42);
      expect(isOk(result)).toBe(true);
    });

    it("should return false for Err", () => {
      const result = err("error");
      expect(isOk(result)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const value: Result<number, string> = ok(42);
      if (isOk(value)) {
        expect(value.value).toBe(42);
      }
    });
  });

  describe("isErr", () => {
    it("should return false for Ok", () => {
      const result = ok(42);
      expect(isErr(result)).toBe(false);
    });

    it("should return true for Err", () => {
      const result = err("error");
      expect(isErr(result)).toBe(true);
    });

    it("should narrow type correctly", () => {
      const value: Result<number, string> = err("error");
      if (isErr(value)) {
        expect(value.error).toBe("error");
      }
    });
  });

  describe("map", () => {
    it("should transform value if Ok", () => {
      const result = map(ok(2), (x) => x * 2);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(4);
      }
    });

    it("should return Err if Err", () => {
      const result = map(err("error"), (x) => x * 2);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe("error");
      }
    });

    it("should allow type change", () => {
      const result = map(ok(42), (x) => x.toString());
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(typeof result.value).toBe("string");
        expect(result.value).toBe("42");
      }
    });
  });

  describe("flatMap", () => {
    it("should chain Results if Ok", () => {
      const result = flatMap(ok(2), (x) => ok(x * 2));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(4);
      }
    });

    it("should return Err if Err", () => {
      const result = flatMap(err("error"), (x) => ok(x * 2));
      expect(isErr(result)).toBe(true);
    });

    it("should allow returning Err from function", () => {
      const result = flatMap(ok(2), (x) => (x > 0 ? ok(x) : err("negative")));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(2);
      }
    });

    it("should allow returning Err from function when condition fails", () => {
      const result = flatMap(ok(-1), (x) => (x > 0 ? ok(x) : err("negative")));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe("negative");
      }
    });
  });

  describe("mapErr", () => {
    it("should transform error if Err", () => {
      const result = mapErr(err("error"), (e) => new Error(e));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe("error");
      }
    });

    it("should return Ok if Ok", () => {
      const result = mapErr(ok(42), (e) => new Error(e));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe("getOrElse", () => {
    it("should return value if Ok", () => {
      const result = getOrElse(ok(42), 0);
      expect(result).toBe(42);
    });

    it("should return default if Err", () => {
      const result = getOrElse(err("error"), 0);
      expect(result).toBe(0);
    });
  });

  describe("getOrCompute", () => {
    it("should return value if Ok", () => {
      const result = getOrCompute(ok(42), () => 0);
      expect(result).toBe(42);
    });

    it("should return computed value if Err", () => {
      const result = getOrCompute(err("error"), () => 42);
      expect(result).toBe(42);
    });

    it("should not call function if Ok", () => {
      let called = false;
      getOrCompute(ok(1), () => {
        called = true;
        return 0;
      });
      expect(called).toBe(false);
    });

    it("should call function if Err", () => {
      let called = false;
      getOrCompute(err("error"), () => {
        called = true;
        return 42;
      });
      expect(called).toBe(true);
    });
  });

  describe("tap", () => {
    it("should call function with value if Ok", () => {
      let captured = 0;
      tap(ok(5), (v) => {
        captured = v;
      });
      expect(captured).toBe(5);
    });

    it("should not call function if Err", () => {
      let called = false;
      tap(err("error"), () => {
        called = true;
      });
      expect(called).toBe(false);
    });

    it("should return the same Result", () => {
      const r = ok(42);
      const result = tap(r, () => {});
      expect(result).toBe(r);
    });
  });

  describe("tapErr", () => {
    it("should call function with error if Err", () => {
      let captured = "";
      tapErr(err("error"), (e) => {
        captured = e;
      });
      expect(captured).toBe("error");
    });

    it("should not call function if Ok", () => {
      let called = false;
      tapErr(ok(5), () => {
        called = true;
      });
      expect(called).toBe(false);
    });

    it("should return the same Result", () => {
      const r = err("error");
      const result = tapErr(r, () => {});
      expect(result).toBe(r);
    });
  });

  describe("match", () => {
    it("should call okFn if Ok", () => {
      const result = match(ok(5), (v) => v * 2, () => 0);
      expect(result).toBe(10);
    });

    it("should call errFn if Err", () => {
      const result = match(err("error"), (v) => v * 2, () => 0);
      expect(result).toBe(0);
    });

    it("should allow different return types", () => {
      const okResult = match(ok("hello"), (v) => v.length, () => 0);
      const errResult = match(err("error"), (v: string) => v.length, () => 0);
      expect(okResult).toBe(5);
      expect(errResult).toBe(0);
    });
  });

  describe("toNullable", () => {
    it("should return value if Ok", () => {
      const result = toNullable(ok(42));
      expect(result).toBe(42);
    });

    it("should return null if Err", () => {
      const result = toNullable(err("error"));
      expect(result).toBe(null);
    });
  });

  describe("toUndefined", () => {
    it("should return value if Ok", () => {
      const result = toUndefined(ok(42));
      expect(result).toBe(42);
    });

    it("should return undefined if Err", () => {
      const result = toUndefined(err("error"));
      expect(result).toBe(undefined);
    });
  });

  describe("swap", () => {
    it("should swap Ok to Err", () => {
      const result = ok(42).swap();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(42);
      }
    });

    it("should swap Err to Ok", () => {
      const result = err("error").swap();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("error");
      }
    });

    it("should preserve type when swapping", () => {
      const success: Result<string, Error> = ok("hello");
      const inverted: Result<Error, string> = success.swap();
      expect(inverted.ok).toBe(false);
      if (!inverted.ok) {
        expect(inverted.error).toBe("hello");
      }

      const failure: Result<string, Error> = err(new Error("oops"));
      const inverted2: Result<Error, string> = failure.swap();
      expect(inverted2.ok).toBe(true);
      if (inverted2.ok) {
        expect(inverted2.value).toBeInstanceOf(Error);
      }
    });
  });

  describe("standalone swap function", () => {
    it("should swap Ok to Err using standalone function", () => {
      const result = swap(ok(42));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(42);
      }
    });

    it("should swap Err to Ok using standalone function", () => {
      const result = swap(err("error"));
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("error");
      }
    });

    it("should preserve type when swapping using standalone function", () => {
      const success: Result<string, Error> = ok("hello");
      const inverted: Result<Error, string> = swap(success);
      expect(inverted.ok).toBe(false);
      if (!inverted.ok) {
        expect(inverted.error).toBe("hello");
      }

      const failure: Result<string, Error> = err(new Error("oops"));
      const inverted2: Result<Error, string> = swap(failure);
      expect(inverted2.ok).toBe(true);
      if (inverted2.ok) {
        expect(inverted2.value).toBeInstanceOf(Error);
      }
    });
  });

  describe("type narrowing", () => {
    it("should correctly narrow Result types in array", () => {
      const values: Result<number, string>[] = [ok(1), err("error"), ok(2)];

      const oks = values.filter(isOk);
      const errs = values.filter(isErr);

      expect(oks.length).toBe(2);
      expect(errs.length).toBe(1);
    });

    it("should work with complex object types", () => {
      interface User {
        id: number;
        name: string;
      }

      const user: Result<User, string> = ok({ id: 1, name: "John" });

      if (isOk(user)) {
        expect(user.value.id).toBe(1);
        expect(user.value.name).toBe("John");
      }
    });
  });

  describe("all", () => {
    it("should combine multiple Ok results into array", () => {
      const result = all(ok(1), ok(2), ok(3));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual([1, 2, 3]);
      }
    });

    it("should return Err if any result is Err (fail-fast)", () => {
      const result = all(ok(1), err("error"), ok(3));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe("error");
      }
    });

    it("should return first error when multiple are Err", () => {
      const result = all(err("first"), err("second"), err("third"));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe("first");
      }
    });

    it("should return Ok with empty array for no results", () => {
      const result = all();
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual([]);
      }
    });

    it("should work with object values", () => {
      const result = all(ok({ a: 1 }), ok({ b: 2 }));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual([{ a: 1 }, { b: 2 }]);
      }
    });

    it("should work with single result", () => {
      const result = all(ok(42));
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual([42]);
      }
    });
  });
});
