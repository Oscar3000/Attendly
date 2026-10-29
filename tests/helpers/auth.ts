/**
 * Better Auth helpers for db tests
 * Tables are truncated before each test, so create sessions in beforeEach, not beforeAll
 */
import { vi } from "vitest";
import { getAuth } from "@/server/auth/auth";

// The env getAuth() needs
export function stubAuthEnv(): void {
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
  vi.stubEnv("INVITE_PIN", "2468");
  vi.stubEnv("BETTER_AUTH_SECRET", "better-auth-test-secret-at-least-32-characters");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
}

// Signs a new user up and returns a Cookie header carrying their session
export async function sessionCookieFor(email: string): Promise<string> {
  const { headers } = await getAuth().api.signUpEmail({
    body: { email, password: "correct-horse-battery", name: "Test User" },
    returnHeaders: true,
  });
  return headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}
