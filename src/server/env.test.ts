import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "./env";

const valid = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
  ADMIN_PASSWORD: "correct-horse",
  INVITE_PIN: "2468",
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
    vi.stubEnv("ADMIN_PASSWORD", undefined);
    vi.stubEnv("INVITE_PIN", undefined);

    expect(() => getEnv()).toThrow(/ADMIN_PASSWORD is required[\s\S]*INVITE_PIN is required/);
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

  it("has no default PIN", () => {
    vi.stubEnv("INVITE_PIN", undefined);
    expect(() => getEnv()).toThrow("INVITE_PIN is required");
  });
});
