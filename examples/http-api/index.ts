/**
 * HTTP API Error Handling Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Wrapping fetch API calls with AsyncResult
 * - Implementing retry logic with exponential backoff
 * - Adding timeout constraints to requests
 * - Distinguishing between network errors and business logic errors
 */

import { ok, err, fromPromise, okAsync, errAsync } from "@deessejs/core";
import { retryAsync, withTimeout } from "@deessejs/core";

// Types
interface User {
  id: number;
  name: string;
  email: string;
}

interface ApiError {
  type: "NETWORK" | "TIMEOUT" | "BUSINESS" | "NOT_FOUND";
  message: string;
  statusCode?: number;
}

// Mock API functions (simulating real API calls)
async function fetchUserFromApi(id: number): Promise<User> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate business logic: user not found
  if (id > 100) {
    throw new Error(`User ${id} not found`);
  }

  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
  };
}

async function createUserInApi(data: {
  name: string;
  email: string;
}): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Simulate validation error
  if (!data.email.includes("@")) {
    const error = new Error("Invalid email format");
    (error as any).statusCode = 400;
    throw error;
  }

  return {
    id: Math.floor(Math.random() * 100),
    ...data,
  };
}

// ============================================================================
// Example 1: Basic fetch with AsyncResult
// ============================================================================

async function getUser(id: number) {
  console.log(`\n=== Example 1: Basic fetch with AsyncResult ===`);
  console.log(`Fetching user ${id}...`);

  const result = await fromPromise(fetchUserFromApi(id)).mapErr((error) => ({
    type: "NETWORK" as const,
    message: error instanceof Error ? error.message : "Unknown error",
  }));

  return result.match(
    (user) => {
      console.log(`✓ Found user: ${user.name} (${user.email})`);
      return user;
    },
    (error) => {
      console.log(`✗ Error: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 2: Fetch with timeout
// ============================================================================

async function getUserWithTimeout(id: number, timeoutMs: number) {
  console.log(`\n=== Example 2: Fetch with timeout (${timeoutMs}ms) ===`);
  console.log(`Fetching user ${id} with timeout...`);

  const result = await fromPromise(fetchUserFromApi(id))
    .flatMap((user) => fromPromise(withTimeout(Promise.resolve(user), timeoutMs, {
      message: "Request timeout",
      name: "TIMEOUT",
    })))
    .mapErr((error) => ({
      type: error.message.includes("timeout") ? ("TIMEOUT" as const) : ("NETWORK" as const),
      message: error.message,
    }));

  return result.match(
    (user) => {
      console.log(`✓ Found user: ${user.name}`);
      return user;
    },
    (error) => {
      console.log(`✗ Error [${error.type}]: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 3: Fetch with retry logic
// ============================================================================

async function getUserWithRetry(id: number) {
  console.log(`\n=== Example 3: Fetch with retry logic ===`);
  console.log(`Fetching user ${id} with automatic retry...`);

  let attemptCount = 0;

  const result = await retryAsync(
    () => fromPromise(fetchUserFromApi(id)),
    {
      attempts: 3,
      delay: 500,
      backoff: "exponential",
      jitter: true,
      onRetry: (error, attempt) => {
        attemptCount = attempt;
        console.log(`  ↻ Retry attempt ${attempt} after error: ${error.message}`);
      },
    }
  ).mapErr((error) => ({
    type: "NETWORK" as const,
    message: `Failed after ${attemptCount} attempts: ${error.message}`,
  }));

  return result.match(
    (user) => {
      console.log(`✓ Found user: ${user.name} (after ${attemptCount} attempts)`);
      return user;
    },
    (error) => {
      console.log(`✗ Error: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 4: POST request with validation
// ============================================================================

async function createUser(data: { name: string; email: string }) {
  console.log(`\n=== Example 4: POST request with validation ===`);
  console.log(`Creating user: ${data.name} (${data.email})`);

  // Validate input first
  const validationResult = ok(data)
    .flatMap((d) =>
      d.name.length >= 2
        ? ok(d)
        : err({ type: "BUSINESS" as const, message: "Name too short" })
    )
    .flatMap((d) =>
      d.email.includes("@")
        ? ok(d)
        : err({ type: "BUSINESS" as const, message: "Invalid email" })
    );

  if (validationResult.isErr()) {
    const error = validationResult.error;
    console.log(`✗ Validation error: ${error.message}`);
    return err(error);
  }

  // Make API call
  const result = await fromPromise(createUserInApi(data)).mapErr((error) => {
    const statusCode = (error as any).statusCode;
    return {
      type: statusCode === 400 ? ("BUSINESS" as const) : ("NETWORK" as const),
      message: error.message,
      statusCode,
    };
  });

  return result.match(
    (user) => {
      console.log(`✓ User created: ${user.name} (ID: ${user.id})`);
      return user;
    },
    (error) => {
      console.log(`✗ Error [${error.type}]: ${error.message}`);
      return error;
    }
  );
}

// ============================================================================
// Example 5: Chaining multiple API calls
// ============================================================================

async function getUserWithPosts(userId: number) {
  console.log(`\n=== Example 5: Chaining multiple API calls ===`);
  console.log(`Fetching user ${userId} with posts...`);

  const result = await fromPromise(fetchUserFromApi(userId))
    .flatMapAsync(async (user) => {
      // Simulate fetching posts for this user
      await new Promise((resolve) => setTimeout(resolve, 50));
      const posts = [
        { id: 1, userId, title: "First post" },
        { id: 2, userId, title: "Second post" },
      ];
      return okAsync({ user, posts });
    })
    .mapErr((error) => ({
      type: "NETWORK" as const,
      message: error.message,
    }));

  return result.match(
    (data) => {
      console.log(`✓ ${data.user.name} has ${data.posts.length} posts`);
      return data;
    },
    (error) => {
      console.log(`✗ Error: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Run all examples
// ============================================================================

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   HTTP API Error Handling with @deessejs/core            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Example 1: Basic fetch
    await getUser(1);
    await getUser(999).catch(() => {}); // Will fail

    // Example 2: With timeout
    await getUserWithTimeout(1, 1000); // Success
    await getUserWithTimeout(1, 10).catch(() => {}); // Timeout

    // Example 3: With retry
    await getUserWithRetry(1);

    // Example 4: POST with validation
    await createUser({ name: "John", email: "john@example.com" });
    await createUser({ name: "X", email: "invalid" }); // Validation error

    // Example 5: Chaining calls
    await getUserWithPosts(1);

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
