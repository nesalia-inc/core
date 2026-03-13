/**
 * Type Conversions Guide Example
 *
 * This example demonstrates how to convert between:
 * - Result and Maybe
 * - And when to use each type
 */

import {
  ok,
  err,
  some,
  none,
  toResult,
  toMaybeFromResult,
  error,
  Error,
  isErr,
} from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

type ValidationError = Error<{ field: string; message: string }>;
type DomainError = Error<{ code: string; message: string }>;

// ============================================================================
// Example 1: Result ↔ Maybe
// ============================================================================

const resultToMaybeExample = () => {
  console.log("\n=== Example 1: Result ↔ Maybe ===");

  // Result → Maybe
  const result1 = ok(42);
  const maybe1 = toMaybeFromResult(result1);
  console.log(`  Result to Maybe: ${maybe1.isSome() ? "Some" : "None"}`);

  const result2 = err<ValidationError>(
    error({
      name: "INVALID",
      args: { field: "email", message: "Invalid" },
    })
  );
  const maybe2 = toMaybeFromResult(result2);
  console.log(`  Err Result to Maybe: ${maybe2.isSome() ? "Some" : "None"}`);

  // Maybe → Result
  const maybe3 = some("hello");
  const result3 = toResult(maybe3, () =>
    error({
      name: "REQUIRED",
      args: { field: "value", message: "Value is required" },
    })
  );
  console.log(`  Maybe to Result: ${result3.isOk() ? "Ok" : "Err"}`);

  const maybe4 = none<string>();
  const result4 = toResult(maybe4, () =>
    error({
      name: "REQUIRED",
      args: { field: "value", message: "Value is required" },
    })
  );
  console.log(`  None Maybe to Result: ${result4.isOk() ? "Ok" : "Err"}`);
  if (result4.isErr()) {
    console.log(`    Error: ${result4.error.args.message}`);
  }
};

// ============================================================================
// Example 2: When to use which type
// ============================================================================

const choosingTheRightType = () => {
  console.log("\n=== Example 2: Choosing the Right Type ===");

  // Use Result when: Simple success/failure with error details
  console.log("\n  Result - Use for:");
  console.log("    • API responses");
  console.log("    • Validation results");
  console.log("    • Simple error handling");

  const validationResult = ok("user@example.com");
  console.log(`    Example: ${validationResult.isOk() ? "Valid email" : "Invalid"}`);

  // Use Maybe when: Value may or may not exist
  console.log("\n  Maybe - Use for:");
  console.log("    • Optional configuration");
  console.log("    • Nullable database fields");
  console.log("    • Safe property access");

  const configValue = some(3000);
  console.log(`    Example: Port = ${configValue.getOrElse(8080)}`);

  // Use Error with Result when: Need rich error context
  console.log("\n  Result with Error - Use for:");
  console.log("    • Structured error information");
  console.log("    • Error cause chains");
  console.log("    • Error notes and metadata");

  const businessError = error({
    name: "INSUFFICIENT_FUNDS",
    args: { code: "INSUFFICIENT_FUNDS", message: "Not enough money" },
  });
  const errorResult = err(businessError);
  if (isErr(errorResult)) {
    console.log(`    Example: Error - ${errorResult.error.name}: ${errorResult.error.args.message}`);
  }
};

// ============================================================================
// Example 3: Practical conversion scenario
// ============================================================================

const practicalScenario = () => {
  console.log("\n=== Example 3: Practical Scenario ===");

  // Scenario: User lookup that might not exist (Maybe)
  const findUser = (id: number) => (id === 1 ? some({ id, name: "Alice" }) : none());

  // Convert to Result for validation
  const userResult = toResult(findUser(1), () =>
    error({
      name: "NOT_FOUND",
      args: { field: "user", message: "User not found" },
    })
  );

  console.log("  Step 1: Find user (Maybe)");
  console.log(`  Step 2: Convert to Result for validation`);
  console.log(`  Result: ${userResult.isOk() ? `Found ${userResult.value.name}` : "Not found"}`);

  // Use Result directly for error handling
  console.log(`  Step 3: Use Result for error handling`);
  console.log(`  Result: ${userResult.isOk() ? "Success" : "Error"}`);
};

// ============================================================================
// Example 4: Migration patterns
// ============================================================================

const migrationPatterns = () => {
  console.log("\n=== Example 4: Migration Patterns ===");

  // Old code using Maybe
  const legacyFindUser = (id: number): ReturnType<typeof some> => {
    return id === 1 ? some({ id, name: "Alice" }) : none();
  };

  // New code using Result (with migration)
  function newFindUser(id: number) {
    const maybeUser = legacyFindUser(id);
    return toResult(maybeUser, () =>
      error({
        name: "NOT_FOUND",
        args: { field: "user", message: "User not found" },
      })
    );
  }

  console.log("  Migrating from Maybe to Result:");
  const user1 = newFindUser(1);
  console.log(`    User 1: ${user1.isOk() ? user1.value.name : "Not found"}`);

  const user2 = newFindUser(999);
  console.log(`    User 999: ${user2.isOk() ? "Found" : "Not found"}`);
  if (user2.isErr()) {
    console.log(`      Error: ${user2.error.args.message}`);
  }
};

// ============================================================================
// Run all examples
// ============================================================================

const main = () => {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Type Conversions Guide with @deessejs/core               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    resultToMaybeExample();
    choosingTheRightType();
    practicalScenario();
    migrationPatterns();

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
};

main();
