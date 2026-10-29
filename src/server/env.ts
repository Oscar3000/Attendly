/**
 * Server environment variables, validated with zod
 * Checked once at startup (src/instrumentation.ts) and read per request, so tests can stub them
 * Not marked server-only: instrumentation imports it outside the React Server Components graph
 */
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "is required"),
  AUTH_SECRET: z.string().min(32, "must be at least 32 characters (openssl rand -base64 32)"),
  // Only this account may use the dashboard until invitations are scoped per owner (Phase 3)
  ADMIN_EMAIL: z.email("must be an email address"),
  INVITE_PIN: z.string().min(4, "must be at least 4 characters"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "must be at least 32 characters (openssl rand -base64 32)"),
  BETTER_AUTH_URL: z.url("must be a URL, e.g. http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

// Throws an error naming every invalid variable (never their values)
export function getEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => {
      const name = String(issue.path[0]);
      const message = process.env[name] === undefined ? "is required" : issue.message;
      return `  - ${name} ${message}`;
    });
    throw new Error(`Invalid environment variables:\n${problems.join("\n")}`);
  }
  return result.data;
}
