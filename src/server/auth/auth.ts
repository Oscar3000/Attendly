/**
 * Better Auth server instance: email + password accounts stored in our Postgres via Prisma
 * Mounted at its default basePath, /api/auth (src/app/api/auth/[...all])
 */
import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/server/db/client";
import { sendEmail } from "@/server/email/send-email";
import { getEnv } from "@/server/env";
import { changeEmailConfirmation, resetPasswordEmail, verificationEmail } from "./auth-emails";

function createAuth() {
  const env = getEnv();

  return betterAuth({
    // Passed explicitly: Better Auth would otherwise fall back to an AUTH_SECRET env var, which
    // older deployments still set for the removed PIN flow's cookies
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    // Better Auth catches send failures and only logs them: sign-up still succeeds, and a
    // reset request answers the same either way (it never reveals whether an account exists)
    emailAndPassword: {
      enabled: true,
      // Unverified users can still sign in; the dashboard shows a banner instead
      requireEmailVerification: false,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) => sendEmail(resetPasswordEmail(user.email, url)),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: ({ user, url }) => sendEmail(verificationEmail(user.email, url)),
    },
    user: {
      // A verified account confirms from its current address, then verifies the new one, so a
      // stolen session can't quietly move the account to another email
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: ({ user, newEmail, url }) =>
          sendEmail(changeEmailConfirmation(user.email, newEmail, url)),
      },
    },
    // Callback URL to register with Google: BETTER_AUTH_URL + /api/auth/callback/google.
    // Default linking rules apply: Google joins an existing account only when both Google and
    // the account have verified that email
    socialProviders: isGoogleEnabled()
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
            prompt: "select_account",
          },
        }
      : {},
    // Lets server actions set auth cookies; keep it last in the plugin list
    plugins: [nextCookies()],
  });
}

// Read per request so the login and sign-up pages can hide the Google button
export function isGoogleEnabled(): boolean {
  const env = getEnv();
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

let instance: ReturnType<typeof createAuth> | undefined;

// Built on first use, not at import: `next build` loads route modules without runtime env vars
export function getAuth() {
  instance ??= createAuth();
  return instance;
}
