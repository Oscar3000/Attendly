import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware, config } from "./middleware";

function request(path: string, cookies: Record<string, string> = {}) {
  const cookie = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return new NextRequest(`http://localhost${path}`, { headers: cookie ? { cookie } : {} });
}

// NextResponse.next() marks the response with this header
const passedThrough = (response: Response) => response.headers.get("x-middleware-next") === "1";

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

  it("doesn't accept the old admin or PIN guest cookies", async () => {
    for (const cookie of [{ auth_token: "x" }, { invite_token: "x" }]) {
      expect((await middleware(request("/api/events/abc/metrics", cookie))).status).toBe(401);
    }
  });

  it("only runs for account routes: tickets and door links carry their own credential", () => {
    expect(config.matcher).toEqual(["/dashboard/:path*", "/api/events/:path*"]);
  });
});
