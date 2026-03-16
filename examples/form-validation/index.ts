/**
 * Form Validation Example
 *
 * This example demonstrates how to use @deessejs/core for:
 * - Chaining multiple validation rules
 * - Accumulating validation errors
 * - Type-safe form data handling
 */

import { ok, err } from "@deessejs/core";

// ============================================================================
// Types
// ============================================================================

type RegistrationForm = {
  name: string;
  email: string;
  age: number;
  password: string;
  confirmPassword: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  age: number;
};

type ValidationError = {
  field: string;
  code: string;
  message: string;
};

type SystemError = {
  type: string;
  message: string;
};

// ============================================================================
// Validation Rules
// ============================================================================

const validateName = (name: string): Result<string, ValidationError> => {
  if (name.length < 2) {
    return err({
      field: "name",
      code: "TOO_SHORT",
      message: "Name must be at least 2 characters",
    });
  }

  if (name.length > 50) {
    return err({
      field: "name",
      code: "TOO_LONG",
      message: "Name must not exceed 50 characters",
    });
  }

  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return err({
      field: "name",
      code: "INVALID_CHARS",
      message: "Name can only contain letters and spaces",
    });
  }

  return ok(name);
}

const validateEmail = (email: string): Result<string, ValidationError> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return err({
      field: "email",
      code: "REQUIRED",
      message: "Email is required",
    });
  }

  if (!emailRegex.test(email)) {
    return err({
      field: "email",
      code: "INVALID_FORMAT",
      message: "Email format is invalid",
    });
  }

  return ok(email);
}

const validateAge = (age: number): Result<number, ValidationError> => {
  if (age < 13) {
    return err({
      field: "age",
      code: "TOO_YOUNG",
      message: "You must be at least 13 years old",
    });
  }

  if (age > 120) {
    return err({
      field: "age",
      code: "INVALID",
      message: "Please enter a valid age",
    });
  }

  return ok(age);
}

const validatePassword = (password: string): Result<string, ValidationError> => {
  if (password.length < 8) {
    return err({
      field: "password",
      code: "TOO_SHORT",
      message: "Password must be at least 8 characters",
    });
  }

  if (!/[A-Z]/.test(password)) {
    return err({
      field: "password",
      code: "NO_UPPERCASE",
      message: "Password must contain at least one uppercase letter",
    });
  }

  if (!/[a-z]/.test(password)) {
    return err({
      field: "password",
      code: "NO_LOWERCASE",
      message: "Password must contain at least one lowercase letter",
    });
  }

  if (!/[0-9]/.test(password)) {
    return err({
      field: "password",
      code: "NO_NUMBER",
      message: "Password must contain at least one number",
    });
  }

  return ok(password);
};

const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): Result<void, ValidationError> => {
  if (password !== confirmPassword) {
    return err({
      field: "confirmPassword",
      code: "MISMATCH",
      message: "Passwords do not match",
    });
  }

  return ok(undefined);
};

// ============================================================================
// Example 1: Sequential validation (fail fast)
// ============================================================================

const validateFormSequential = (
  form: RegistrationForm
): Result<RegistrationForm, ValidationError> => {
  console.log("\n=== Example 1: Sequential Validation (Fail Fast) ===");

  return ok(form)
    .flatMap((data) =>
      validateName(data.name).map((name) => ({ ...data, name }))
    )
    .flatMap((data) =>
      validateEmail(data.email).map((email) => ({ ...data, email }))
    )
    .flatMap((data) =>
      validateAge(data.age).map((age) => ({ ...data, age }))
    )
    .flatMap((data) =>
      validatePassword(data.password).map((password) => ({ ...data, password }))
    )
    .flatMap((data) =>
      validatePasswordConfirmation(data.password, data.confirmPassword).map(
        () => data
      )
    );
}

// ============================================================================
// Example 2: Validate all fields (accumulate errors)
// ============================================================================

type FormErrors = {
  errors: ValidationError[];
};

const validateFormAll = (form: RegistrationForm): Result<RegistrationForm, FormErrors> => {
  console.log("\n=== Example 2: Validate All Fields (Accumulate Errors) ===");

  const errors: ValidationError[] = [];

  // Validate each field and collect errors
  const nameResult = validateName(form.name);
  if (nameResult.isErr()) errors.push(nameResult.error);

  const emailResult = validateEmail(form.email);
  if (emailResult.isErr()) errors.push(emailResult.error);

  const ageResult = validateAge(form.age);
  if (ageResult.isErr()) errors.push(ageResult.error);

  const passwordResult = validatePassword(form.password);
  if (passwordResult.isErr()) errors.push(passwordResult.error);

  const confirmResult = validatePasswordConfirmation(
    form.password,
    form.confirmPassword
  );
  if (confirmResult.isErr()) errors.push(confirmResult.error);

  if (errors.length > 0) {
    return err({ errors });
  }

  return ok(form);
}

// ============================================================================
// Example 3: Validate with business vs system errors using Result
// ============================================================================

const validateFormWithErrorTypes = (
  form: RegistrationForm
): Result<RegistrationForm, ValidationError | SystemError> => {
  console.log("\n=== Example 3: Business vs System Errors ===");

  // Business validation errors (expected, user-correctable)
  const nameValid = validateName(form.name);
  if (nameValid.isErr()) {
    return nameValid;
  }

  // Simulate a system error (unexpected, e.g., database check fails)
  try {
    // This would be a real database check
    if (form.email === "taken@example.com") {
      return err({
        type: "DATABASE_ERROR",
        message: "Failed to check email availability",
      } as SystemError);
    }
  } catch (e) {
    return err({
      type: "SYSTEM_ERROR",
      message: e instanceof Error ? e.message : "Unknown system error",
    } as SystemError);
  }

  // Continue with other validations
  return ok(form)
    .flatMap((data) => {
      const result = validateEmail(data.email);
      return result.isErr() ? err(result.error) : ok(data);
    })
    .flatMap((data) => {
      const result = validateAge(data.age);
      return result.isErr() ? err(result.error) : ok(data);
    })
    .flatMap((data) => {
      const result = validatePassword(data.password);
      return result.isErr() ? err(result.error) : ok(data);
    })
    .flatMap((data) => {
      const result = validatePasswordConfirmation(
        data.password,
        data.confirmPassword
      );
      return result.isErr() ? err(result.error) : ok(data);
    });
}

// ============================================================================
// Example 4: Conditional validation
// ============================================================================

type UserProfile = {
  name: string;
  email: string;
  age: number;
  website?: string; // Optional field
  twitter?: string; // Optional field
};

const validateUserProfile = (profile: UserProfile): Result<UserProfile, ValidationError> => {
  console.log("\n=== Example 4: Conditional Validation ===");

  return ok(profile)
    .flatMap((data) =>
      validateName(data.name).map((name) => ({ ...data, name }))
    )
    .flatMap((data) =>
      validateEmail(data.email).map((email) => ({ ...data, email }))
    )
    .flatMap((data) =>
      validateAge(data.age).map((age) => ({ ...data, age }))
    )
    .flatMap((data) => {
      // Only validate website if provided
      if (data.website) {
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(data.website)) {
          return err({
            field: "website",
            code: "INVALID_URL",
            message: "Website must be a valid URL",
          });
        }
      }
      return ok(data);
    })
    .flatMap((data) => {
      // Only validate twitter if provided
      if (data.twitter) {
        const twitterRegex = /^@[\w]+$/;
        if (!twitterRegex.test(data.twitter)) {
          return err({
            field: "twitter",
            code: "INVALID_TWITTER",
            message: "Twitter handle must start with @",
          });
        }
      }
      return ok(data);
    });
}

// ============================================================================
// Example 5: Async validation (e.g., check if email already exists)
// ============================================================================

const emailExists = async (email: string): Promise<boolean> => {
  // Simulate database check
  await new Promise((resolve) => setTimeout(resolve, 100));
  return email === "existing@example.com";
}

const validateFormWithAsyncCheck = async (
  form: RegistrationForm
): Promise<Result<RegistrationForm, ValidationError>> => {
  console.log("\n=== Example 5: Async Validation ===");

  // First do sync validation
  const syncResult = validateFormSequential(form);
  if (syncResult.isErr()) {
    return syncResult;
  }

  // Then do async validation
  const exists = await emailExists(form.email);
  if (exists) {
    return err({
      field: "email",
      code: "ALREADY_EXISTS",
      message: "An account with this email already exists",
    });
  }

  return ok(form);
}

// ============================================================================
// Run all examples
// ============================================================================

const main = async () => {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║   Form Validation with @deessejs/core                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  // Test form with multiple errors
  const invalidForm: RegistrationForm = {
    name: "X",
    email: "invalid-email",
    age: 10,
    password: "weak",
    confirmPassword: "different",
  };

  const validForm: RegistrationForm = {
    name: "John Doe",
    email: "john@example.com",
    age: 25,
    password: "SecurePass123",
    confirmPassword: "SecurePass123",
  };

  try {
    // Example 1: Sequential validation
    console.log("\n--- Testing invalid form (sequential) ---");
    const result1 = validateFormSequential(invalidForm);
    if (result1.isErr()) {
      console.log(`✗ Validation failed: ${result1.error.message}`);
      console.log(`  Field: ${result1.error.field}, Code: ${result1.error.code}`);
    }

    console.log("\n--- Testing valid form (sequential) ---");
    const result2 = validateFormSequential(validForm);
    if (result2.isOk()) {
      console.log("✓ Form is valid!");
    }

    // Example 2: Accumulate all errors
    console.log("\n--- Testing invalid form (all errors) ---");
    const result3 = validateFormAll(invalidForm);
    if (result3.isErr()) {
      console.log(`✗ Found ${result3.error.errors.length} validation errors:`);
      result3.error.errors.forEach((err) => {
        console.log(`  • [${err.field}] ${err.code}: ${err.message}`);
      });
    }

    // Example 3: Using Result with error types
    console.log("\n--- Testing with Result (business vs system errors) ---");
    const result4 = validateFormWithErrorTypes(validForm);
    if (result4.isOk()) {
      console.log("✓ Form validated successfully!");
    } else if ("field" in result4.error) {
      console.log(`✗ Business error: ${result4.error.message}`);
    } else {
      console.log(`✗ System error: ${result4.error.message}`);
    }

    // Example 4: Conditional validation
    console.log("\n--- Testing conditional validation ---");
    const profile: UserProfile = {
      name: "Jane Doe",
      email: "jane@example.com",
      age: 28,
      website: "invalid-url",
      twitter: "janedoe",
    };

    const result5 = validateUserProfile(profile);
    if (result5.isErr()) {
      console.log(`✗ ${result5.error.message}`);
    }

    // Example 5: Async validation
    console.log("\n--- Testing async validation ---");
    const formWithExistingEmail: RegistrationForm = {
      ...validForm,
      email: "existing@example.com",
    };

    const result6 = await validateFormWithAsyncCheck(formWithExistingEmail);
    if (result6.isErr()) {
      console.log(`✗ ${result6.error.message}`);
    }

  } catch (error) {
    console.error("\nUnexpected error:", error);
  }

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║   All examples completed                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
