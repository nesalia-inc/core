/**
 * Authentication Flow Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Handling authentication flows with Result
 * - Token validation and refresh
 * - Multi-factor authentication
 */

import { fromPromise, okAsync, errAsync, ok, err, some, none, Maybe } from "@deessejs/core";

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

type BusinessError = {
  code: string;
  message: string;
  userMessage: string;
};

type SystemError = {
  type: string;
  message: string;
  internal: boolean;
};

type AuthResult = Result<
  { user: User; token: AuthToken },
  BusinessError | SystemError
>;

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
// Example 1: Simple login with Result
// ============================================================================

const login = async (email: string, password: string): Promise<AuthResult> => {
  console.log(`\n=== Example 1: Simple Login ===`);
  console.log(`  Login attempt for: ${email}`);

  // Find user
  const userResult = await fromPromise(db.findByEmail(email));

  if (userResult.isErr() || !userResult.value) {
    console.log(`  ✗ User not found`);
    return err({
      code: "INVALID_CREDENTIALS",
      message: "User not found",
      userMessage: "Invalid email or password",
    } as BusinessError);
  }

  const user = userResult.value;

  // Verify password
  const passwordValid = await fromPromise(verifyPassword(password, user.passwordHash));

  if (passwordValid.isErr() || !passwordValid.value) {
    console.log(`  ✗ Invalid password`);
    return err({
      code: "INVALID_CREDENTIALS",
      message: "Password verification failed",
      userMessage: "Invalid email or password",
    } as BusinessError);
  }

  // Generate token
  const tokenResult = await fromPromise(generateToken(user));

  if (tokenResult.isErr()) {
    console.log(`  ✗ Token generation failed`);
    return err({
      type: "TOKEN_SERVICE_ERROR",
      message: "Failed to generate authentication token",
      internal: true,
    } as SystemError);
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
): Promise<AuthResult> => {
  console.log(`\n=== Example 2: Login with MFA ===`);
  console.log(`  Login attempt for: ${email}`);

  // First stage: email/password
  const userResult = await fromPromise(db.findByEmail(email));

  if (userResult.isErr() || !userResult.value) {
    return err({
      code: "INVALID_CREDENTIALS",
      message: "User not found",
      userMessage: "Invalid email or password",
    } as BusinessError);
  }

  const user = userResult.value;

  // Verify password
  const passwordValid = await fromPromise(verifyPassword(password, user.passwordHash));

  if (passwordValid.isErr() || !passwordValid.value) {
    return err({
      code: "INVALID_CREDENTIALS",
      message: "Password verification failed",
      userMessage: "Invalid email or password",
    } as BusinessError);
  }

  // Check if MFA is enabled
  if (user.mfaEnabled && !mfaCode) {
    console.log(`  ⚠ MFA required`);
    return err({
      code: "MFA_REQUIRED",
      message: "Multi-factor authentication required",
      userMessage: "Please enter your MFA code",
    } as BusinessError);
  }

  // Verify MFA code
  if (user.mfaEnabled && mfaCode) {
    console.log(`  Verifying MFA code...`);
    const mfaValid = await fromPromise(verifyMfaCode(user.id, mfaCode));

    if (mfaValid.isErr() || !mfaValid.value) {
      console.log(`  ✗ Invalid MFA code`);
      return err({
        code: "INVALID_MFA",
        message: "MFA code verification failed",
        userMessage: "Invalid authentication code",
      } as BusinessError);
    }
  }

  // Generate token
  const tokenResult = await fromPromise(generateToken(user));

  if (tokenResult.isErr()) {
    return err({
      type: "TOKEN_SERVICE_ERROR",
      message: "Failed to generate authentication token",
      internal: true,
    } as SystemError);
  }

  console.log(`  ✓ Login successful with MFA`);
  return ok({ user, token: tokenResult.value });
};

// ============================================================================
// Example 3: Token validation
// ============================================================================

const validateAuthToken = async (token: string): Promise<Result<User, BusinessError | SystemError>> => {
  console.log(`\n=== Example 3: Token Validation ===`);

  const validation = await validateToken(token);

  if (!validation.ok) {
    console.log(`  ✗ Invalid token`);
    return err({
      code: "INVALID_TOKEN",
      message: "Token validation failed",
      userMessage: "Please log in again",
    } as BusinessError);
  }

  const { userId } = validation.value;

  // Load user
  const userResult = await fromPromise(db.findById(userId));

  if (userResult.isErr() || !userResult.value) {
    console.log(`  ✗ User not found (may have been deleted)`);
    return err({
      code: "USER_NOT_FOUND",
      message: "User associated with token not found",
      userMessage: "Please log in again",
    } as BusinessError);
  }

  console.log(`  ✓ Token valid for ${userResult.value.email}`);
  return ok(userResult.value);
}

// ============================================================================
// Example 4: Token refresh
// ============================================================================

const refreshAuthToken = async (
  refreshToken: string
): Promise<Result<AuthToken, BusinessError | SystemError>> => {
  console.log(`\n=== Example 4: Token Refresh ===`);

  const newToken = await refreshAccessToken(refreshToken);

  if (!newToken.ok) {
    console.log(`  ✗ Invalid refresh token`);
    return err({
      code: "INVALID_REFRESH_TOKEN",
      message: "Refresh token is invalid or expired",
      userMessage: "Please log in again",
    } as BusinessError);
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
  if (result1.isOk()) {
    console.log(`    ✓ User authenticated: ${result1.value.user.email}`);
  } else if ("code" in result1.error) {
    console.log(`    ✗ Business error: ${result1.error.userMessage}`);
  } else {
    console.log(`    ✗ System error: ${result1.error.message}`);
  }

  // Scenario 2: Invalid credentials
  console.log(`\n  Scenario 2: Invalid credentials`);
  const result2 = await login("user@example.com", "wrongpassword");
  if (result2.isErr() && "code" in result2.error) {
    console.log(`    ✗ ${result2.error.userMessage}`);
  }

  // Scenario 3: User not found
  console.log(`\n  Scenario 3: User not found`);
  const result3 = await login("nonexistent@example.com", "password");
  if (result3.isErr() && "code" in result3.error) {
    console.log(`    ✗ ${result3.error.userMessage}`);
  }

  // Scenario 4: MFA login
  console.log(`\n  Scenario 4: MFA login`);
  const result4a = await loginWithMfa("mfa@example.com", "correctpassword");
  if (result4a.isErr() && "code" in result4a.error && result4a.error.code === "MFA_REQUIRED") {
    console.log(`    ⚠ ${result4a.error.userMessage}`);

    const result4b = await loginWithMfa("mfa@example.com", "correctpassword", "123456");
    if (result4b.isOk()) {
      console.log(`    ✓ MFA verified, user logged in`);
    }
  }

  // Scenario 5: Token validation
  console.log(`\n  Scenario 5: Token validation`);
  const authResult = await login("user@example.com", "correctpassword");
  if (authResult.isOk()) {
    const token = authResult.value.token.accessToken;
    const validation = await validateAuthToken(token);
    if (validation.isOk()) {
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
    if (authResult.isOk()) {
      await validateAuthToken(authResult.value.token.accessToken);
      await validateAuthToken("invalid_token");
    }

    // Example 4: Token refresh
    if (authResult.isOk()) {
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
