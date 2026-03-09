/**
 * Rate Limiting & Timeouts Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Implementing retry logic with different backoff strategies
 * - Adding timeout constraints to operations
 * - Rate limiting with sleep
 * - Building resilient API clients
 */

import { sleep, withTimeout, retryAsync, retry, fromPromise } from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

type ApiError = {
  type: "TIMEOUT" | "NETWORK" | "SERVER";
  message: string;
  attempt?: number;
};

// ============================================================================
// Mock API
// ============================================================================

const unreliableApi = async (delay: number, failureRate: number = 0): Promise<string> => {
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (Math.random() < failureRate) {
    throw new Error("API request failed");
  }

  return "API response data";
}

const slowApi = async (minDelay: number, maxDelay: number): Promise<string> => {
  const delay = minDelay + Math.random() * (maxDelay - minDelay);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return "Slow response";
}

// ============================================================================
// Example 1: Simple sleep/delay
// ============================================================================

const demonstrateSleep = async () => {
  console.log("\n=== Example 1: Sleep/Delay ===");

  console.log("  Starting task...");
  await sleep(1000);
  console.log("  ✓ Task completed after 1 second");

  console.log("  Starting another task...");
  await sleep(500);
  console.log("  ✓ Task completed after 500ms");
}

// ============================================================================
// Example 2: Timeout with withTimeout
// ============================================================================

const demonstrateTimeout = async () => {
  console.log("\n=== Example 2: Timeout ===");

  // Fast operation (completes within timeout)
  console.log("  Fast operation (2s, timeout 5s)...");
  const fastResult = await fromPromise(
    withTimeout(slowApi(2000, 2000), 5000, {
      message: "Operation timed out",
      name: "TIMEOUT",
    })
  );

  if (fastResult.isOk()) {
    console.log(`  ✓ Completed: ${fastResult.value}`);
  }

  // Slow operation (times out)
  console.log("  Slow operation (3s, timeout 1s)...");
  const slowResult = await fromPromise(
    withTimeout(slowApi(3000, 3000), 1000, {
      message: "Operation timed out",
      name: "TIMEOUT",
    })
  );

  if (slowResult.isErr()) {
    console.log(`  ✗ ${slowResult.error.message}`);
  }
}

// ============================================================================
// Example 3: Retry with exponential backoff
// ============================================================================

const demonstrateExponentialRetry = async () => {
  console.log("\n=== Example 3: Exponential Backoff Retry ===");

  let attemptCount = 0;

  const result = await retryAsync(
    () => {
      attemptCount++;
      console.log(`  Attempt ${attemptCount}...`);
      return fromPromise(unreliableApi(100, 0.5)); // 50% failure rate
    },
    {
      attempts: 5,
      delay: 500,
      backoff: "exponential",
      jitter: true,
      onRetry: (error, attempt) => {
        console.log(`    ↻ Retry ${attempt} after error: ${error.message}`);
      },
    }
  );

  if (result.isOk()) {
    console.log(`  ✓ Success after ${attemptCount} attempts: ${result.value}`);
  } else {
    console.log(`  ✗ Failed after ${attemptCount} attempts`);
  }
}

// ============================================================================
// Example 4: Retry with linear backoff
// ============================================================================

const demonstrateLinearRetry = async () => {
  console.log("\n=== Example 4: Linear Backoff Retry ===");

  let attemptCount = 0;

  const result = await retryAsync(
    () => {
      attemptCount++;
      console.log(`  Attempt ${attemptCount}...`);
      return fromPromise(unreliableApi(100, 0.6)); // 60% failure rate
    },
    {
      attempts: 4,
      delay: 300,
      backoff: "linear",
      onRetry: (error, attempt) => {
        console.log(`    ↻ Retry ${attempt} (delay: ${300 * attempt}ms)`);
      },
    }
  );

  if (result.isOk()) {
    console.log(`  ✓ Success: ${result.value}`);
  } else {
    console.log(`  ✗ Failed`);
  }
}

// ============================================================================
// Example 5: Retry with predicate (conditional retry)
// ============================================================================

const demonstrateConditionalRetry = async () => {
  console.log("\n=== Example 5: Conditional Retry ===");

  class TransientError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TransientError";
    }
  }

  class PermanentError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "PermanentError";
    }
  }

  let attemptCount = 0;

  const result = await retryAsync(
    () => {
      attemptCount++;
      console.log(`  Attempt ${attemptCount}...`);

      const random = Math.random();
      if (random < 0.3) throw new TransientError("Connection reset");
      if (random < 0.5) throw new PermanentError("Invalid data");

      return fromPromise(Promise.resolve("Success"));
    },
    {
      attempts: 5,
      delay: 500,
      predicate: (error) => {
        // Only retry transient errors
        const shouldRetry = error instanceof TransientError;
        console.log(`    ${shouldRetry ? "↻ Will retry" : "✗ Won't retry"}: ${error.message}`);
        return shouldRetry;
      },
    }
  );

  if (result.isOk()) {
    console.log(`  ✓ Success`);
  } else {
    console.log(`  ✗ Failed: ${result.error.message}`);
  }
}

// ============================================================================
// Example 6: Cancellable timeout
// ============================================================================

const demonstrateCancellableTimeout = async () => {
  console.log("\n=== Example 6: Cancellable Timeout ===");

  const controller = new AbortController();

  // Start a long operation with timeout
  const operation = fromPromise(
    withTimeout(
      new Promise((resolve) => setTimeout(resolve, 5000, "Done")),
      10000,
      {
        message: "Operation timed out",
        signal: controller.signal,
      }
    )
  );

  // Cancel after 2 seconds
  console.log("  Starting operation (will cancel in 2s)...");
  setTimeout(() => {
    console.log("  Cancelling operation...");
    controller.abort();
  }, 2000);

  const result = await operation;

  if (result.isErr()) {
    console.log(`  ✗ ${result.error.message}`);
  }
}

// ============================================================================
// Example 7: Rate limiting
// ============================================================================

const demonstrateRateLimiting = async () => {
  console.log("\n=== Example 7: Rate Limiting ===");

  const requests = [1, 2, 3, 4, 5];

  for (const id of requests) {
    console.log(`  Processing request ${id}...`);
    await fromPromise(unreliableApi(100, 0));
    console.log(`    ✓ Request ${id} completed`);

    // Rate limit: wait 500ms between requests
    if (id < requests.length) {
      console.log(`    Waiting 500ms before next request...`);
      await sleep(500);
    }
  }

  console.log("  ✓ All requests completed");
}

// ============================================================================
// Example 8: Building a resilient API client
// ============================================================================

class ResilientApiClient {
  async get(endpoint: string): Promise<Result<string, ApiError>> {
    console.log(`\n  API Client: GET ${endpoint}`);

    return retryAsync(
      () =>
        fromPromise(
          withTimeout(unreliableApi(500, 0.4), 3000, {
            message: "Request timeout",
            name: "TIMEOUT",
          })
        ).mapErr((error): ApiError => {
          if (error.message.includes("timeout")) {
            return {
              type: "TIMEOUT",
              message: error.message,
            };
          }
          return {
            type: "NETWORK",
            message: error.message,
          };
        }),
      {
        attempts: 3,
        delay: 1000,
        backoff: "exponential",
        jitter: true,
        onRetry: (error, attempt) => {
          console.log(`    ↻ Retry ${attempt} for ${endpoint}`);
        },
      }
    );
  }
}

const demonstrateApiClient = async () => {
  console.log("\n=== Example 8: Resilient API Client ===");

  const client = new ResilientApiClient();

  const result1 = await client.get("/users/1");
  if (result1.isOk()) {
    console.log(`  ✓ ${result1.value}`);
  }

  const result2 = await client.get("/posts");
  if (result2.isOk()) {
    console.log(`  ✓ ${result2.value}`);
  }
}

// ============================================================================
// Run all examples
// ============================================================================

const main = async () => {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Rate Limiting & Timeouts with @deessejs/core             ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    await demonstrateSleep();
    await demonstrateTimeout();
    await demonstrateExponentialRetry();
    await demonstrateLinearRetry();
    await demonstrateConditionalRetry();
    await demonstrateCancellableTimeout();
    await demonstrateRateLimiting();
    await demonstrateApiClient();

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
