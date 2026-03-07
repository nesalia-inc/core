# Authentication Flow

This example demonstrates authentication using `Outcome` to distinguish business vs system errors.

## What You'll Learn

- **Outcome**: Business vs system error handling
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
import { success, cause, exception } from "@deessejs/core";

// Business error (user-correctable)
if (!user) {
  return cause({
    code: "INVALID_CREDENTIALS",
    message: "User not found",
    userMessage: "Invalid email or password"
  });
}

// System error (unexpected)
if (database.isDown()) {
  return exception({
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
if (loginResult.isCause() && loginResult.value.code === "MFA_REQUIRED") {
  // Prompt for MFA code
  return cause({
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
if (validation.isCause()) {
  // Try refresh
  const refresh = await refreshAccessToken(refreshToken);
  if (refresh.isCause()) {
    // Both expired, need re-login
    return cause({ code: "REAUTH_REQUIRED" });
  }
  return success(refresh.value);
}
```

## When to Use Outcome

| Type | Use Case |
|------|----------|
| **Success** | Operation completed successfully |
| **Cause** | Expected business errors (invalid input, user not found) |
| **Exception** | Unexpected system errors (database down, network failure) |

## Related Examples

- [Form Validation](../form-validation/) - Input validation patterns
- [HTTP API Error Handling](../http-api/) - API error handling
