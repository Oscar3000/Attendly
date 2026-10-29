/**
 * Better Auth server instance: email + password accounts stored in our Postgres via Prisma
 * Mounted at its default basePath, /api/auth (src/app/api/auth/[...all])
 */
import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";

function createAuth() {
  const env = getEnv();

  return betterAuth({
    // Passed explicitly: Better Auth would otherwise fall back to AUTH_SECRET, the old cookie key
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
    // Lets server actions set auth cookies; keep it last in the plugin list
    plugins: [nextCookies()],
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

// Built on first use, not at import: `next build` loads route modules without runtime env vars
export function getAuth() {
  instance ??= createAuth();
  return instance;
}
