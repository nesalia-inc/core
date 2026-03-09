/**
 * Environment Configuration Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Handling optional environment variables with Maybe
 * - Validating required configuration with Result
 * - Providing sensible defaults for missing values
 * - Type-safe configuration loading
 */

import {
  some,
  none,
  fromNullable,
  ok,
  err,
  toResult,
} from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

type DatabaseConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

type ServerConfig = {
  port: number;
  host: string;
  nodeEnv: "development" | "production" | "test";
}

type FeatureFlags = {
  newDashboard: boolean;
  betaFeatures: boolean;
  debugMode: boolean;
}

type AppConfig = {
  database: DatabaseConfig;
  server: ServerConfig;
  features: FeatureFlags;
}

// ============================================================================
// Helper: Parse environment variables with Maybe
// ============================================================================

const getEnvVar = (key: string): ReturnType<typeof fromNullable<string>> => {
  return fromNullable(process.env[key]);
}

const getEnvVarInt = (key: string): ReturnType<typeof fromNullable<number>> => {
  return fromNullable(process.env[key]).flatMap((value) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      return none();
    }
    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? none() : some(parsed);
  });
}

const getEnvVarBoolean = (key: string): ReturnType<typeof fromNullable<boolean>> => {
  return fromNullable(process.env[key]).map((value) =>
    value.toLowerCase() === "true"
  );
}

// ============================================================================
// Example 1: Optional configuration with Maybe
// ============================================================================

const loadOptionalConfig = () => {
  console.log("\n=== Example 1: Optional Configuration ===");

  // Optional API key (may or may not be present)
  const apiKey = getEnvVar("API_KEY");

  apiKey.match(
    (key) => console.log(`✓ API Key configured: ${key.slice(0, 4)}...`),
    () => console.log("⚠ No API key provided, using anonymous mode")
  );

  // Optional feature flag with default
  const debugMode = getEnvVarBoolean("DEBUG_MODE").getOrElse(false);

  console.log(`✓ Debug mode: ${debugMode ? "enabled" : "disabled"}`);

  // Optional port with default
  const port = getEnvVarInt("SERVICE_PORT").getOrElse(3000);

  console.log(`✓ Service port: ${port}`);

  return { apiKey: apiKey.toUndefined(), debugMode, port };
}

// ============================================================================
// Example 2: Required configuration with Result
// ============================================================================

const loadRequiredConfig = () => {
  console.log("\n=== Example 2: Required Configuration ===");

  // Database configuration (all fields required)
  const dbConfig = getEnvVar("DB_HOST")
    .flatMap((host) =>
      getEnvVarInt("DB_PORT").map((port) => ({ host, port }))
    )
    .flatMap((config) =>
      getEnvVar("DB_USER").map((username) => ({ ...config, username }))
    )
    .flatMap((config) =>
      getEnvVar("DB_PASS").map((password) => ({ ...config, password }))
    )
    .flatMap((config) =>
      getEnvVar("DB_NAME").map((database) => ({ ...config, database }))
    )
    .toResult({
      type: "MISSING_CONFIG",
      message: "Required database configuration is missing",
    });

  return dbConfig.match(
    (config) => {
      console.log("✓ Database configuration loaded:");
      console.log(`  Host: ${config.host}`);
      console.log(`  Port: ${config.port}`);
      console.log(`  Database: ${config.database}`);
      console.log(`  User: ${config.username}`);
      return config;
    },
    (error) => {
      console.log(`✗ Configuration error: ${error.message}`);
      throw error;
    }
  );
}

// ============================================================================
// Example 3: Mixed required and optional fields
// ============================================================================

const loadServerConfig = () => {
  console.log("\n=== Example 3: Mixed Required and Optional ===");

  const nodeEnv = getEnvVar("NODE_ENV")
    .map((env): "development" | "production" | "test" => {
      if (env === "production") return "production";
      if (env === "test") return "test";
      return "development";
    })
    .getOrElse("development");

  const port = getEnvVarInt("SERVER_PORT").getOrElse(3000);

  const host = getEnvVar("SERVER_HOST").getOrElse("0.0.0.0");

  const config: ServerConfig = {
    port,
    host,
    nodeEnv,
  };

  console.log("✓ Server configuration:");
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);

  return config;
}

// ============================================================================
// Example 4: Feature flags with defaults
// ============================================================================

const loadFeatureFlags = () => {
  console.log("\n=== Example 4: Feature Flags ===");

  const features: FeatureFlags = {
    newDashboard: getEnvVarBoolean("FEATURE_NEW_DASHBOARD").getOrElse(false),
    betaFeatures: getEnvVarBoolean("FEATURE_BETA").getOrElse(false),
    debugMode: getEnvVarBoolean("DEBUG").getOrElse(false),
  };

  console.log("✓ Feature flags:");
  console.log(`  New Dashboard: ${features.newDashboard ? "enabled" : "disabled"}`);
  console.log(`  Beta Features: ${features.betaFeatures ? "enabled" : "disabled"}`);
  console.log(`  Debug Mode: ${features.debugMode ? "enabled" : "disabled"}`);

  return features;
}

// ============================================================================
// Example 5: Complete application configuration
// ============================================================================

const loadAppConfig = (): Result<AppConfig, Error> => {
  console.log("\n=== Example 5: Complete App Configuration ===");

  // Load all configuration sections
  const dbResult = ok({})
    .flatMap(() =>
      getEnvVar("DB_HOST").toResult(
        new Error("DB_HOST is required")
      )
    )
    .flatMap((host) =>
      getEnvVarInt("DB_PORT")
        .toResult(new Error("DB_PORT is required"))
        .map((port) => ({ host, port }))
    )
    .flatMap((config) =>
      getEnvVar("DB_USER")
        .toResult(new Error("DB_USER is required"))
        .map((username) => ({ ...config, username }))
    )
    .flatMap((config) =>
      getEnvVar("DB_PASS")
        .toResult(new Error("DB_PASS is required"))
        .map((password) => ({ ...config, password }))
    )
    .flatMap((config) =>
      getEnvVar("DB_NAME")
        .toResult(new Error("DB_NAME is required"))
        .map((database) => ({ ...config, database }))
    );

  if (dbResult.isErr()) {
    return err(dbResult.error);
  }

  const server: ServerConfig = {
    port: getEnvVarInt("PORT").getOrElse(3000),
    host: getEnvVar("HOST").getOrElse("0.0.0.0"),
    nodeEnv: getEnvVar("NODE_ENV")
      .map((env): "development" | "production" | "test" => {
        if (env === "production") return "production";
        if (env === "test") return "test";
        return "development";
      })
      .getOrElse("development"),
  };

  const features: FeatureFlags = {
    newDashboard: getEnvVarBoolean("FEATURE_NEW_DASHBOARD").getOrElse(false),
    betaFeatures: getEnvVarBoolean("FEATURE_BETA").getOrElse(false),
    debugMode: getEnvVarBoolean("DEBUG").getOrElse(false),
  };

  return ok({
    database: dbResult.value,
    server,
    features,
  });
}

// ============================================================================
// Run all examples
// ============================================================================

const main = async () => {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Environment Configuration with @deessejs/core           ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  // Note: These examples work with actual environment variables
  // For demonstration, we show the patterns

  try {
    // Example 1: Optional config
    loadOptionalConfig();

    // Example 2: Required config (will fail if env vars not set)
    try {
      loadRequiredConfig();
    } catch (e) {
      console.log("  (Skipped - requires DB_* environment variables)");
    }

    // Example 3: Mixed config
    loadServerConfig();

    // Example 4: Feature flags
    loadFeatureFlags();

    // Example 5: Complete config
    const appConfigResult = loadAppConfig();
    if (appConfigResult.isErr()) {
      console.log("\n⚠ App configuration incomplete (expected in demo)");
      console.log("  Set the required environment variables to see full config");
    } else {
      console.log("\n✓ Application configuration loaded successfully!");
    }

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   Examples completed                                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
