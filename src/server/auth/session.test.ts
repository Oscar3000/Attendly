import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_MAX_AGE_SECONDS, signSession, verifySession } from "./session";

const SECRET = "test-secret-that-is-at-least-32-characters-long";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", SECRET);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("signSession / verifySession", () => {
  it("accepts a token it signed for the same role", async () => {
    const token = await signSession("admin");
    expect(await verifySession(token, "admin")).toEqual({ role: "admin" });
  });

  it("rejects a token signed for a different role", async () => {
    const token = await signSession("guest");
    expect(await verifySession(token, "admin")).toBeNull();
  });

  it("rejects missing, forged and tampered tokens", async () => {
    const token = await signSession("admin");
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ role: "admin", iss: "attendly" })).toString(
      "base64url",
    );

    expect(await verifySession(undefined, "admin")).toBeNull();
    expect(await verifySession("x", "admin")).toBeNull();
    expect(await verifySession(Buffer.from("admin:123").toString("base64"), "admin")).toBeNull();
    expect(await verifySession(`${header}.${forgedPayload}.${signature}`, "admin")).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    vi.stubEnv("AUTH_SECRET", "another-secret-that-is-at-least-32-chars");
    const token = await signSession("admin");

    vi.stubEnv("AUTH_SECRET", SECRET);
    expect(await verifySession(token, "admin")).toBeNull();
  });

  it("rejects an expired token", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const token = await signSession("admin");

    vi.setSystemTime(Date.now() + (SESSION_MAX_AGE_SECONDS + 1) * 1000);
    expect(await verifySession(token, "admin")).toBeNull();
  });

  it("throws when AUTH_SECRET is missing or too short", async () => {
    vi.stubEnv("AUTH_SECRET", "short");
    await expect(signSession("admin")).rejects.toThrow("AUTH_SECRET");
    await expect(verifySession("token", "admin")).rejects.toThrow("AUTH_SECRET");
  });
});
