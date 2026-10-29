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
      .sendVerificationEmail({ email, callbackURL: "/admin" })
      .catch(() => ({ error: { status: 0 } }));
    setStatus(error ? "failed" : "sent");
  };

  return (
    <div
      role="status"
      className="font-inter flex flex-col gap-2 border-b border-[#F0D9CB] bg-[#FDF1E9] px-4 py-3 text-sm text-[#333333] sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        Please verify <span className="font-medium">{email}</span>. Check your inbox for the link.
      </p>
      {status === "sent" ? (
        <p className="text-[#666666]">Sent. It can take a minute to arrive.</p>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={status === "sending"}
          className="self-start font-medium text-[#C07A54] hover:underline disabled:opacity-50 sm:self-auto"
        >
          {status === "failed" ? "Couldn't send. Try again" : "Resend email"}
        </button>
      )}
    </div>
  );
}
