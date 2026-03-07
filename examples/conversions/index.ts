/**
 * Type Conversions Guide Example
 *
 * This example demonstrates how to convert between:
 * - Result and Maybe
 * - Result and Outcome
 * - Maybe and Outcome
 * - And when to use each type
 */

import {
  ok,
  err,
  some,
  none,
  success,
  cause,
  toResult,
  toOutcome,
  toMaybeFromResult,
  toMaybeFromOutcome,
  toResultFromOutcome,
} from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

type ValidationError = { field: string; message: string };
type DomainError = { code: string; message: string };
type SystemError = { type: string; message: string };

// ============================================================================
// Example 1: Result ↔ Maybe
// ============================================================================

function resultToMaybeExample() {
  console.log("\n=== Example 1: Result ↔ Maybe ===");

  // Result → Maybe
  const result1 = ok(42);
  const maybe1 = toMaybeFromResult(result1);
  console.log(`  Result to Maybe: ${maybe1.isSome() ? "Some" : "None"}`);

  const result2 = err<ValidationError>({ field: "email", message: "Invalid" });
  const maybe2 = toMaybeFromResult(result2);
  console.log(`  Err Result to Maybe: ${maybe2.isSome() ? "Some" : "None"}`);

  // Maybe → Result
  const maybe3 = some("hello");
  const result3 = toResult(maybe3, {
    field: "value",
    message: "Value is required",
  });
  console.log(`  Maybe to Result: ${result3.isOk() ? "Ok" : "Err"}`);

  const maybe4 = none<string>();
  const result4 = toResult(maybe4, {
    field: "value",
    message: "Value is required",
  });
  console.log(`  None Maybe to Result: ${result4.isOk() ? "Ok" : "Err"}`);
  if (result4.isErr()) {
    console.log(`    Error: ${result4.error.message}`);
  }
}

// ============================================================================
// Example 2: Result → Outcome
// ============================================================================

function resultToOutcomeExample() {
  console.log("\n=== Example 2: Result → Outcome ===");

  // Ok → Success
  const result1 = ok("data");
  const outcome1 = toOutcome(result1);
  console.log(`  Result Ok to Outcome: ${outcome1.isSuccess() ? "Success" : "Cause/Exception"}`);

  // Err → Cause (default)
  const result2 = err<DomainError>({ code: "INVALID", message: "Invalid data" });
  const outcome2 = toOutcome(result2);
  console.log(`  Result Err to Outcome: ${outcome2.isCause() ? "Cause" : "Success/Exception"}`);

  // Err → Exception (with options)
  const result3 = err<SystemError>({ type: "DATABASE", message: "Connection failed" });
  const outcome3 = toOutcome(result3, {
    systemErrors: "exception",
  });
  console.log(`  Result Err to Exception: ${outcome3.isException() ? "Exception" : "Success/Cause"}`);
}

// ============================================================================
// Example 3: Outcome → Result
// ============================================================================

function outcomeToResultExample() {
  console.log("\n=== Example 3: Outcome → Result ===");

  // Success → Ok
  const outcome1 = success("value");
  const result1 = toResultFromOutcome(outcome1);
  console.log(`  Outcome Success to Result: ${result1.isOk() ? "Ok" : "Err"}`);

  // Cause → Err
  const outcome2 = cause<DomainError>({ code: "NOT_FOUND", message: "Resource not found" });
  const result2 = toResultFromOutcome(outcome2);
  console.log(`  Outcome Cause to Result: ${result2.isOk() ? "Ok" : "Err"}`);

  // Exception → Err
  const outcome3 = outcome3; // Would be exception type
  // Note: In real code, you'd create an actual exception outcome
  console.log(`  Outcome Exception to Result: Err (system error)`);
}

// ============================================================================
// Example 4: Maybe ↔ Outcome
// ============================================================================

function maybeToOutcomeExample() {
  console.log("\n=== Example 4: Maybe ↔ Outcome ===");

  // Some → Success
  const maybe1 = some("value");
  const outcome1 = toOutcome(maybe1, {
    onNone: () => ({ code: "MISSING", message: "Value is required" }),
  });
  console.log(`  Maybe Some to Outcome: ${outcome1.isSuccess() ? "Success" : "Cause"}`);

  // None → Cause
  const maybe2 = none<string>();
  const outcome2 = toOutcome(maybe2, {
    onNone: () => ({ code: "MISSING", message: "Value is required" }),
  });
  console.log(`  Maybe None to Outcome: ${outcome2.isCause() ? "Cause" : "Success"}`);

  // Success → Some
  const outcome3 = success("data");
  const maybe3 = toMaybeFromOutcome(outcome3);
  console.log(`  Outcome Success to Maybe: ${maybe3.isSome() ? "Some" : "None"}`);

  // Cause → None
  const outcome4 = cause({ code: "ERROR", message: "Failed" });
  const maybe4 = toMaybeFromOutcome(outcome4);
  console.log(`  Outcome Cause to Maybe: ${maybe4.isSome() ? "Some" : "None"}`);
}

// ============================================================================
// Example 5: When to use which type
// ============================================================================

function choosingTheRightType() {
  console.log("\n=== Example 5: Choosing the Right Type ===");

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

  // Use Outcome when: Need to distinguish error types
  console.log("\n  Outcome - Use for:");
  console.log("    • Domain vs system errors");
  console.log("    • Expected vs unexpected failures");
  console.log("    • Rich error context");

  const businessError = cause({ code: "INSUFFICIENT_FUNDS", message: "Not enough money" });
  if (businessError.isCause()) {
    console.log(`    Example: Business error - ${businessError.value.code}`);
  }
}

// ============================================================================
// Example 6: Practical conversion scenario
// ============================================================================

function practicalScenario() {
  console.log("\n=== Example 6: Practical Scenario ===");

  // Scenario: User lookup that might not exist (Maybe)
  const findUser = (id: number) => (id === 1 ? some({ id, name: "Alice" }) : none());

  // Convert to Result for validation
  const userResult = toResult(findUser(1), {
    field: "user",
    message: "User not found",
  });

  console.log("  Step 1: Find user (Maybe)");
  console.log(`  Step 2: Convert to Result for validation`);
  console.log(`  Result: ${userResult.isOk() ? `Found ${userResult.value.name}` : "Not found"}`);

  // Convert to Outcome for error handling
  const userOutcome = toOutcome(userResult, {
    systemErrors: "exception",
  });

  console.log(`  Step 3: Convert to Outcome for error handling`);
  console.log(`  Result: ${userOutcome.isSuccess() ? "Success" : "Error"}`);
}

// ============================================================================
// Example 7: Migration patterns
// ============================================================================

function migrationPatterns() {
  console.log("\n=== Example 7: Migration Patterns ===");

  // Old code using Maybe
  function legacyFindUser(id: number): ReturnType<typeof some> {
    return id === 1 ? some({ id, name: "Alice" }) : none();
  }

  // New code using Result (with migration)
  function newFindUser(id: number) {
    const maybeUser = legacyFindUser(id);
    return toResult(maybeUser, {
      field: "user",
      message: "User not found",
    });
  }

  console.log("  Migrating from Maybe to Result:");
  const user1 = newFindUser(1);
  console.log(`    User 1: ${user1.isOk() ? user1.value.name : "Not found"}`);

  const user2 = newFindUser(999);
  console.log(`    User 999: ${user2.isOk() ? "Found" : "Not found"}`);
  if (user2.isErr()) {
    console.log(`      Error: ${user2.error.message}`);
  }
}

// ============================================================================
// Run all examples
// ============================================================================

function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Type Conversions Guide with @deessejs/core               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    resultToMaybeExample();
    resultToOutcomeExample();
    outcomeToResultExample();
    maybeToOutcomeExample();
    choosingTheRightType();
    practicalScenario();
    migrationPatterns();

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main();
