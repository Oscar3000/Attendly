import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Account routes need a session. Optimistic: this only checks that a Better Auth session
 * cookie is present (no DB call here); route handlers and pages verify the session and event
 * ownership themselves. Guest tickets (/e/[slug]/i/[token]) and door helper links (/door/[token])
 * carry their own credential in the URL, so they don't come through here
 */
export async function middleware(request: NextRequest) {
  if (getSessionCookie(request) !== null) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

// (/admin redirects to /dashboard in next.config.ts, before middleware runs)
export const config = {
  matcher: ["/dashboard/:path*", "/api/events/:path*"],
};
