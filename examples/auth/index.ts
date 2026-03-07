/**
 * Authentication Flow Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Using Outcome to distinguish business vs system errors
 * - Handling authentication flows
 * - Token validation and refresh
 * - Multi-factor authentication
 */

import { fromPromise, okAsync, errAsync, success, cause, exception, ok, err } from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

interface User {
  id: number;
  email: string;
  passwordHash: string;
  mfaEnabled: boolean;
}

interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface BusinessError {
  code: string;
  message: string;
  userMessage: string;
}

interface SystemError {
  type: string;
  message: string;
  internal: boolean;
}

type AuthResult = Outcome<
  { user: User; token: AuthToken },
  BusinessError,
  SystemError
>;

// ============================================================================
// Mock Database
// ============================================================================

class UserDatabase {
  private users: Map<string, User> = new Map([
    [
      "user@example.com",
      {
        id: 1,
        email: "user@example.com",
        passwordHash: "hash123",
        mfaEnabled: false,
      },
    ],
    [
      "mfa@example.com",
      {
        id: 2,
        email: "mfa@example.com",
        passwordHash: "hash456",
        mfaEnabled: true,
      },
    ],
  ]);

  async findByEmail(email: string): Promise<User | null> {
    await delay(50);
    return this.users.get(email) || null;
  }

  async findById(id: number): Promise<User | null> {
    await delay(50);
    return Array.from(this.users.values().find((u) => u.id === id) || null);
  }
}

const db = new UserDatabase();

// ============================================================================
// Mock Services
// ============================================================================

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  await delay(100);
  return password === "correctpassword"; // Simplified
}

async function verifyMfaCode(userId: number, code: string): Promise<boolean> {
  await delay(100);
  return code === "123456"; // Simplified
}

async function generateToken(user: User): Promise<AuthToken> {
  await delay(50);
  return {
    accessToken: `access_${user.id}_${Date.now()}`,
    refreshToken: `refresh_${user.id}_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
  };
}

async function validateToken(token: string): Promise<{ userId: number } | null> {
  await delay(50);
  if (token.startsWith("access_")) {
    const userId = parseInt(token.split("_")[1]);
    return { userId };
  }
  return null;
}

async function refreshAccessToken(refreshToken: string): Promise<AuthToken | null> {
  await delay(50);
  if (refreshToken.startsWith("refresh_")) {
    const userId = parseInt(refreshToken.split("_")[1]);
    const user = await db.findById(userId);
    if (user) {
      return generateToken(user);
    }
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Example 1: Simple login with Outcome
// ============================================================================

async function login(email: string, password: string): Promise<AuthResult> {
  console.log(`\n=== Example 1: Simple Login ===`);
  console.log(`  Login attempt for: ${email}`);

  // Find user
  const userResult = await fromPromise(db.findByEmail(email));

  if (userResult.isErr() || !userResult.value) {
    console.log(`  ✗ User not found`);
    return cause({
      code: "INVALID_CREDENTIALS",
      message: "User not found",
      userMessage: "Invalid email or password",
    });
  }

  const user = userResult.value;

  // Verify password
  const passwordValid = await fromPromise(verifyPassword(password, user.passwordHash));

  if (passwordValid.isErr() || !passwordValid.value) {
    console.log(`  ✗ Invalid password`);
    return cause({
      code: "INVALID_CREDENTIALS",
      message: "Password verification failed",
      userMessage: "Invalid email or password",
    });
  }

  // Generate token
  const tokenResult = await fromPromise(generateToken(user));

  if (tokenResult.isErr()) {
    console.log(`  ✗ Token generation failed`);
    return exception({
      type: "TOKEN_SERVICE_ERROR",
      message: "Failed to generate authentication token",
      internal: true,
    });
  }

  console.log(`  ✓ Login successful for ${user.email}`);
  return success({ user, token: tokenResult.value });
}

// ============================================================================
// Example 2: Login with MFA
// ============================================================================

async function loginWithMfa(
  email: string,
  password: string,
  mfaCode?: string
): Promise<AuthResult> {
  console.log(`\n=== Example 2: Login with MFA ===`);
  console.log(`  Login attempt for: ${email}`);

  // First stage: email/password
  const userResult = await fromPromise(db.findByEmail(email));

  if (userResult.isErr() || !userResult.value) {
    return cause({
      code: "INVALID_CREDENTIALS",
      message: "User not found",
      userMessage: "Invalid email or password",
    });
  }

  const user = userResult.value;

  // Verify password
  const passwordValid = await fromPromise(verifyPassword(password, user.passwordHash));

  if (passwordValid.isErr() || !passwordValid.value) {
    return cause({
      code: "INVALID_CREDENTIALS",
      message: "Password verification failed",
      userMessage: "Invalid email or password",
    });
  }

  // Check if MFA is enabled
  if (user.mfaEnabled && !mfaCode) {
    console.log(`  ⚠ MFA required`);
    return cause({
      code: "MFA_REQUIRED",
      message: "Multi-factor authentication required",
      userMessage: "Please enter your MFA code",
    });
  }

  // Verify MFA code
  if (user.mfaEnabled && mfaCode) {
    console.log(`  Verifying MFA code...`);
    const mfaValid = await fromPromise(verifyMfaCode(user.id, mfaCode));

    if (mfaValid.isErr() || !mfaValid.value) {
      console.log(`  ✗ Invalid MFA code`);
      return cause({
        code: "INVALID_MFA",
        message: "MFA code verification failed",
        userMessage: "Invalid authentication code",
      });
    }
  }

  // Generate token
  const tokenResult = await fromPromise(generateToken(user));

  if (tokenResult.isErr()) {
    return exception({
      type: "TOKEN_SERVICE_ERROR",
      message: "Failed to generate authentication token",
      internal: true,
    });
  }

  console.log(`  ✓ Login successful with MFA`);
  return success({ user, token: tokenResult.value });
}

// ============================================================================
// Example 3: Token validation
// ============================================================================

async function validateAuthToken(token: string): Promise<Outcome<User, BusinessError, SystemError>> {
  console.log(`\n=== Example 3: Token Validation ===`);

  const validation = await fromPromise(validateToken(token));

  if (validation.isErr() || !validation.value) {
    console.log(`  ✗ Invalid token`);
    return cause({
      code: "INVALID_TOKEN",
      message: "Token validation failed",
      userMessage: "Please log in again",
    });
  }

  const { userId } = validation.value;

  // Load user
  const userResult = await fromPromise(db.findById(userId));

  if (userResult.isErr() || !userResult.value) {
    console.log(`  ✗ User not found (may have been deleted)`);
    return cause({
      code: "USER_NOT_FOUND",
      message: "User associated with token not found",
      userMessage: "Please log in again",
    });
  }

  console.log(`  ✓ Token valid for ${userResult.value.email}`);
  return success(userResult.value);
}

// ============================================================================
// Example 4: Token refresh
// ============================================================================

async function refreshAuthToken(
  refreshToken: string
): Promise<Outcome<AuthToken, BusinessError, SystemError>> {
  console.log(`\n=== Example 4: Token Refresh ===`);

  const newToken = await fromPromise(refreshAccessToken(refreshToken));

  if (newToken.isErr() || !newToken.value) {
    console.log(`  ✗ Invalid refresh token`);
    return cause({
      code: "INVALID_REFRESH_TOKEN",
      message: "Refresh token is invalid or expired",
      userMessage: "Please log in again",
    });
  }

  console.log(`  ✓ Token refreshed successfully`);
  return success(newToken.value);
}

// ============================================================================
// Example 5: Complete auth flow with error handling
// ============================================================================

async function completeAuthFlow() {
  console.log(`\n=== Example 5: Complete Auth Flow ===`);

  // Scenario 1: Successful login
  console.log(`\n  Scenario 1: Successful login`);
  const result1 = await login("user@example.com", "correctpassword");
  if (result1.isSuccess()) {
    console.log(`    ✓ User authenticated: ${result1.value.user.email}`);
  } else if (result1.isCause()) {
    console.log(`    ✗ Business error: ${result1.value.userMessage}`);
  } else if (result1.isException()) {
    console.log(`    ✗ System error: ${result1.value.message}`);
  }

  // Scenario 2: Invalid credentials
  console.log(`\n  Scenario 2: Invalid credentials`);
  const result2 = await login("user@example.com", "wrongpassword");
  if (result2.isCause()) {
    console.log(`    ✗ ${result2.value.userMessage}`);
  }

  // Scenario 3: User not found
  console.log(`\n  Scenario 3: User not found`);
  const result3 = await login("nonexistent@example.com", "password");
  if (result3.isCause()) {
    console.log(`    ✗ ${result3.value.userMessage}`);
  }

  // Scenario 4: MFA login
  console.log(`\n  Scenario 4: MFA login`);
  const result4a = await loginWithMfa("mfa@example.com", "correctpassword");
  if (result4a.isCause() && result4a.value.code === "MFA_REQUIRED") {
    console.log(`    ⚠ ${result4a.value.userMessage}`);

    const result4b = await loginWithMfa("mfa@example.com", "correctpassword", "123456");
    if (result4b.isSuccess()) {
      console.log(`    ✓ MFA verified, user logged in`);
    }
  }

  // Scenario 5: Token validation
  console.log(`\n  Scenario 5: Token validation`);
  const authResult = await login("user@example.com", "correctpassword");
  if (authResult.isSuccess()) {
    const token = authResult.value.token.accessToken;
    const validation = await validateAuthToken(token);
    if (validation.isSuccess()) {
      console.log(`    ✓ Token is valid`);
    }
  }
}

// ============================================================================
// Run all examples
// ============================================================================

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Authentication Flow with @deessejs/core                 ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Example 1: Simple login
    await login("user@example.com", "correctpassword");
    await login("user@example.com", "wrongpassword");

    // Example 2: MFA login
    await loginWithMfa("mfa@example.com", "correctpassword");
    await loginWithMfa("mfa@example.com", "correctpassword", "123456");

    // Example 3: Token validation
    const authResult = await login("user@example.com", "correctpassword");
    if (authResult.isSuccess()) {
      await validateAuthToken(authResult.value.token.accessToken);
      await validateAuthToken("invalid_token");
    }

    // Example 4: Token refresh
    if (authResult.isSuccess()) {
      await refreshAuthToken(authResult.value.token.refreshToken);
      await refreshAuthToken("invalid_refresh_token");
    }

    // Example 5: Complete flow
    await completeAuthFlow();

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
