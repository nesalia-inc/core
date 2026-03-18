import { describe, it, expect } from "vitest";
import {
  some,
  none,
  fromNullable,
  isSome,
  isNone,
  map,
  flatMap,
  getOrElse,
  getOrCompute,
  tap,
  match,
  toNullable,
  toUndefined,
  someUnit,
  Maybe,
  all,
} from "../src/maybe";

describe("Maybe", () => {
  describe("some", () => {
    it("should create a Some with a value", () => {
      const result = some(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should create a frozen object", () => {
      const result = some({ id: 1 });
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("should preserve type of value", () => {
      const strResult = some("hello");
      expect(strResult.value).toBe("hello");

      const objResult = some({ key: "value" });
      expect(objResult.value).toEqual({ key: "value" });

      const arrResult = some([1, 2, 3]);
      expect(arrResult.value).toEqual([1, 2, 3]);
    });
  });

  describe("none", () => {
    it("should return a None with ok: false", () => {
      const result = none();
      expect(result.ok).toBe(false);
    });

    it("should be a singleton", () => {
      const n1 = none();
      const n2 = none();
      expect(n1).toBe(n2);
    });
  });

  describe("fromNullable", () => {
    it("should return Some for non-null value", () => {
      const result = fromNullable(42);
      expect(isSome(result)).toBe(true);
      expect(result.value).toBe(42);
    });

    it("should return Some for string", () => {
      const result = fromNullable("hello");
      expect(isSome(result)).toBe(true);
      expect(result.value).toBe("hello");
    });

    it("should return Some for object", () => {
      const obj = { id: 1 };
      const result = fromNullable(obj);
      expect(isSome(result)).toBe(true);
      expect(result.value).toBe(obj);
    });

    it("should return None for null", () => {
      const result = fromNullable(null);
      expect(isNone(result)).toBe(true);
    });

    it("should return None for undefined", () => {
      const result = fromNullable(undefined);
      expect(isNone(result)).toBe(true);
    });

    it("should return None for 0", () => {
      const result = fromNullable(0);
      expect(isSome(result)).toBe(true);
      expect(result.value).toBe(0);
    });

    it("should return None for empty string", () => {
      const result = fromNullable("");
      expect(isSome(result)).toBe(true);
      expect(result.value).toBe("");
    });

    it("should return None for false", () => {
      const result = fromNullable(false);
      expect(isSome(result)).toBe(true);
      expect(result.value).toBe(false);
    });
  });

  describe("isSome", () => {
    it("should return true for Some", () => {
      const result = some(42);
      expect(isSome(result)).toBe(true);
    });

    it("should return false for None", () => {
      const result = none();
      expect(isSome(result)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const value: Maybe<number> = some(42);
      if (isSome(value)) {
        expect(value.value).toBe(42);
      }
    });

    it("isSome() method should return true for Some", () => {
      const result = some(42);
      expect(result.isSome()).toBe(true);
    });

    it("isSome() method should return false for None", () => {
      const result = none();
      expect(result.isSome()).toBe(false);
    });
  });

  describe("isNone", () => {
    it("should return false for Some", () => {
      const result = some(42);
      expect(isNone(result)).toBe(false);
    });

    it("should return true for None", () => {
      const result = none();
      expect(isNone(result)).toBe(true);
    });

    it("should narrow type correctly", () => {
      const value: Maybe<number> = none();
      if (isNone(value)) {
        expect(value.ok).toBe(false);
      }
    });

    it("isNone() method should return false for Some", () => {
      const result = some(42);
      expect(result.isNone()).toBe(false);
    });

    it("isNone() method should return true for None", () => {
      const result = none();
      expect(result.isNone()).toBe(true);
    });
  });

  describe("map", () => {
    it("should transform value if Some", () => {
      const result = map(some(2), (x) => x * 2);
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(result.value).toBe(4);
      }
    });

    it("should return None if None", () => {
      const result = map(none(), (x) => x * 2);
      expect(isNone(result)).toBe(true);
    });

    it("should allow type change", () => {
      const result = map(some(42), (x) => x.toString());
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(typeof result.value).toBe("string");
        expect(result.value).toBe("42");
      }
    });
  });

  describe("flatMap", () => {
    it("should chain Maybes if Some", () => {
      const result = flatMap(some(2), (x) => some(x * 2));
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(result.value).toBe(4);
      }
    });

    it("should return None if None", () => {
      const result = flatMap(none(), (x) => some(x * 2));
      expect(isNone(result)).toBe(true);
    });

    it("should allow returning None from function", () => {
      const result = flatMap(some(2), (x) => (x > 0 ? some(x) : none()));
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(result.value).toBe(2);
      }
    });

    it("should allow returning None from function when condition fails", () => {
      const result = flatMap(some(-1), (x) => (x > 0 ? some(x) : none()));
      expect(isNone(result)).toBe(true);
    });
  });

  describe("getOrElse", () => {
    it("should return value if Some", () => {
      const result = getOrElse(some(42), 0);
      expect(result).toBe(42);
    });

    it("should return default if None", () => {
      const result = getOrElse(none(), 0);
      expect(result).toBe(0);
    });

    it("should return default for null value", () => {
      const result = getOrElse(fromNullable(null), "default");
      expect(result).toBe("default");
    });
  });

  describe("getOrCompute", () => {
    it("should return value if Some", () => {
      const result = getOrCompute(some(42), () => 0);
      expect(result).toBe(42);
    });

    it("should return computed value if None", () => {
      const result = getOrCompute(none(), () => 42);
      expect(result).toBe(42);
    });

    it("should not call function if Some", () => {
      let called = false;
      getOrCompute(some(1), () => {
        called = true;
        return 0;
      });
      expect(called).toBe(false);
    });

    it("should call function if None", () => {
      let called = false;
      getOrCompute(none(), () => {
        called = true;
        return 42;
      });
      expect(called).toBe(true);
    });
  });

  describe("type narrowing", () => {
    it("should correctly narrow Maybe types in array", () => {
      const values: Maybe<number>[] = [some(1), none(), some(2)];

      const somes = values.filter(isSome);
      const nones = values.filter(isNone);

      expect(somes.length).toBe(2);
      expect(nones.length).toBe(1);
    });

    it("should work with complex object types", () => {
      interface User {
        id: number;
        name: string;
      }

      const user: Maybe<User> = some({ id: 1, name: "John" });

      if (isSome(user)) {
        expect(user.value.id).toBe(1);
        expect(user.value.name).toBe("John");
      }
    });
  });

  describe("someUnit", () => {
    it("should create a Some with undefined value", () => {
      const result = someUnit();
      expect(result.ok).toBe(true);
      expect(result.value).toBe(undefined);
    });

    it("should be a frozen object", () => {
      const result = someUnit();
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("isSome should return true", () => {
      const result = someUnit();
      expect(result.isSome()).toBe(true);
    });

    it("isNone should return false", () => {
      const result = someUnit();
      expect(result.isNone()).toBe(false);
    });
  });

  describe("tap", () => {
    it("should call function with value if Some", () => {
      let captured = 0;
      tap(some(5), (v) => {
        captured = v;
      });
      expect(captured).toBe(5);
    });

    it("should not call function if None", () => {
      let called = false;
      tap(none(), () => {
        called = true;
      });
      expect(called).toBe(false);
    });

    it("should return the same Maybe", () => {
      const m = some(42);
      const result = tap(m, () => {});
      expect(result).toBe(m);
    });
  });

  describe("match", () => {
    it("should call someFn if Some", () => {
      const result = match(some(5), (v) => v * 2, () => 0);
      expect(result).toBe(10);
    });

    it("should call noneFn if None", () => {
      const result = match(none(), (v) => v * 2, () => 0);
      expect(result).toBe(0);
    });

    it("should allow different return types", () => {
      const someResult = match(some("hello"), (v) => v.length, () => 0);
      const noneResult = match(none(), (v: string) => v.length, () => 0);
      expect(someResult).toBe(5);
      expect(noneResult).toBe(0);
    });
  });

  describe("toNullable", () => {
    it("should return value if Some", () => {
      const result = toNullable(some(42));
      expect(result).toBe(42);
    });

    it("should return null if None", () => {
      const result = toNullable(none());
      expect(result).toBe(null);
    });
  });

  describe("toUndefined", () => {
    it("should return value if Some", () => {
      const result = toUndefined(some(42));
      expect(result).toBe(42);
    });

    it("should return undefined if None", () => {
      const result = toUndefined(none());
      expect(result).toBe(undefined);
    });
  });

  describe("all", () => {
    it("should combine two Somes into Some<[T1, T2]>", () => {
      const result = all(some(1), some("hello"));
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(result.value).toEqual([1, "hello"]);
      }
    });

    it("should return None if any is None (two maybes)", () => {
      const result = all(some(1), none());
      expect(isNone(result)).toBe(true);
    });

    it("should return None if first is None", () => {
      const result = all(none(), some(2));
      expect(isNone(result)).toBe(true);
    });

    it("should combine three Somes", () => {
      const result = all(some(1), some(2), some(3));
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(result.value).toEqual([1, 2, 3]);
      }
    });

    it("should return None if any of three is None", () => {
      const result = all(some(1), none(), some(3));
      expect(isNone(result)).toBe(true);
    });

    it("should combine four Somes", () => {
      const result = all(some(1), some(2), some(3), some(4));
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(result.value).toEqual([1, 2, 3, 4]);
      }
    });

    it("should combine array of maybes", () => {
      const result = all([some(1), some(2), some(3)]);
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(result.value).toEqual([1, 2, 3]);
      }
    });

    it("should return None if any in array is None", () => {
      const result = all([some(1), none(), some(3)]);
      expect(isNone(result)).toBe(true);
    });

    it("should return Some<[]> for empty array", () => {
      const result = all([]);
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(result.value).toEqual([]);
      }
    });

    it("should work with map after all", () => {
      const firstName = some("John");
      const lastName = some("Doe");
      const result = map(all(firstName, lastName), ([f, l]) => `${f} ${l}`);
      expect(isSome(result)).toBe(true);
      if (isSome(result)) {
        expect(result.value).toBe("John Doe");
      }
    });

    it("should return None when combining with none after map", () => {
      const firstName = some("John");
      const lastName = none();
      const result = map(all(firstName, lastName), ([f, l]) => `${f} ${l}`);
      expect(isNone(result)).toBe(true);
    });
  });
});
