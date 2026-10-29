import { describe, expect, it } from "vitest";
import { oauthErrorMessage, toAuthFormErrors } from "./auth-errors";

describe("toAuthFormErrors", () => {
  it("puts email problems on the email field", () => {
    expect(toAuthFormErrors({ code: "INVALID_EMAIL", status: 400 })).toEqual({
      fields: { email: "Enter a valid email address" },
    });
    expect(
      toAuthFormErrors({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", status: 422 }).fields,
    ).toEqual({ email: "An account with this email already exists" });
  });

  it("maps request validation errors to the field named in the message", () => {
    expect(
      toAuthFormErrors({
        code: "VALIDATION_ERROR",
        message: "[body.email] Invalid email address",
        status: 400,
      }),
    ).toEqual({ fields: { email: "Enter a valid email address" } });
    expect(
      toAuthFormErrors({
        code: "VALIDATION_ERROR",
        message: "[body.callbackURL] bad",
        status: 400,
      }),
    ).toEqual({ fields: {}, form: "Something went wrong. Please try again." });
  });

  it("puts password problems on the password field", () => {
    expect(toAuthFormErrors({ code: "PASSWORD_TOO_SHORT", status: 400 })).toEqual({
      fields: { password: "Use at least 8 characters" },
    });
  });

  it("reports wrong credentials on the form, not on a field", () => {
    expect(toAuthFormErrors({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 })).toEqual({
      fields: {},
      form: "Incorrect email or password",
    });
  });

  it("explains an invalid or expired reset link", () => {
    expect(toAuthFormErrors({ code: "INVALID_TOKEN", status: 400 }).form).toMatch(
      /invalid or has expired/,
    );
  });

  it("asks for a fresh login before sensitive changes", () => {
    expect(toAuthFormErrors({ code: "SESSION_NOT_FRESH", status: 403 }).form).toMatch(
      /log out and back in/,
    );
  });

  it("explains a request from an address that doesn't match BETTER_AUTH_URL", () => {
    expect(toAuthFormErrors({ code: "INVALID_ORIGIN", status: 403 }).form).toMatch(
      /isn't allowed from this address/,
    );
  });

  it("explains rate limiting", () => {
    expect(toAuthFormErrors({ status: 429 }).form).toMatch(/Too many attempts/);
  });

  it("falls back to a generic message without echoing the server's", () => {
    expect(
      toAuthFormErrors({ code: "FAILED_TO_CREATE_USER", message: "db exploded", status: 500 }),
    ).toEqual({ fields: {}, form: "Something went wrong. Please try again." });
  });
});

describe("oauthErrorMessage", () => {
  it("is empty without an error", () => {
    expect(oauthErrorMessage(undefined)).toBeUndefined();
  });

  it("explains an existing account that couldn't be linked", () => {
    expect(oauthErrorMessage("account_not_linked")).toMatch(/already exists/);
  });

  it("falls back to a generic message", () => {
    expect(oauthErrorMessage("access_denied")).toBe(
      "Google sign-in didn't complete. Please try again.",
    );
  });
});
