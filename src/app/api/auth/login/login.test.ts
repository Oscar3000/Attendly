import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { verifySession } from "@/server/auth/session";
import { POST } from "./route";

beforeAll(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://unused");
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
  vi.stubEnv("ADMIN_PASSWORD", "correct-horse");
  vi.stubEnv("INVITE_PIN", "2468");
  vi.stubEnv("BETTER_AUTH_SECRET", "better-auth-test-secret-at-least-32-characters");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
});

// Each test uses its own IP so rate-limit counts don't leak between tests
function login(password: string, ip = "10.0.0.1") {
  return POST(
    new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "x-real-ip": ip },
      body: JSON.stringify({ password }),
    }),
    {},
  );
}

describe("POST /api/auth/login", () => {
  it("sets a signed admin session cookie and does not return the token in the body", async () => {
    const response = await login("correct-horse");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Login successful" });

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/HttpOnly/i);
    const token = /auth_token=([^;]+)/.exec(cookie)?.[1];
    expect(await verifySession(token, "admin")).toEqual({ role: "admin" });
  });

  it("rejects a wrong password without setting a cookie", async () => {
    const response = await login("wrong", "10.0.0.2");

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns 429 after 5 failed attempts, even for the right password", async () => {
    const ip = "10.0.0.3";
    for (let i = 0; i < 5; i++) expect((await login("wrong", ip)).status).toBe(401);

    const blocked = await login("correct-horse", ip);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("60");
    expect((await blocked.json()).error).toMatch(/Too many attempts/);

    expect((await login("correct-horse", "10.0.0.4")).status).toBe(200);
  });

  it("resets the failure count after a successful login", async () => {
    const ip = "10.0.0.5";
    for (let i = 0; i < 4; i++) await login("wrong", ip);
    expect((await login("correct-horse", ip)).status).toBe(200);

    for (let i = 0; i < 4; i++) expect((await login("wrong", ip)).status).toBe(401);
  });
});
