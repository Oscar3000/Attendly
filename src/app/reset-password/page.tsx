"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toAuthFormErrors, type AuthFormErrors } from "@/lib/auth-errors";
import { AuthCard, FormError, SubmitButton } from "@/components/auth/auth-card";
import { PasswordField } from "@/components/auth/password-field";
import { buttonClasses } from "@/components/ui/button";

/**
 * Better Auth's email link checks the token, then redirects here with ?token=... (valid)
 * or ?error=INVALID_TOKEN (expired, used or unknown)
 */
export default function ResetPasswordPage() {
  // useSearchParams needs a Suspense boundary so the rest of the page can be prerendered
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}

const loginLink = (
  <p>
    <Link
      href="/login"
      className="inline-flex min-h-11 items-center font-medium text-ink underline"
    >
      Back to log in
    </Link>
  </p>
);

function ResetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<AuthFormErrors>({ fields: {} });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token || searchParams.get("error")) {
    return (
      <AuthCard title="Link expired" footer={loginLink}>
        <p className="mb-4">
          This reset link is invalid or has expired. Links work once and only for 1 hour.
        </p>
        <Link
          href="/forgot-password"
          className={buttonClasses({ size: "lg", className: "w-full" })}
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password updated" footer={loginLink}>
        <p>
          Your password has been changed and you&apos;ve been logged out everywhere. Log in with
          your new password.
        </p>
      </AuthCard>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setErrors({ fields: { password: "The passwords don't match" } });
      return;
    }

    setErrors({ fields: {} });
    setLoading(true);

    // A network failure throws instead of returning an error; show the generic message for it
    const { error } = await authClient
      .resetPassword({ newPassword: password, token })
      .catch(() => ({ error: { status: 0 } }));
    setLoading(false);
    if (error) {
      setErrors(toAuthFormErrors(error));
      return;
    }
    setDone(true);
  };

  return (
    <AuthCard title="Choose a new password" footer={loginLink}>
      <form onSubmit={handleSubmit} noValidate>
        <PasswordField
          id="password"
          label="New password"
          autoComplete="new-password"
          required
          showProgress
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          error={errors.fields.password}
        />
        <PasswordField
          id="confirm"
          label="Confirm new password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={loading}
        />
        <FormError message={errors.form} />
        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>
    </AuthCard>
  );
}
