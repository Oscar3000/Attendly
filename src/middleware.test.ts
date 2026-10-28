import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { SESSION_MAX_AGE_SECONDS, signSession } from "@/server/auth/session";

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
});

afterEach(() => {
  vi.useRealTimers();
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

describe("admin routes", () => {
  it("lets a valid admin session through", async () => {
    const auth_token = await signSession("admin");
    expect(passedThrough(await middleware(request("/admin", { auth_token })))).toBe(true);
    expect(passedThrough(await middleware(request("/api/admin", { auth_token })))).toBe(true);
  });

  it("rejects a forged cookie: redirect for pages, 401 for the API", async () => {
    const page = await middleware(request("/admin", { auth_token: forged }));
    expect(page.status).toBe(307);
    expect(page.headers.get("location")).toBe("http://localhost/login");

    const api = await middleware(request("/api/admin", { auth_token: forged }));
    expect(api.status).toBe(401);
  });

  it("rejects a guest session on admin routes", async () => {
    const auth_token = await signSession("guest");
    expect((await middleware(request("/api/admin", { auth_token }))).status).toBe(401);
  });

  it("rejects an expired admin session", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const auth_token = await signSession("admin");
    vi.setSystemTime(Date.now() + (SESSION_MAX_AGE_SECONDS + 1) * 1000);

    expect((await middleware(request("/api/admin", { auth_token }))).status).toBe(401);
  });
});

describe("/api/invitations", () => {
  it("accepts an admin or a guest session", async () => {
    const auth_token = await signSession("admin");
    const invite_token = await signSession("guest");

    expect(passedThrough(await middleware(request("/api/invitations", { auth_token })))).toBe(true);
    expect(passedThrough(await middleware(request("/api/invitations", { invite_token })))).toBe(
      true,
    );
  });

  it("rejects forged cookies", async () => {
    const response = await middleware(
      request("/api/invitations", { auth_token: forged, invite_token: forged }),
    );
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
