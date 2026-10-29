/**
 * Better Auth client for client components (sign-up, login, sign-out)
 * Talks to the same origin; basePath must match src/server/auth/auth.ts
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: "/api/better-auth",
});
