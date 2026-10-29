/**
 * Maps Better Auth client errors to messages shown next to form fields
 * Codes come from BASE_ERROR_CODES in @better-auth/core; anything unmapped is a form-level error
 */

export type AuthField = "name" | "email" | "password";

export interface AuthFormErrors {
  fields: Partial<Record<AuthField, string>>;
  form?: string;
}

// Shape of the `error` returned by authClient calls
export interface AuthClientError {
  code?: string | undefined;
  message?: string | undefined;
  status: number;
}

const FIELD_ERRORS: Record<string, { field: AuthField; message: string }> = {
  INVALID_EMAIL: { field: "email", message: "Enter a valid email address" },
  USER_ALREADY_EXISTS: { field: "email", message: "An account with this email already exists" },
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
    field: "email",
    message: "An account with this email already exists",
  },
  INVALID_PASSWORD: { field: "password", message: "Enter a password" },
  PASSWORD_TOO_SHORT: { field: "password", message: "Use at least 8 characters" },
  PASSWORD_TOO_LONG: { field: "password", message: "Use at most 128 characters" },
};

const FORM_ERRORS: Record<string, string> = {
  // Deliberately vague so it doesn't reveal which emails have accounts
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password",
  INVALID_TOKEN: "This reset link is invalid or has expired. Request a new one.",
};

// Request-body validation fails before Better Auth's own checks, as
// { code: "VALIDATION_ERROR", message: "[body.email] Invalid email address" }
const VALIDATION_MESSAGES: Record<AuthField, string> = {
  name: "Enter your name",
  email: "Enter a valid email address",
  password: "Enter a password",
};

function validationField(message: string | undefined): AuthField | undefined {
  const field = message?.match(/^\[body\.(\w+)\]/)?.[1];
  return field && field in VALIDATION_MESSAGES ? (field as AuthField) : undefined;
}

// Better Auth redirects back from Google with ?error=<code> when sign-in doesn't complete
export function oauthErrorMessage(code: string | undefined): string | undefined {
  if (!code) return undefined;
  if (code === "account_not_linked") {
    return "An account with this email already exists. Log in with your password; Google sign-in works for it once the email is verified.";
  }
  return "Google sign-in didn't complete. Please try again.";
}

export function toAuthFormErrors(error: AuthClientError): AuthFormErrors {
  const fieldError = error.code ? FIELD_ERRORS[error.code] : undefined;
  if (fieldError) return { fields: { [fieldError.field]: fieldError.message } };

  const invalidField =
    error.code === "VALIDATION_ERROR" ? validationField(error.message) : undefined;
  if (invalidField) return { fields: { [invalidField]: VALIDATION_MESSAGES[invalidField] } };

  if (error.status === 429) {
    return { fields: {}, form: "Too many attempts. Wait a minute and try again." };
  }

  const formError = error.code ? FORM_ERRORS[error.code] : undefined;
  return { fields: {}, form: formError ?? "Something went wrong. Please try again." };
}
