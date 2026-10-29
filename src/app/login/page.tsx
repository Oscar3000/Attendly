"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toAuthFormErrors, type AuthFormErrors } from "@/lib/auth-errors";
import { AuthCard, FormError, SubmitButton } from "@/components/auth/auth-card";
import { TextField } from "@/components/auth/text-field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFormErrors>({ fields: {} });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ fields: {} });
    setLoading(true);

    // A network failure throws instead of returning an error; show the generic message for it
    const { error } = await authClient.signIn
      .email({ email, password })
      .catch(() => ({ error: { status: 0 } }));
    if (error) {
      setErrors(toAuthFormErrors(error));
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <AuthCard
      title="Log in"
      footer={
        <p>
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-[#C07A54] hover:underline">
            Sign up
          </Link>
        </p>
      }
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
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          error={errors.fields.password}
        />
        <FormError message={errors.form} />
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
    </AuthCard>
  );
}
