# Authentication Flow

This example demonstrates authentication using `Result` to distinguish business vs system errors.

## What You'll Learn

- **Result**: Business vs system error handling
- **Multi-stage auth**: Email/password → MFA → Token
- **Token validation**: Verify and refresh tokens
- **Error types**: User-correctable vs system errors

## Running the Example

```bash
tsx examples/auth/index.ts
```

## Key Patterns

### 1. Business vs System Errors

```typescript
import { ok, err, isOk, isErr } from "@deessejs/fp";

// Business error (user-correctable)
if (!user) {
  return err({
    code: "INVALID_CREDENTIALS",
    message: "User not found",
    userMessage: "Invalid email or password"
  });
}

// System error (unexpected)
if (database.isDown()) {
  return err({
    type: "DATABASE_ERROR",
    message: "Failed to connect to database",
    internal: true
  });
}
```

### 2. Multi-Factor Authentication

```typescript
// First stage: credentials
const loginResult = await verifyCredentials(email, password);
if (loginResult.isErr() && loginResult.error.code === "MFA_REQUIRED") {
  // Prompt for MFA code
  return err({
    code: "MFA_REQUIRED",
    userMessage: "Enter your MFA code"
  });
}

// Second stage: MFA verification
const mfaResult = await verifyMfa(userId, mfaCode);
```

### 3. Token Refresh Flow

```typescript
const validation = await validateToken(accessToken);
if (validation.isErr()) {
  // Try refresh
  const refresh = await refreshAccessToken(refreshToken);
  if (refresh.isErr()) {
    // Both expired, need re-login
    return err({ code: "REAUTH_REQUIRED" });
  }
  return ok(refresh.value);
}
```

## When to Use Result

| Type | Use Case |
|------|----------|
| **Ok** | Operation completed successfully |
| **Err** | Expected business errors (invalid input, user not found) |

## Related Examples

- [Form Validation](../form-validation/) - Input validation patterns
- [HTTP API Error Handling](../http-api/) - API error handling
