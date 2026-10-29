import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { sendEmail, type Email } from "@/server/email/send-email";
import { sessionCookieFor, stubAuthEnv } from "../../../tests/helpers/auth";
import { getAuth } from "./auth";

// Record emails instead of sending them
vi.mock("@/server/email/send-email", () => ({ sendEmail: vi.fn(async () => {}) }));
const sent = vi.mocked(sendEmail);

beforeAll(() => {
  stubAuthEnv();
});

beforeEach(() => {
  sent.mockReset();
  sent.mockResolvedValue(undefined);
});

const lastEmail = (): Email => sent.mock.calls.at(-1)![0];
const tokenFrom = (email: Email) => {
  const link = email.text.match(/https?:\/\/\S+/)![0];
  const url = new URL(link);
  // Verification links carry ?token=; reset links end in /reset-password/<token>
  return url.searchParams.get("token") ?? url.pathname.split("/").at(-1)!;
};

describe("email verification", () => {
  it("emails a link on sign-up that verifies the address", async () => {
    await sessionCookieFor("ada@example.com");

    const email = lastEmail();
    expect(email.to).toBe("ada@example.com");
    expect(email.subject).toMatch(/verify/i);
    expect(email.text).toContain("http://localhost:3000/api/auth/verify-email?token=");

    await getAuth().api.verifyEmail({ query: { token: tokenFrom(email) } });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "ada@example.com" } });
    expect(user.emailVerified).toBe(true);
  });

  it("still creates the account when the email can't be sent", async () => {
    sent.mockRejectedValue(new Error("Resend is down"));

    await expect(sessionCookieFor("ada@example.com")).resolves.toContain("session_token");
    expect(await prisma.user.count()).toBe(1);
  });
});

describe("password reset", () => {
  it("emails a link whose token sets a new password and logs out every session", async () => {
    const oldSession = await sessionCookieFor("ada@example.com");

    await getAuth().api.requestPasswordReset({
      body: { email: "ada@example.com", redirectTo: "/reset-password" },
    });
    const email = lastEmail();
    expect(email.subject).toMatch(/reset/i);
    expect(email.text).toContain("/api/auth/reset-password/");
    expect(email.text).toContain("callbackURL=%2Freset-password");

    await getAuth().api.resetPassword({
      body: { token: tokenFrom(email), newPassword: "a-brand-new-password" },
    });

    const session = await getAuth().api.getSession({
      headers: new Headers({ cookie: oldSession }),
    });
    expect(session).toBeNull();
    await expect(
      getAuth().api.signInEmail({
        body: { email: "ada@example.com", password: "a-brand-new-password" },
      }),
    ).resolves.toMatchObject({ user: { email: "ada@example.com" } });
  });

  it("answers the same for an unknown email without sending anything", async () => {
    await expect(
      getAuth().api.requestPasswordReset({ body: { email: "nobody@example.com" } }),
    ).resolves.toMatchObject({ status: true });
    expect(sent).not.toHaveBeenCalled();
  });

  it("rejects a used token", async () => {
    await sessionCookieFor("ada@example.com");
    await getAuth().api.requestPasswordReset({ body: { email: "ada@example.com" } });
    const token = tokenFrom(lastEmail());

    await getAuth().api.resetPassword({ body: { token, newPassword: "a-brand-new-password" } });
    await expect(
      getAuth().api.resetPassword({ body: { token, newPassword: "another-new-password" } }),
    ).rejects.toMatchObject({ body: { code: "INVALID_TOKEN" } });
  });
});
