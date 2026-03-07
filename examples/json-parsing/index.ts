/**
 * Safe JSON Parsing Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Safe JSON parsing with Try/attempt
 * - Schema validation after parsing
 * - Handling malformed JSON gracefully
 * - Parsing configuration files
 */

import { attempt, ok, err } from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

interface UserConfig {
  name: string;
  email: string;
  preferences: {
    theme: "light" | "dark";
    notifications: boolean;
  };
}

interface ApiResponse {
  data: {
    users: Array<{
      id: number;
      name: string;
    }>;
  };
  meta: {
    total: number;
    page: number;
  };
}

interface ParseError {
  type: "INVALID_JSON" | "INVALID_SCHEMA" | "MISSING_FIELD";
  message: string;
}

// ============================================================================
// Example 1: Basic JSON parsing
// ============================================================================

function parseJsonString(jsonString: string): Result<any, ParseError> {
  console.log(`\n=== Example 1: Basic JSON Parsing ===`);
  console.log(`Parsing: "${jsonString}"`);

  return attempt(() => JSON.parse(jsonString))
    .mapErr((error): ParseError => ({
      type: "INVALID_JSON",
      message: `Failed to parse JSON: ${error.message}`,
    }))
    .match(
      (data) => {
        console.log(`✓ Parsed successfully:`, JSON.stringify(data));
        return ok(data);
      },
      (error) => {
        console.log(`✗ ${error.message}`);
        return err(error);
      }
    );
}

// ============================================================================
// Example 2: Parse and validate schema
// ============================================================================

function parseAndValidateConfig(jsonString: string): Result<UserConfig, ParseError> {
  console.log(`\n=== Example 2: Parse and Validate Config ===`);

  return attempt(() => JSON.parse(jsonString) as UserConfig)
    .mapErr((error): ParseError => ({
      type: "INVALID_JSON",
      message: `Invalid JSON: ${error.message}`,
    }))
    .flatMap((data) => validateUserConfig(data));
}

function validateUserConfig(data: any): Result<UserConfig, ParseError> {
  // Check required fields
  if (typeof data.name !== "string") {
    return err({
      type: "MISSING_FIELD",
      message: "Missing or invalid 'name' field",
    });
  }

  if (typeof data.email !== "string") {
    return err({
      type: "MISSING_FIELD",
      message: "Missing or invalid 'email' field",
    });
  }

  if (!data.preferences || typeof data.preferences !== "object") {
    return err({
      type: "MISSING_FIELD",
      message: "Missing 'preferences' object",
    });
  }

  const validThemes = ["light", "dark"];
  if (!validThemes.includes(data.preferences.theme)) {
    return err({
      type: "INVALID_SCHEMA",
      message: `Invalid theme. Must be one of: ${validThemes.join(", ")}`,
    });
  }

  if (typeof data.preferences.notifications !== "boolean") {
    return err({
      type: "INVALID_SCHEMA",
      message: "'preferences.notifications' must be a boolean",
    });
  }

  return ok(data as UserConfig);
}

// ============================================================================
// Example 3: Parse with default values
// ============================================================================

function parseConfigWithDefaults(jsonString: string): UserConfig {
  console.log(`\n=== Example 3: Parse with Defaults ===`);

  const defaultConfig: UserConfig = {
    name: "Guest",
    email: "guest@example.com",
    preferences: {
      theme: "light",
      notifications: true,
    },
  };

  return attempt(() => JSON.parse(jsonString) as Partial<UserConfig>)
    .map((parsed) => {
      // Merge with defaults
      return {
        name: parsed.name ?? defaultConfig.name,
        email: parsed.email ?? defaultConfig.email,
        preferences: {
          theme: parsed.preferences?.theme ?? defaultConfig.preferences.theme,
          notifications:
            parsed.preferences?.notifications ?? defaultConfig.preferences.notifications,
        },
      };
    })
    .mapErr((error) => {
      console.log(`✗ Parse failed, using defaults: ${error.message}`);
      throw error;
    })
    .getOrElse(defaultConfig);
}

// ============================================================================
// Example 4: Parse API response
// ============================================================================

function parseApiResponse(jsonString: string): Result<ApiResponse, ParseError> {
  console.log(`\n=== Example 4: Parse API Response ===`);

  return attempt(() => JSON.parse(jsonString) as ApiResponse)
    .mapErr((error): ParseError => ({
      type: "INVALID_JSON",
      message: `Invalid API response: ${error.message}`,
    }))
    .flatMap((response) => validateApiResponse(response));
}

function validateApiResponse(response: any): Result<ApiResponse, ParseError> {
  if (!response.data || !Array.isArray(response.data.users)) {
    return err({
      type: "INVALID_SCHEMA",
      message: "Invalid API response structure: missing data.users array",
    });
  }

  if (!response.meta || typeof response.meta.total !== "number") {
    return err({
      type: "INVALID_SCHEMA",
      message: "Invalid API response structure: missing meta.total",
    });
  }

  return ok(response as ApiResponse);
}

// ============================================================================
// Example 5: Safe parsing of nested data
// ============================================================================

interface UserProfile {
  id: number;
  profile: {
    name: string;
    contact: {
      email: string;
      phone?: string;
    };
  };
}

function parseNestedData(jsonString: string): Result<UserProfile, ParseError> {
  console.log(`\n=== Example 5: Parse Nested Data ===`);

  return attempt(() => JSON.parse(jsonString) as UserProfile)
    .mapErr((error): ParseError => ({
      type: "INVALID_JSON",
      message: `Invalid JSON: ${error.message}`,
    }))
    .flatMap((data) => {
      // Safely access nested properties
      const id = data.id;
      if (typeof id !== "number") {
        return err({
          type: "MISSING_FIELD",
          message: "Missing or invalid 'id' field",
        });
      }

      const name = data.profile?.name;
      if (!name || typeof name !== "string") {
        return err({
          type: "MISSING_FIELD",
          message: "Missing profile.name",
        });
      }

      const email = data.profile?.contact?.email;
      if (!email || typeof email !== "string") {
        return err({
          type: "MISSING_FIELD",
          message: "Missing profile.contact.email",
        });
      }

      return ok(data);
    });
}

// ============================================================================
// Example 6: Parse array of items
// ============================================================================

function parseUserArray(jsonString: string): Result<Array<{ id: number; name: string }>, ParseError> {
  console.log(`\n=== Example 6: Parse Array of Items ===`);

  return attempt(() => JSON.parse(jsonString) as unknown[])
    .mapErr((error): ParseError => ({
      type: "INVALID_JSON",
      message: `Invalid JSON: ${error.message}`,
    }))
    .flatMap((items) => {
      if (!Array.isArray(items)) {
        return err({
          type: "INVALID_SCHEMA",
          message: "Expected an array",
        });
      }

      // Validate each item
      const validatedItems: Array<{ id: number; name: string }> = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (typeof item?.id !== "number") {
          return err({
            type: "INVALID_SCHEMA",
            message: `Item at index ${i} has missing or invalid 'id'`,
          });
        }

        if (typeof item?.name !== "string") {
          return err({
            type: "INVALID_SCHEMA",
            message: `Item at index ${i} has missing or invalid 'name'`,
          });
        }

        validatedItems.push({ id: item.id, name: item.name });
      }

      return ok(validatedItems);
    });
}

// ============================================================================
// Run all examples
// ============================================================================

function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Safe JSON Parsing with @deessejs/core                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Example 1: Basic parsing
    parseJsonString('{"name": "Alice", "age": 30}');
    parseJsonString("invalid json");

    // Example 2: Config parsing with validation
    const validConfig = JSON.stringify({
      name: "Alice",
      email: "alice@example.com",
      preferences: {
        theme: "dark",
        notifications: true,
      },
    });

    const result1 = parseAndValidateConfig(validConfig);
    if (result1.isOk()) {
      console.log("✓ Config validated:", result1.value.name);
    }

    const invalidConfig = JSON.stringify({
      name: "Bob",
      // Missing email field
    });

    const result2 = parseAndValidateConfig(invalidConfig);
    if (result2.isErr()) {
      console.log("✗", result2.error.message);
    }

    // Example 3: Parse with defaults
    const partialConfig = JSON.stringify({
      name: "Charlie",
    });
    const configWithDefaults = parseConfigWithDefaults(partialConfig);
    console.log("✓ Config with defaults:", configWithDefaults);

    // Example 4: API response
    const apiResponse = JSON.stringify({
      data: {
        users: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
      },
      meta: {
        total: 2,
        page: 1,
      },
    });

    const result3 = parseApiResponse(apiResponse);
    if (result3.isOk()) {
      console.log("✓ API response parsed:", result3.value.data.users.length, "users");
    }

    // Example 5: Nested data
    const nestedData = JSON.stringify({
      id: 1,
      profile: {
        name: "Alice",
        contact: {
          email: "alice@example.com",
          phone: "555-1234",
        },
      },
    });

    const result4 = parseNestedData(nestedData);
    if (result4.isOk()) {
      console.log("✓ Nested data parsed:", result4.value.profile.contact.email);
    }

    // Example 6: Array parsing
    const userArray = JSON.stringify([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ]);

    const result5 = parseUserArray(userArray);
    if (result5.isOk()) {
      console.log("✓ Array parsed:", result5.value.length, "users");
    }

    const invalidArray = JSON.stringify([
      { id: 1, name: "Alice" },
      { id: "invalid" }, // Invalid: name is missing
    ]);

    const result6 = parseUserArray(invalidArray);
    if (result6.isErr()) {
      console.log("✗", result6.error.message);
    }

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main();
