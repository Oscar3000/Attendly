"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toAuthFormErrors, type AuthFormErrors } from "@/lib/auth-errors";
import { AuthCard, FormError, SubmitButton } from "@/components/auth/auth-card";
import { TextField } from "@/components/ui/text-field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<AuthFormErrors>({ fields: {} });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ fields: {} });
    setLoading(true);

    // A network failure throws instead of returning an error; show the generic message for it
    const { error } = await authClient
      .requestPasswordReset({ email, redirectTo: "/reset-password" })
      .catch(() => ({ error: { status: 0 } }));
    setLoading(false);
    if (error) {
      setErrors(toAuthFormErrors(error));
      return;
    }
    setSent(true);
  };

  const footer = (
    <p>
      <Link
        href="/login"
        className="inline-flex min-h-11 items-center font-medium text-ink underline"
      >
        Back to log in
      </Link>
    </p>
  );

  // The response is the same whether or not the email has an account, so the message is too
  if (sent) {
    return (
      <AuthCard title="Check your email" footer={footer}>
        <p>
          If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a
          link to reset its password. It expires in 1 hour.
        </p>
        <p className="mt-3 text-slate">
          Nothing after a few minutes? Check your spam folder, or try again later.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your account's email and we'll send you a link to choose a new password."
      footer={footer}
    >
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          error={errors.fields.email}
        />
        <FormError message={errors.form} />
        <SubmitButton loading={loading}>Send reset link</SubmitButton>
      </form>
    </AuthCard>
  );
}
