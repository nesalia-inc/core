import { describe, it, expect } from "vitest";
import {
  error,
  exceptionGroup,
  raise,
  isError,
  isErrorGroup,
  isErrWithError,
  isErrTryWithError,
  getErrorMessage,
  flattenErrorGroup,
  filterErrorsByName,
  ok,
  err,
  isOk,
  isErr,
} from "../src";

describe("error()", () => {
  describe("basic creation", () => {
    it("should create an error with name and args", () => {
      const SizeError = error({
        name: "SizeError",
        args: {} as { current: number; wanted: number },
      });

      const e = SizeError({ current: 3, wanted: 5 });

      expect(isErr(e)).toBe(true);
      expect(e.error.name).toBe("SizeError");
      expect(e.error.args).toEqual({ current: 3, wanted: 5 });
    });

    it("should create a frozen error object", () => {
      const SizeError = error({
        name: "SizeError",
        args: {} as { value: number },
      });

      const e = SizeError({ value: 10 });

      expect(Object.isFrozen(e)).toBe(true);
      expect(Object.isFrozen(e.error)).toBe(true);
      expect(Object.isFrozen(e.error.notes)).toBe(true);
    });

    it("should create error with empty args", () => {
      const GenericError = error({
        name: "GenericError",
        args: null as unknown as undefined,
      });

      const e = GenericError(undefined);

      expect(e.error.name).toBe("GenericError");
      expect(e.error.args).toBeUndefined();
    });

    it("should use addNotes on builder before creating error", () => {
      const ValidationError = error({
        name: "ValidationError",
        args: {} as { field: string },
      });

      // Use addNotes on builder before creating error
      const ErrorWithNotes = ValidationError.addNotes("Builder note");
      const e = ErrorWithNotes({ field: "email" });

      expect(e.error.notes).toEqual(["Builder note"]);
    });

    it("should use from on builder before creating error", () => {
      const SizeError = error({
        name: "SizeError",
        args: {} as { current: number; wanted: number },
      });

      const NetworkError = error({
        name: "NetworkError",
        args: {} as { host: string },
      });

      const cause = NetworkError({ host: "api.example.com" });
      // Use from on builder before creating error
      const SizeErrorWithCause = SizeError.from(cause.error);
      const e = SizeErrorWithCause({ current: 3, wanted: 5 });

      expect(e.error.cause?.name).toBe("NetworkError");
    });

    it("should use from on builder with Err instead of Error", () => {
      const SizeError = error({
        name: "SizeError",
        args: {} as { current: number; wanted: number },
      });

      const NetworkError = error({
        name: "NetworkError",
        args: {} as { host: string },
      });

      const cause = NetworkError({ host: "api.example.com" });
      // Pass Err instead of Error - this covers the else branch
      const SizeErrorWithCause = SizeError.from(cause);
      const e = SizeErrorWithCause({ current: 3, wanted: 5 });

      expect(e.error.cause?.name).toBe("NetworkError");
    });

    it("should preserve cause when addNotes is called after from", () => {
      const SizeError = error({
        name: "SizeError",
        args: {} as { current: number; wanted: number },
      });

      const NetworkError = error({
        name: "NetworkError",
        args: {} as { host: string },
      });

      const cause = NetworkError({ host: "api.example.com" });
      // from().addNotes() should preserve the cause
      const e = SizeError.from(cause.error).addNotes("Note after from")({ current: 3, wanted: 5 });

      expect(e.error.cause?.name).toBe("NetworkError");
      expect(e.error.notes).toEqual(["Note after from"]);
    });
  });

  describe("addNotes()", () => {
    it("should add a single note", () => {
      const ValidationError = error({
        name: "ValidationError",
        args: {} as { field: string },
      });

      const e = ValidationError({ field: "email" }).addNotes("Invalid format");

      expect(e.error.notes).toEqual(["Invalid format"]);
    });

    it("should add multiple notes", () => {
      const ValidationError = error({
        name: "ValidationError",
        args: {} as { field: string },
      });

      const e = ValidationError({ field: "email" })
        .addNotes("First note")
        .addNotes("Second note");

      expect(e.error.notes).toEqual(["First note", "Second note"]);
    });

    it("should preserve notes after creation", () => {
      const ValidationError = error({
        name: "ValidationError",
        args: {} as { field: string },
      });

      const withNotes = ValidationError({ field: "email" }).addNotes("Context: API");
      const withoutNotes = ValidationError({ field: "email" });

      expect(withNotes.error.notes).toEqual(["Context: API"]);
      expect(withoutNotes.error.notes).toEqual([]);
    });

    it("should chain addNotes correctly", () => {
      const ValidationError = error({
        name: "ValidationError",
        args: {} as { field: string },
      });

      const e = ValidationError({ field: "email" })
        .addNotes("Note 1")
        .addNotes("Note 2", "Note 3");

      expect(e.error.notes).toEqual(["Note 1", "Note 2", "Note 3"]);
    });
  });

  describe("from()", () => {
    it("should chain cause from another Error", () => {
      const SizeError = error({
        name: "SizeError",
        args: {} as { current: number; wanted: number },
      });

      const NetworkError = error({
        name: "NetworkError",
        args: {} as { host: string },
      });

      const cause = NetworkError({ host: "api.example.com" });
      const e = SizeError({ current: 3, wanted: 5 }).from(cause.error);

      expect(e.error.cause?.name).toBe("NetworkError");
      expect(e.error.cause?.args).toEqual({ host: "api.example.com" });
    });

    it("should chain cause from Err", () => {
      const SizeError = error({
        name: "SizeError",
        args: {} as { current: number; wanted: number },
      });

      const cause = err({ name: "OriginalError", args: {}, notes: [], cause: null });
      const e = SizeError({ current: 3, wanted: 5 }).from(cause);

      expect(e.error.cause?.name).toBe("OriginalError");
    });
  });

  describe("combined addNotes and from", () => {
    it("should combine addNotes and from", () => {
      const SizeError = error({
        name: "SizeError",
        args: {} as { current: number; wanted: number },
      });

      const NetworkError = error({
        name: "NetworkError",
        args: {} as { host: string },
      });

      const cause = NetworkError({ host: "api.example.com" });
      const e = SizeError({ current: 3, wanted: 5 })
        .addNotes("Operation: upload")
        .from(cause.error);

      expect(e.error.notes).toEqual(["Operation: upload"]);
      expect(e.error.cause?.name).toBe("NetworkError");
    });
  });
});

describe("exceptionGroup()", () => {
  it("should create an error group", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const ValidationError = error({
      name: "ValidationError",
      args: {} as { field: string },
    });

    const group = exceptionGroup([
      SizeError({ value: 10 }),
      ValidationError({ field: "email" }),
    ]);

    expect(group.name).toBe("ExceptionGroup");
    expect(group.exceptions).toHaveLength(2);
    expect(group.exceptions[0].name).toBe("SizeError");
    expect(group.exceptions[1].name).toBe("ValidationError");
  });

  it("should create a frozen group", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const group = exceptionGroup([SizeError({ value: 10 })]);

    expect(Object.isFrozen(group)).toBe(true);
    expect(Object.isFrozen(group.exceptions)).toBe(true);
  });

  it("should handle empty group", () => {
    const group = exceptionGroup([]);

    expect(group.name).toBe("ExceptionGroup");
    expect(group.exceptions).toHaveLength(0);
  });

  it("should accept plain Error objects", () => {
    const plainError: Error = {
      name: "PlainError",
      args: { value: 1 },
      notes: [],
      cause: null,
    };

    const group = exceptionGroup([plainError]);

    expect(group.exceptions).toHaveLength(1);
    expect(group.exceptions[0].name).toBe("PlainError");
  });

  it("should flatten nested ErrorGroups", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const innerGroup = exceptionGroup([SizeError({ value: 10 })]);
    const outerGroup = exceptionGroup([innerGroup]);

    expect(outerGroup.exceptions).toHaveLength(1);
    expect(outerGroup.exceptions[0].name).toBe("SizeError");
  });
});

describe("raise()", () => {
  it("should return an Err", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { current: number; wanted: number },
    });

    const result = raise(SizeError({ current: 3, wanted: 5 }));

    // Note: raise is a type-level utility, but for practical use
    // users should directly return the Err from their functions
    expect(isErr(result)).toBe(true);
  });
});

describe("isError()", () => {
  it("should return true for valid Error", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const e = SizeError({ value: 10 });

    expect(isError(e.error)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isError(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isError(undefined)).toBe(false);
  });

  it("should return false for primitive", () => {
    expect(isError("string")).toBe(false);
    expect(isError(42)).toBe(false);
    expect(isError(true)).toBe(false);
  });

  it("should return false for plain object", () => {
    expect(isError({ name: "Error" })).toBe(false);
  });

  it("should return false for Result with non-Error", () => {
    const result = err("string error");
    expect(isError(result.error)).toBe(false);
  });
});

describe("isErrorGroup()", () => {
  it("should return true for valid ErrorGroup", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const group = exceptionGroup([SizeError({ value: 10 })]);

    expect(isErrorGroup(group)).toBe(true);
  });

  it("should return true for empty group", () => {
    const group = exceptionGroup([]);
    expect(isErrorGroup(group)).toBe(true);
  });

  it("should return false for single Error", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const e = SizeError({ value: 10 });
    expect(isErrorGroup(e.error)).toBe(false);
  });

  it("should return false for null", () => {
    expect(isErrorGroup(null)).toBe(false);
  });
});

describe("isErrWithError()", () => {
  it("should return true when Result contains Error", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const result = SizeError({ value: 10 });

    expect(isErrWithError(result)).toBe(true);
  });

  it("should return false when Result is Ok", () => {
    const result = ok(42);
    expect(isErrWithError(result)).toBe(false);
  });

  it("should return false when Result contains non-Error", () => {
    const result = err("string error");
    expect(isErrWithError(result)).toBe(false);
  });
});

describe("isErrTryWithError()", () => {
  it("should return true when Try contains Error", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    // Create a TryFailure directly with our Error type
    const t = SizeError({ value: 10 });
    // Simulate a Try structure with our Error
    const tryWithError = { ok: false as const, error: t.error };

    expect(isErrTryWithError(tryWithError)).toBe(true);
  });

  it("should return false when Try does not contain Error", () => {
    const tryWithString = { ok: false as const, error: "some error" };
    expect(isErrTryWithError(tryWithString)).toBe(false);
  });
});

describe("getErrorMessage()", () => {
  it("should return message for single Error with args", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { current: number; wanted: number },
    });

    const e = SizeError({ current: 3, wanted: 5 });

    expect(getErrorMessage(e.error)).toBe('SizeError: {"current":3,"wanted":5}');
  });

  it("should return message for ErrorGroup", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const group = exceptionGroup([
      SizeError({ value: 10 }),
      SizeError({ value: 20 }),
    ]);

    expect(getErrorMessage(group)).toBe("ExceptionGroup: 2 error(s)");
  });

  it("should return just name when args is undefined", () => {
    const GenericError = error({
      name: "GenericError",
      args: undefined as unknown as { value: number },
    });

    const e = GenericError(undefined as unknown as { value: number });

    expect(getErrorMessage(e.error)).toBe("GenericError");
  });
});

describe("flattenErrorGroup()", () => {
  it("should flatten nested groups", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const ValidationError = error({
      name: "ValidationError",
      args: {} as { field: string },
    });

    const innerGroup = exceptionGroup([SizeError({ value: 10 })]);
    const outerGroup = exceptionGroup([innerGroup, ValidationError({ field: "email" })]);

    const flat = flattenErrorGroup(outerGroup);

    expect(flat).toHaveLength(2);
    expect(flat[0].name).toBe("SizeError");
    expect(flat[1].name).toBe("ValidationError");
  });

  it("should handle single error", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const e = SizeError({ value: 10 });
    const flat = flattenErrorGroup(e.error);

    expect(flat).toHaveLength(1);
    expect(flat[0].name).toBe("SizeError");
  });
});

describe("filterErrorsByName()", () => {
  it("should filter errors by name", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const ValidationError = error({
      name: "ValidationError",
      args: {} as { field: string },
    });

    const group = exceptionGroup([
      SizeError({ value: 10 }),
      ValidationError({ field: "email" }),
      SizeError({ value: 20 }),
    ]);

    const sizeErrors = filterErrorsByName(group, "SizeError");

    expect(sizeErrors).toHaveLength(2);
    expect(sizeErrors.every((e) => e.name === "SizeError")).toBe(true);
  });

  it("should return empty array when no matches", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const group = exceptionGroup([SizeError({ value: 10 })]);

    const notFound = filterErrorsByName(group, "NonExistent");

    expect(notFound).toHaveLength(0);
  });
});

describe("integration with Result", () => {
  it("should work with mapErr", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { current: number; wanted: number },
    });

    // Start with an Err and transform it with mapErr
    const initialErr = err(SizeError({ current: 3, wanted: 5 }).error);
    const result = initialErr.mapErr((e) => ({ ...e, name: "TransformedError" }));

    expect(isErr(result)).toBe(true);
    expect(result.error.name).toBe("TransformedError");
  });

  it("should work with flatMap", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const result = ok(10).flatMap((x) => {
      if (x <= 5) {
        return SizeError({ value: x });
      }
      return ok(x * 2);
    });

    expect(isOk(result)).toBe(true);
    expect(result.value).toBe(20);
  });

  it("should work with flatMap when error", () => {
    const SizeError = error({
      name: "SizeError",
      args: {} as { value: number },
    });

    const result = ok(10).flatMap((x) => {
      if (x > 5) {
        return SizeError({ value: x });
      }
      return ok(x * 2);
    });

    // x = 10 > 5, so it returns error
    expect(isErr(result)).toBe(true);
  });
});
