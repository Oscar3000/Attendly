/**
 * Emails Better Auth sends: verify an address, reset a password
 * Links come from Better Auth (BETTER_AUTH_URL + a single-use token)
 */
import "server-only";
import type { Email } from "@/server/email/send-email";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function linkEmail(
  to: string,
  subject: string,
  intro: string,
  action: string,
  url: string,
  outro: string,
): Email {
  const link = escapeHtml(url);
  return {
    to,
    subject,
    text: `${intro}\n\n${action}: ${url}\n\n${outro}`,
    html: [
      `<p>${escapeHtml(intro)}</p>`,
      `<p><a href="${link}" style="color:#C07A54;font-weight:600">${escapeHtml(action)}</a></p>`,
      `<p style="color:#666666;font-size:13px">${escapeHtml(outro)}</p>`,
    ].join("\n"),
  };
}

export function verificationEmail(to: string, url: string): Email {
  return linkEmail(
    to,
    "Verify your email for Attendly",
    "Confirm this is your email address to finish setting up your Attendly account.",
    "Verify email",
    url,
    "If you didn't create an Attendly account, you can ignore this email.",
  );
}

export function resetPasswordEmail(to: string, url: string): Email {
  return linkEmail(
    to,
    "Reset your Attendly password",
    "Someone asked to reset the password for your Attendly account.",
    "Choose a new password",
    url,
    "The link expires in 1 hour. If you didn't ask for this, you can ignore this email; your password won't change.",
  );
}
