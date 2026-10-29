"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toAuthFormErrors, type AuthClientError } from "@/lib/auth-errors";
import { FormError, SubmitButton } from "@/components/auth/auth-card";
import { TextField } from "@/components/auth/text-field";

export type EmailChange = "allowed" | "admin" | "unavailable";

interface AccountSettingsProps {
  name: string;
  email: string;
  emailVerified: boolean;
  hasPassword: boolean;
  isAdmin: boolean;
  emailChange: EmailChange;
}

// A network failure throws instead of returning an error; treat it like any other failure
const settle = <T,>(call: Promise<T>) =>
  call.catch(() => ({ error: { status: 0 } as AuthClientError }));

export function AccountSettings(props: AccountSettingsProps) {
  return (
    <main className="min-h-screen bg-[#FFF9F4] px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-inter text-2xl font-bold text-black sm:text-3xl">Account</h1>
          <Link
            href="/dashboard"
            className="font-inter text-sm font-medium text-[#C07A54] hover:underline"
          >
            Your events
          </Link>
        </div>
        <NameSection name={props.name} />
        <EmailSection
          email={props.email}
          emailVerified={props.emailVerified}
          emailChange={props.emailChange}
        />
        <PasswordSection hasPassword={props.hasPassword} />
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <h2 className="font-inter mb-4 text-lg font-bold text-black">{title}</h2>
      {children}
    </section>
  );
}

function Success({ message }: { message: string }) {
  return (
    <p role="status" className="font-inter mt-3 text-sm text-[#2E7D32]">
      {message}
    </p>
  );
}

function NameSection({ name: initialName }: { name: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error } = await settle(authClient.updateUser({ name: name.trim() }));
    setLoading(false);
    if (error) {
      setError(toAuthFormErrors(error).form ?? "Couldn't save your name");
      return;
    }
    setSaved(true);
    router.refresh();
  };

  return (
    <Section title="Name">
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="name"
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          error={error}
        />
        <SubmitButton loading={loading}>Save name</SubmitButton>
      </form>
      {saved && <Success message="Name saved." />}
    </Section>
  );
}

function EmailSection({
  email,
  emailVerified,
  emailChange,
}: {
  email: string;
  emailVerified: boolean;
  emailChange: EmailChange;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const [loading, setLoading] = useState(false);

  const current = (
    <p className="font-inter mb-4 text-sm text-[#333333]">
      Current email: <span className="font-medium">{email}</span>
      {!emailVerified && <span className="text-[#666666]"> (not verified)</span>}
    </p>
  );

  if (emailChange !== "allowed") {
    return (
      <Section title="Email">
        {current}
        <p className="font-inter text-sm text-[#666666]">
          {emailChange === "admin"
            ? "This account's email can't be changed here: dashboard access is tied to it through the ADMIN_EMAIL setting."
            : "Email changes are unavailable because email sending isn't set up."}
        </p>
      </Section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(undefined);
    setFormError(undefined);
    setSentTo(undefined);
    setLoading(true);
    const { error } = await settle(authClient.changeEmail({ newEmail, callbackURL: "/account" }));
    setLoading(false);
    if (error) {
      const errors = toAuthFormErrors(error);
      setFieldError(errors.fields.email);
      setFormError(errors.form);
      return;
    }
    // A verified account confirms from its current address first; otherwise the new one verifies
    setSentTo(emailVerified ? email : newEmail);
  };

  return (
    <Section title="Email">
      {current}
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="newEmail"
          label="New email"
          type="email"
          autoComplete="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={loading}
          error={fieldError}
        />
        <FormError message={formError} />
        <SubmitButton loading={loading}>Change email</SubmitButton>
      </form>
      {sentTo && (
        <Success
          message={`Check ${sentTo} for a link to confirm the change. Your email stays the same until you click it.`}
        />
      )}
    </Section>
  );
}

interface PasswordErrors {
  current?: string | undefined;
  next?: string | undefined;
  form?: string | undefined;
}

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!hasPassword) {
    return (
      <Section title="Password">
        <p className="font-inter text-sm text-[#666666]">
          You sign in with Google, so this account has no password.
        </p>
      </Section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    if (newPassword !== confirm) {
      setErrors({ next: "The new passwords don't match" });
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await settle(
      authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true }),
    );
    setLoading(false);
    if (error) {
      // INVALID_PASSWORD here means the current password is wrong
      if (error.code === "INVALID_PASSWORD") {
        setErrors({ current: "Your current password is incorrect" });
        return;
      }
      const mapped = toAuthFormErrors(error);
      setErrors({ next: mapped.fields.password, form: mapped.form });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setSaved(true);
  };

  return (
    <Section title="Password">
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          id="currentPassword"
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={loading}
          error={errors.current}
        />
        <TextField
          id="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={loading}
          error={errors.next}
        />
        <TextField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={loading}
        />
        <FormError message={errors.form} />
        <SubmitButton loading={loading}>Change password</SubmitButton>
      </form>
      {saved && <Success message="Password changed. You've been logged out on other devices." />}
    </Section>
  );
}
