import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { signSession } from "@/server/auth/session";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} });
}

// NextResponse.next() marks the response with this header
const passedThrough = (response: Response) => response.headers.get("x-middleware-next") === "1";

const forged = Buffer.from(`admin:${Date.now()}`).toString("base64");

// Middleware only checks that a Better Auth session cookie is present; route handlers and pages
// verify it against the database (guards.db.test.ts)
const session_token = "any-value";
const sessionCookie = { "better-auth.session_token": session_token };

describe("admin routes", () => {
  it("lets a request with a session cookie through", async () => {
    expect(passedThrough(await middleware(request("/admin", sessionCookie)))).toBe(true);
    expect(passedThrough(await middleware(request("/api/admin", sessionCookie)))).toBe(true);
    // Production sets it with the __Secure- prefix over https
    const secure = { "__Secure-better-auth.session_token": session_token };
    expect(passedThrough(await middleware(request("/api/admin", secure)))).toBe(true);
  });

  it("without a session cookie: redirect for pages, 401 for the API", async () => {
    const page = await middleware(request("/admin"));
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("http://localhost/login");

    expect((await middleware(request("/api/admin"))).status).toBe(401);
  });

  it("no longer accepts the old admin token", async () => {
    const auth_token = await signSession("admin");
    expect((await middleware(request("/api/admin", { auth_token }))).status).toBe(401);
  });

  it("requires a session cookie for event-scoped API routes", async () => {
    const path = "/api/events/abc/invitations";
    expect((await middleware(request(path))).status).toBe(401);
    expect(passedThrough(await middleware(request(path, sessionCookie)))).toBe(true);
  });

  it("rejects a guest session on admin routes", async () => {
    const invite_token = await signSession("guest");
    expect((await middleware(request("/api/admin", { invite_token }))).status).toBe(401);
  });
});

describe("/api/invitations", () => {
  it("accepts a session cookie or a guest session", async () => {
    const invite_token = await signSession("guest");

    expect(passedThrough(await middleware(request("/api/invitations", sessionCookie)))).toBe(true);
    expect(passedThrough(await middleware(request("/api/invitations", { invite_token })))).toBe(
      true,
    );
  });

  it("rejects a forged guest cookie without a session cookie", async () => {
    const response = await middleware(request("/api/invitations", { invite_token: forged }));
    expect(response.status).toBe(401);
  });
});

describe("invite pages", () => {
  it("lets a valid guest session through", async () => {
    const invite_token = await signSession("guest");
    expect(passedThrough(await middleware(request("/invite/abc", { invite_token })))).toBe(true);
  });

  it("redirects a forged guest cookie to the PIN page, keeping the destination", async () => {
    const response = await middleware(request("/invite/abc?x=1", { invite_token: forged }));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/invite-pin");
    expect(location.searchParams.get("redirect")).toBe("/invite/abc?x=1");
  });
});
