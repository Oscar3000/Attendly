"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toAuthFormErrors, type AuthClientError } from "@/lib/auth-errors";
import { FormError } from "@/components/auth/auth-card";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

export type EmailChange = "allowed" | "unavailable";

interface AccountSettingsProps {
  name: string;
  email: string;
  emailVerified: boolean;
  hasPassword: boolean;
  emailChange: EmailChange;
}

// A network failure throws instead of returning an error; treat it like any other failure
const settle = <T,>(call: Promise<T>) =>
  call.catch(() => ({ error: { status: 0 } as AuthClientError }));

export function AccountSettings(props: AccountSettingsProps) {
  return (
    <>
      <div className="bg-ink px-6 text-paper">
        <div className="mx-auto max-w-[1200px] pt-2 pb-7">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center font-medium">
            Your events
          </Link>
          <h1 className="mt-3 font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-none font-extrabold tracking-tight">
            Account
          </h1>
        </div>
      </div>
      <main className="px-6 pt-8 pb-18">
        <div className="mx-auto grid max-w-[1200px] items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          <NameSection name={props.name} />
          <EmailSection
            email={props.email}
            emailVerified={props.emailVerified}
            emailChange={props.emailChange}
          />
          <PasswordSection hasPassword={props.hasPassword} />
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-3xl bg-card p-7">
      <h2 className="mb-4 font-display text-[26px] font-extrabold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Save({ loading, children }: { loading: boolean; children: string }) {
  return (
    <Button type="submit" variant="secondary" loading={loading} className="w-full">
      {loading ? "Please wait..." : children}
    </Button>
  );
}

function Success({ message }: { message: string }) {
  return (
    <p role="status" className="mt-3 rounded-[14px] bg-lime px-4 py-3 font-medium">
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
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
            setSaved(false);
          }}
          disabled={loading}
          error={error}
        />
        <Save loading={loading}>Save name</Save>
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
    <p className="mb-4 break-words">
      Current email: <span className="font-semibold">{email}</span>
      {!emailVerified && <span className="text-slate"> (not verified)</span>}
    </p>
  );

  if (emailChange !== "allowed") {
    return (
      <Section title="Email">
        {current}
        <p className="text-slate">
          {"Email changes are unavailable because email sending isn't set up."}
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
          onChange={(e) => {
            setNewEmail(e.target.value);
            setFieldError(undefined);
          }}
          disabled={loading}
          error={fieldError}
        />
        <FormError message={formError} />
        <Save loading={loading}>Change email</Save>
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
        <p className="text-slate">You sign in with Google, so this account has no password.</p>
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
        <PasswordField
          id="currentPassword"
          label="Current password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setErrors({});
            setSaved(false);
          }}
          disabled={loading}
          error={errors.current}
        />
        <PasswordField
          id="newPassword"
          label="New password"
          autoComplete="new-password"
          minLength={8}
          showProgress
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setErrors({});
            setSaved(false);
          }}
          disabled={loading}
          error={errors.next}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setErrors({});
            setSaved(false);
          }}
          disabled={loading}
        />
        <FormError message={errors.form} />
        <Save loading={loading}>Change password</Save>
      </form>
      {saved && <Success message="Password changed. You've been logged out on other devices." />}
    </Section>
  );
}
