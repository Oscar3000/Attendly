"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/**
 * Shown above the dashboard while the signed-in user's email is unverified
 * Verification isn't required to sign in yet, so this only nudges
 */
export function VerifyEmailBanner({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const resend = async () => {
    setStatus("sending");
    const { error } = await authClient
      .sendVerificationEmail({ email, callbackURL: "/dashboard" })
      .catch(() => ({ error: { status: 0 } }));
    setStatus(error ? "failed" : "sent");
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-lime px-6 py-2.5 text-[15px] text-ink"
    >
      <p>
        Please verify <span className="font-medium">{email}</span>. Check your inbox for the link.
      </p>
      {status === "sent" ? (
        <p>Sent. It can take a minute to arrive.</p>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={status === "sending"}
          className="min-h-11 font-semibold text-ink underline disabled:opacity-50"
        >
          {status === "failed" ? "Couldn't send. Try again" : "Resend email"}
        </button>
      )}
    </div>
  );
}
