"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toAuthFormErrors, type AuthFormErrors } from "@/lib/auth-errors";
import { AuthCard, FormError, SubmitButton } from "@/components/auth/auth-card";
import { TextField } from "@/components/auth/text-field";

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
    <Link href="/login" className="font-medium text-[#C07A54] hover:underline">
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
        <p className="font-inter mb-4 text-sm text-[#333333]">
          This reset link is invalid or has expired. Links work once and only for 1 hour.
        </p>
        <Link
          href="/forgot-password"
          className="font-inter block w-full rounded-lg bg-[#C07A54] px-4 py-2 text-center text-base font-medium text-white hover:opacity-90"
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password updated" footer={loginLink}>
        <p className="font-inter text-sm text-[#333333]">
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
        <TextField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          error={errors.fields.password}
        />
        <TextField
          id="confirm"
          label="Confirm new password"
          type="password"
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
