/**
 * Authentication Flow Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Using Result with Error type for structured errors
 * - Handling authentication flows
 * - Token validation and refresh
 * - Multi-factor authentication
 */

import { fromPromise, okAsync, errAsync, ok, err, some, none, Maybe, error, isError, Error as DeeError } from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

type User = {
  id: number;
  email: string;
  passwordHash: string;
  mfaEnabled: boolean;
};

type AuthToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

type AuthError = DeeError<{
  code: string;
  userMessage: string;
}>;

// ============================================================================
// Mock Database
// ============================================================================

const userDatabase = {
  users: new Map<string, User>([
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
  ]),

  findByEmail: async (email: string): Promise<Maybe<User>> => {
    await delay(50);
    const user = userDatabase.users.get(email);
    return user ? some(user) : none();
  },

  findById: async (id: number): Promise<Maybe<User>> => {
    await delay(50);
    const user = Array.from(userDatabase.users.values()).find((u) => u.id === id);
    return user ? some(user) : none();
  },
};

const db = userDatabase;

// ============================================================================
// Mock Services
// ============================================================================

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  await delay(100);
  return password === "correctpassword"; // Simplified
};

const verifyMfaCode = async (userId: number, code: string): Promise<boolean> => {
  await delay(100);
  return code === "123456"; // Simplified
};

const generateToken = async (user: User): Promise<AuthToken> => {
  await delay(50);
  return {
    accessToken: `access_${user.id}_${Date.now()}`,
    refreshToken: `refresh_${user.id}_${Date.now()}`,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
  };
};

const validateToken = async (token: string): Promise<Maybe<{ userId: number }>> => {
  await delay(50);
  if (token.startsWith("access_")) {
    const userId = parseInt(token.split("_")[1]);
    return some({ userId });
  }
  return none();
};

const refreshAccessToken = async (refreshToken: string): Promise<Maybe<AuthToken>> => {
  await delay(50);
  if (refreshToken.startsWith("refresh_")) {
    const userId = parseInt(refreshToken.split("_")[1]);
    const user = await db.findById(userId);
    if (user) {
      return some(await generateToken(user));
    }
  }
  return none();
};

const delay = (ms: number): void => {
  setTimeout(() => {}, ms);
};

// ============================================================================
// Helper functions
// ============================================================================

const createBusinessError = (code: string, message: string, userMessage: string) => {
  return error({
    name: code,
    args: { code, userMessage },
    defaultDescription: message,
  });
};

const createSystemError = (type: string, message: string) => {
  return error({
    name: type,
    args: { type, internal: true },
    defaultDescription: message,
  });
};

// ============================================================================
// Example 1: Simple login with Result
// ============================================================================

type AuthResult = { user: User; token: AuthToken };

const login = async (email: string, password: string): Promise<{ ok: true; value: AuthResult } | { ok: false; error: AuthError }> => {
  console.log(`\n=== Example 1: Simple Login ===`);
  console.log(`  Login attempt for: ${email}`);

  // Find user
  const userResult = await fromPromise(db.findByEmail(email));

  if (userResult.isErr() || !userResult.value) {
    console.log(`  ✗ User not found`);
    return err(createBusinessError("INVALID_CREDENTIALS", "User not found", "Invalid email or password"));
  }

  const user = userResult.value;

  // Verify password
  const passwordValid = await fromPromise(verifyPassword(password, user.passwordHash));

  if (passwordValid.isErr() || !passwordValid.value) {
    console.log(`  ✗ Invalid password`);
    return err(createBusinessError("INVALID_CREDENTIALS", "Password verification failed", "Invalid email or password"));
  }

  // Generate token
  const tokenResult = await fromPromise(generateToken(user));

  if (tokenResult.isErr()) {
    console.log(`  ✗ Token generation failed`);
    return err(createSystemError("TOKEN_SERVICE_ERROR", "Failed to generate authentication token"));
  }

  console.log(`  ✓ Login successful for ${user.email}`);
  return ok({ user, token: tokenResult.value });
}

// ============================================================================
// Example 2: Login with MFA
// ============================================================================

const loginWithMfa = async (
  email: string,
  password: string,
  mfaCode?: string
): Promise<{ ok: true; value: AuthResult } | { ok: false; error: AuthError }> => {
  console.log(`\n=== Example 2: Login with MFA ===`);
  console.log(`  Login attempt for: ${email}`);

  // First stage: email/password
  const userResult = await fromPromise(db.findByEmail(email));

  if (userResult.isErr() || !userResult.value) {
    return err(createBusinessError("INVALID_CREDENTIALS", "User not found", "Invalid email or password"));
  }

  const user = userResult.value;

  // Verify password
  const passwordValid = await fromPromise(verifyPassword(password, user.passwordHash));

  if (passwordValid.isErr() || !passwordValid.value) {
    return err(createBusinessError("INVALID_CREDENTIALS", "Password verification failed", "Invalid email or password"));
  }

  // Check if MFA is enabled
  if (user.mfaEnabled && !mfaCode) {
    console.log(`  ⚠ MFA required`);
    return err(createBusinessError("MFA_REQUIRED", "Multi-factor authentication required", "Please enter your MFA code"));
  }

  // Verify MFA code
  if (user.mfaEnabled && mfaCode) {
    console.log(`  Verifying MFA code...`);
    const mfaValid = await fromPromise(verifyMfaCode(user.id, mfaCode));

    if (mfaValid.isErr() || !mfaValid.value) {
      console.log(`  ✗ Invalid MFA code`);
      return err(createBusinessError("INVALID_MFA", "MFA code verification failed", "Invalid authentication code"));
    }
  }

  // Generate token
  const tokenResult = await fromPromise(generateToken(user));

  if (tokenResult.isErr()) {
    return err(createSystemError("TOKEN_SERVICE_ERROR", "Failed to generate authentication token"));
  }

  console.log(`  ✓ Login successful with MFA`);
  return ok({ user, token: tokenResult.value });
};

// ============================================================================
// Example 3: Token validation
// ============================================================================

const validateAuthToken = async (token: string): Promise<{ ok: true; value: User } | { ok: false; error: AuthError }> => {
  console.log(`\n=== Example 3: Token Validation ===`);

  const validation = await validateToken(token);

  if (!validation.ok) {
    console.log(`  ✗ Invalid token`);
    return err(createBusinessError("INVALID_TOKEN", "Token validation failed", "Please log in again"));
  }

  const { userId } = validation.value;

  // Load user
  const userResult = await fromPromise(db.findById(userId));

  if (userResult.isErr() || !userResult.value) {
    console.log(`  ✗ User not found (may have been deleted)`);
    return err(createBusinessError("USER_NOT_FOUND", "User associated with token not found", "Please log in again"));
  }

  console.log(`  ✓ Token valid for ${userResult.value.email}`);
  return ok(userResult.value);
}

// ============================================================================
// Example 4: Token refresh
// ============================================================================

const refreshAuthToken = async (
  refreshToken: string
): Promise<{ ok: true; value: AuthToken } | { ok: false; error: AuthError }> => {
  console.log(`\n=== Example 4: Token Refresh ===`);

  const newToken = await refreshAccessToken(refreshToken);

  if (!newToken.ok) {
    console.log(`  ✗ Invalid refresh token`);
    return err(createBusinessError("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired", "Please log in again"));
  }

  console.log(`  ✓ Token refreshed successfully`);
  return ok(newToken.value);
};

// ============================================================================
// Example 5: Complete auth flow with error handling
// ============================================================================

const completeAuthFlow = async () => {
  console.log(`\n=== Example 5: Complete Auth Flow ===`);

  // Scenario 1: Successful login
  console.log(`\n  Scenario 1: Successful login`);
  const result1 = await login("user@example.com", "correctpassword");
  if (result1.ok) {
    console.log(`    ✓ User authenticated: ${result1.value.user.email}`);
  } else if (isError(result1.error) && result1.error.args.code === "INVALID_CREDENTIALS") {
    console.log(`    ✗ Business error: ${result1.error.args.userMessage}`);
  }

  // Scenario 2: Invalid credentials
  console.log(`\n  Scenario 2: Invalid credentials`);
  const result2 = await login("user@example.com", "wrongpassword");
  if (!result2.ok) {
    console.log(`    ✗ ${result2.error.args.userMessage}`);
  }

  // Scenario 3: User not found
  console.log(`\n  Scenario 3: User not found`);
  const result3 = await login("nonexistent@example.com", "password");
  if (!result3.ok) {
    console.log(`    ✗ ${result3.error.args.userMessage}`);
  }

  // Scenario 4: MFA login
  console.log(`\n  Scenario 4: MFA login`);
  const result4a = await loginWithMfa("mfa@example.com", "correctpassword");
  if (!result4a.ok && result4a.error.args.code === "MFA_REQUIRED") {
    console.log(`    ⚠ ${result4a.error.args.userMessage}`);

    const result4b = await loginWithMfa("mfa@example.com", "correctpassword", "123456");
    if (result4b.ok) {
      console.log(`    ✓ MFA verified, user logged in`);
    }
  }

  // Scenario 5: Token validation
  console.log(`\n  Scenario 5: Token validation`);
  const authResult = await login("user@example.com", "correctpassword");
  if (authResult.ok) {
    const token = authResult.value.token.accessToken;
    const validation = await validateAuthToken(token);
    if (validation.ok) {
      console.log(`    ✓ Token is valid`);
    }
  }
}

// ============================================================================
// Run all examples
// ============================================================================

const main = async () => {
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
    if (authResult.ok) {
      await validateAuthToken(authResult.value.token.accessToken);
      await validateAuthToken("invalid_token");
    }

    // Example 4: Token refresh
    if (authResult.ok) {
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
