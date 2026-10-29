/**
 * Transactional email: sendEmail() is the only entry point
 * Sends through Resend's REST API when RESEND_API_KEY is set; in development without a key,
 * emails are logged to the console instead (so verification and reset links still work locally)
 */
import "server-only";
import { getEnv } from "@/server/env";

export interface Email {
  to: string;
  subject: string;
  // Plain text is always sent; html is optional
  text: string;
  html?: string;
}

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

// False in production without Resend, so the UI can hide actions that would send email
export function canSendEmail(): boolean {
  const { RESEND_API_KEY, EMAIL_FROM } = getEnv();
  return Boolean(RESEND_API_KEY && EMAIL_FROM) || process.env.NODE_ENV !== "production";
}

export async function sendEmail(email: Email): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = getEnv();

  if (RESEND_API_KEY && EMAIL_FROM) {
    await sendWithResend(email, RESEND_API_KEY, EMAIL_FROM);
    return;
  }

  // Throw rather than pretend it was sent; Better Auth catches and logs this for its emails
  if (process.env.NODE_ENV === "production") {
    throw new Error("Email is not configured: set RESEND_API_KEY and EMAIL_FROM");
  }

  console.info(
    [`[email] To: ${email.to}`, `[email] Subject: ${email.subject}`, "", email.text, ""].join("\n"),
  );
}

async function sendWithResend(email: Email, apiKey: string, from: string): Promise<void> {
  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      ...(email.html ? { html: email.html } : {}),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    // Resend's error body names the problem (e.g. an unverified domain) and never echoes the key
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend rejected the email (${response.status}): ${detail.slice(0, 300)}`);
  }
}
