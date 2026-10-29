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

describe("account routes (/dashboard, /api/events)", () => {
  it("lets a request with a session cookie through", async () => {
    expect(passedThrough(await middleware(request("/dashboard", sessionCookie)))).toBe(true);
    expect(passedThrough(await middleware(request("/api/events/abc/metrics", sessionCookie)))).toBe(
      true,
    );
    // Production sets it with the __Secure- prefix over https
    const secure = { "__Secure-better-auth.session_token": session_token };
    expect(passedThrough(await middleware(request("/api/events/abc/metrics", secure)))).toBe(true);
  });

  it("without a session cookie: redirect for pages, 401 for the API", async () => {
    const page = await middleware(request("/dashboard/events/abc"));
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("http://localhost/login");

    expect((await middleware(request("/api/events/abc/invitations"))).status).toBe(401);
  });

  it("doesn't accept the old admin token or a guest session", async () => {
    const auth_token = await signSession("admin");
    const invite_token = await signSession("guest");
    expect((await middleware(request("/api/events/abc/metrics", { auth_token }))).status).toBe(401);
    expect((await middleware(request("/api/events/abc/metrics", { invite_token }))).status).toBe(
      401,
    );
  });
});

describe("/api/invitations (PIN guests only)", () => {
  it("accepts a guest session", async () => {
    const invite_token = await signSession("guest");
    expect(passedThrough(await middleware(request("/api/invitations/abc", { invite_token })))).toBe(
      true,
    );
  });

  it("rejects an account session or a forged guest cookie", async () => {
    expect((await middleware(request("/api/invitations/abc", sessionCookie))).status).toBe(401);
    const response = await middleware(request("/api/invitations/abc", { invite_token: forged }));
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
