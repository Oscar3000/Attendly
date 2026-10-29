/**
 * Server environment variables, validated with zod
 * Checked once at startup (src/instrumentation.ts) and read per request, so tests can stub them
 * Not marked server-only: instrumentation imports it outside the React Server Components graph
 */
import { z } from "zod";

// docker-compose passes unset optional variables through as "", so treat that as unset
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "is required"),
    AUTH_SECRET: z.string().min(32, "must be at least 32 characters (openssl rand -base64 32)"),
    // Only this account may use the dashboard until invitations are scoped per owner (Phase 3)
    ADMIN_EMAIL: z.email("must be an email address"),
    INVITE_PIN: z.string().min(4, "must be at least 4 characters"),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "must be at least 32 characters (openssl rand -base64 32)"),
    BETTER_AUTH_URL: z.url("must be a URL, e.g. http://localhost:3000"),
    // Email (src/server/email). Optional: without them, development logs emails and production
    // skips them (only verification and password-reset emails are affected)
    RESEND_API_KEY: optionalString,
    EMAIL_FROM: optionalString,
    // Google sign-in. Optional (both or neither): without them the Google button is hidden
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
  })
  .superRefine((env, ctx) => {
    if (Boolean(env.GOOGLE_CLIENT_ID) !== Boolean(env.GOOGLE_CLIENT_SECRET)) {
      const missing = env.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_SECRET" : "GOOGLE_CLIENT_ID";
      ctx.addIssue({
        code: "custom",
        path: [missing],
        message: "is required: set both Google variables or neither",
      });
    }
    if (env.RESEND_API_KEY && !env.EMAIL_FROM) {
      ctx.addIssue({
        code: "custom",
        path: ["EMAIL_FROM"],
        message: 'is required with RESEND_API_KEY, e.g. "Attendly <hello@yourdomain.com>"',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

// Throws an error naming every invalid variable (never their values)
export function getEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => {
      const name = String(issue.path[0]);
      // Cross-field rules explain themselves; otherwise an unset variable is just "required"
      const message =
        issue.code !== "custom" && process.env[name] === undefined ? "is required" : issue.message;
      return `  - ${name} ${message}`;
    });
    throw new Error(`Invalid environment variables:\n${problems.join("\n")}`);
  }
  return result.data;
}
