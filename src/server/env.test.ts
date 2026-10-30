import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
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
    vi.stubEnv("DATABASE_URL", undefined);
    vi.stubEnv("BETTER_AUTH_SECRET", undefined);

    expect(() => getEnv()).toThrow(/DATABASE_URL is required[\s\S]*BETTER_AUTH_SECRET is required/);
  });

  it("explains invalid values without printing them", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short-secret");

    let message = "";
    try {
      getEnv();
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain("BETTER_AUTH_SECRET must be at least 32 characters");
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

  it("requires both Google variables or neither", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id.apps.googleusercontent.com");
    expect(() => getEnv()).toThrow(
      "GOOGLE_CLIENT_SECRET is required: set both Google variables or neither",
    );

    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
    expect(getEnv()).toMatchObject({ GOOGLE_CLIENT_ID: "client-id.apps.googleusercontent.com" });
  });

  it("treats empty optional variables as unset", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    expect(getEnv()).toMatchObject({ RESEND_API_KEY: undefined, EMAIL_FROM: undefined });
  });

  // Removed with the PIN flow (T-508b); a deployment that still sets them keeps starting
  it("ignores the old AUTH_SECRET and INVITE_PIN", () => {
    vi.stubEnv("AUTH_SECRET", "x");
    vi.stubEnv("INVITE_PIN", "1");
    expect(getEnv()).toEqual(valid);
  });
});
