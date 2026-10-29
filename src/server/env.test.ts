import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  ADMIN_EMAIL: "admin@example.com",
  INVITE_PIN: "2468",
  BETTER_AUTH_SECRET: "better-auth-test-secret-at-least-32-characters",
  BETTER_AUTH_URL: "http://localhost:3000",
};

beforeEach(() => {
  for (const [name, value] of Object.entries(valid)) vi.stubEnv(name, value);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEnv", () => {
  it("returns the validated variables", () => {
    expect(getEnv()).toEqual(valid);
  });

  it("names every missing variable", () => {
    vi.stubEnv("AUTH_SECRET", undefined);
    vi.stubEnv("INVITE_PIN", undefined);

    expect(() => getEnv()).toThrow(/AUTH_SECRET is required[\s\S]*INVITE_PIN is required/);
  });

  it("explains invalid values without printing them", () => {
    vi.stubEnv("AUTH_SECRET", "too-short-secret");

    let message = "";
    try {
      getEnv();
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain("AUTH_SECRET must be at least 32 characters");
    expect(message).not.toContain("too-short-secret");
  });

  it("rejects a BETTER_AUTH_URL that is not a URL", () => {
    vi.stubEnv("BETTER_AUTH_URL", "localhost");
    expect(() => getEnv()).toThrow("BETTER_AUTH_URL must be a URL");
  });

  it("requires EMAIL_FROM when RESEND_API_KEY is set", () => {
    expect(getEnv().RESEND_API_KEY).toBeUndefined();

    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    expect(() => getEnv()).toThrow("EMAIL_FROM is required with RESEND_API_KEY");

    vi.stubEnv("EMAIL_FROM", "Attendly <hello@example.com>");
    expect(getEnv()).toMatchObject({ EMAIL_FROM: "Attendly <hello@example.com>" });
  });

  it("treats empty optional variables as unset", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    expect(getEnv()).toMatchObject({ RESEND_API_KEY: undefined, EMAIL_FROM: undefined });
  });

  it("has no default PIN", () => {
    vi.stubEnv("INVITE_PIN", undefined);
    expect(() => getEnv()).toThrow("INVITE_PIN is required");
  });
});
