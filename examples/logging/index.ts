/**
 * Logger with Side Effects Example
 *
 * This example demonstrates how to use @deessejs/fp for:
 * - Using tap for side effects in pipelines
 * - Using tapErr for error logging
 * - Building observability into data pipelines
 * - Timing and monitoring operations
 */

import { ok, err, fromPromise } from "@deessejs/fp";

// ============================================================================
// Types
// ============================================================================

type User = {
  id: number;
  name: string;
  email: string;
};

type ProcessedUser = {
  id: number;
  name: string;
  email: string;
  normalizedEmail: string;
};

type ValidationError = {
  field: string;
  code: string;
  message: string;
};

// ============================================================================
// Logger utility
// ============================================================================

const logger = {
  log: (level: string, message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level}: ${message}`);
    if (data) {
      console.log(`  Data:`, JSON.stringify(data, null, 2));
    }
  },

  info: (message: string, data?: unknown) => {
    logger.log("INFO", message, data);
  },

  error: (message: string, data?: unknown) => {
    logger.log("ERROR", message, data);
  },

  warn: (message: string, data?: unknown) => {
    logger.log("WARN", message, data);
  },

  debug: (message: string, data?: unknown) => {
    logger.log("DEBUG", message, data);
  },
};

// ============================================================================
// Timer utility
// ============================================================================

type Timer = {
  start: number;
  label: string;
  elapsed: () => number;
  end: () => number;
};

const createTimer = (label: string): Timer => {
  const start = Date.now();
  return {
    get start() { return start; },
    get label() { return label; },
    elapsed: () => Date.now() - start,
    end: () => {
      const elapsed = Date.now() - start;
      logger.debug(`${label} took ${elapsed}ms`);
      return elapsed;
    },
  };
};

// ============================================================================
// Example 1: Basic tap for logging
// ============================================================================

const basicTapExample = () => {
  console.log("\n=== Example 1: Basic tap for Logging ===");

  const result = ok(42)
    .tap((value) => {
      logger.info(`Processing value: ${value}`);
    })
    .map((value) => value * 2)
    .tap((value) => {
      logger.info(`Doubled value: ${value}`);
    });

  console.log(`✓ Final result: ${result.value}`);
}

// ============================================================================
// Example 2: tapErr for error logging
// ============================================================================

const tapErrExample = () => {
  console.log("\n=== Example 2: tapErr for Error Logging ===");

  const result = ok("user@example.com")
    .map((email) => {
      if (!email.includes("@")) {
        return err<ValidationError>({
          field: "email",
          code: "INVALID_FORMAT",
          message: "Email must contain @",
        });
      }
      return ok(email);
    })
    .tapErr((error) => {
      logger.error(`Validation failed: ${error.message}`, error);
    })
    .map((email) => email.toLowerCase());

  if (result.isOk()) {
    console.log(`✓ Validated: ${result.value}`);
  } else {
    console.log(`✗ Validation failed`);
  }
}

// ============================================================================
// Example 3: Pipeline with observability
// ============================================================================

const validateUser = (user: any): Result<User, ValidationError> => {
  return ok(user)
    .tap(() => logger.info("Starting user validation"))
    .flatMap((data) =>
      typeof data.name === "string" && data.name.length >= 2
        ? ok(data)
        : err({ field: "name", code: "TOO_SHORT", message: "Name too short" })
    )
    .tap(() => logger.debug("Name validated"))
    .flatMap((data) =>
      typeof data.email === "string" && data.email.includes("@")
        ? ok(data)
        : err({ field: "email", code: "INVALID", message: "Invalid email" })
    )
    .tap(() => logger.debug("Email validated"))
    .tapErr((error) => logger.error(`Validation error in ${error.field}`, error));
}

const processUserWithLogging = (user: any): Result<ProcessedUser, ValidationError> => {
  const timer = createTimer("User processing");

  return ok(user)
    .tap(() => logger.info("Processing user", { id: user.id }))
    .flatMap(() => validateUser(user))
    .map((validated) => ({
      ...validated,
      normalizedEmail: validated.email.toLowerCase(),
    }))
    .tap((processed) => logger.info("User processed successfully", { id: processed.id }))
    .tapErr((error) => logger.error("User processing failed", error))
    .tap(() => timer.end());
}

// ============================================================================
// Example 4: Timing async operations
// ============================================================================

const timingAsyncOperations = async () => {
  console.log("\n=== Example 4: Timing Async Operations ===");

  const timer = createTimer("API call");

  const result = await fromPromise(
    new Promise((resolve) => setTimeout(resolve, 100, "API response"))
  )
    .tap(() => logger.debug("API call started"))
    .map((response) => JSON.parse(`{"data":"${response}"}`))
    .tap(() => logger.debug("Response parsed"))
    .tapErr((error) => logger.error("Async operation failed", error))
    .tap(() => timer.end());

  console.log(`✓ Result: ${JSON.stringify(result.value)}`);
}

// ============================================================================
// Example 5: Request logging pipeline
// ============================================================================

type RequestContext = {
  requestId: string;
  userId?: number;
  path: string;
  method: string;
};

const handleRequest = async (
  request: RequestContext
): Promise<Result<{ status: number; body: any }, Error>> {
  const requestId = request.requestId;

  return ok(request)
    .tap((req) =>
      logger.info(`[req:${requestId}] ${req.method} ${req.path}`, {
        userId: req.userId,
      })
    )
    .tap(() => logger.debug(`[req:${requestId}] Authenticating...`))
    .flatMap((req) => {
      // Simulate auth
      if (!req.userId) {
        return err(Error("Unauthorized"));
      }
      return ok(req);
    })
    .tap(() => logger.debug(`[req:${requestId}] Loading data...`))
    .flatMap(() => fromPromise(loadData(requestId)))
    .tap((data) => logger.debug(`[req:${requestId}] Data loaded`, { items: data.length }))
    .map((data) => ({
      status: 200,
      body: { data },
    }))
    .tap((response) => logger.info(`[req:${requestId}] Response: ${response.status}`))
    .tapErr((error) => logger.error(`[req:${requestId}] Request failed`, { error: error.message }));
}

const loadData = async (requestId: string): Promise<any[]> => {
  // Simulate data loading
  await new Promise((resolve) => setTimeout(resolve, 50));
  return [{ id: 1, name: "Item 1" }];
}

// ============================================================================
// Example 6: Metrics collection
// ============================================================================

const metrics = {
  counters: {} as Record<string, number>,
  timers: {} as Record<string, number[]>,

  increment: (name: string) => {
    metrics.counters[name] = (metrics.counters[name] || 0) + 1;
  },

  time: (name: string, duration: number) => {
    if (!metrics.timers[name]) {
      metrics.timers[name] = [];
    }
    metrics.timers[name].push(duration);
  },

  report: () => {
    console.log("\n  === Metrics Report ===");
    console.log("  Counters:", metrics.counters);
    console.log(
      "  Timers:",
      Object.fromEntries(
        Object.entries(metrics.timers).map(([name, values]) => [
          name,
          {
            count: values.length,
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
          },
        ])
      )
    );
  },
};

const operationWithMetrics = async (userId: number) => {
  const timer = createTimer("databaseQuery");

  metrics.increment("queries.total");

  const result = await fromPromise(
    new Promise((resolve) => setTimeout(resolve, 100, { id: userId, name: "User" }))
  )
    .tap(() => metrics.increment("queries.success"))
    .tapErr(() => metrics.increment("queries.error"))
    .tap(() => metrics.time("databaseQuery", timer.end()));

  return result;
}

const metricsExample = async () => {
  console.log("\n=== Example 6: Metrics Collection ===");

  await operationWithMetrics(1);
  await operationWithMetrics(2);
  await operationWithMetrics(3);

  metrics.report();
}

// ============================================================================
// Run all examples
// ============================================================================

const main = async () => {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Logger with Side Effects using @deessejs/fp            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Example 1: Basic tap
    basicTapExample();

    // Example 2: tapErr
    tapErrExample();

    // Example 3: Pipeline with observability
    const user = { id: 1, name: "Alice", email: "ALICE@EXAMPLE.COM" };
    const processed = processUserWithLogging(user);

    // Example 4: Timing async
    await timingAsyncOperations();

    // Example 5: Request logging
    await handleRequest({
      requestId: "req-123",
      userId: 1,
      path: "/api/users",
      method: "GET",
    });

    // Example 6: Metrics
    await metricsExample();

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
