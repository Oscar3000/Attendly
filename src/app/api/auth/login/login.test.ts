import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { verifySession } from "@/server/auth/session";

let POST: typeof import("./route").POST;

beforeAll(async () => {
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
  vi.stubEnv("ADMIN_PASSWORD", "correct-horse");
  // The route reads ADMIN_PASSWORD when the module loads, so import after stubbing
  ({ POST } = await import("./route"));
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
