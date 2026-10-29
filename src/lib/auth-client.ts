/**
 * Better Auth client for client components (sign-up, login, sign-out)
 * Talks to the same origin at Better Auth's default basePath (/api/auth)
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
