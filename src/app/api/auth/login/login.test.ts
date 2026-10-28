import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { verifySession } from "@/server/auth/session";
import { POST } from "./route";

beforeAll(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://unused");
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
  vi.stubEnv("ADMIN_PASSWORD", "correct-horse");
  vi.stubEnv("INVITE_PIN", "2468");
});

function login(password: string) {
  return POST(
    new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
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
    const response = await login("wrong");

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
