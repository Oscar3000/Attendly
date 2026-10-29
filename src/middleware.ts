import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { verifySession } from "@/server/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic: only checks that a Better Auth session cookie is present (no DB call here).
  // Route handlers and pages verify the session and the admin account themselves
  const isSignedIn = () => getSessionCookie(request) !== null;
  // Guest tokens are signed, so a missing, forged or expired cookie counts as signed out
  const isGuest = async () =>
    (await verifySession(request.cookies.get("invite_token")?.value, "guest")) !== null;

  // Define protected routes
  const adminRoutes = ["/admin", "/api/admin"];
  const inviteRoutes = ["/invite"];
  const apiInvitationsRoutes = ["/api/invitations"];

  // Check if current route is protected
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  const isInviteRoute = inviteRoutes.some((route) => pathname.startsWith(route));

  const isApiInvitationsRoute = apiInvitationsRoutes.some((route) => pathname.startsWith(route));

  // Allow login and auth endpoints without authentication
  if (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/invite/verify-pin") ||
    pathname === "/login" ||
    pathname === "/invite-pin"
  ) {
    return NextResponse.next();
  }

  // Check admin authentication
  if (isAdminRoute && !isSignedIn()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Check API invitations authentication (either admin OR guest session)
  if (isApiInvitationsRoute && !isSignedIn() && !(await isGuest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check invite authentication
  if (isInviteRoute && !(await isGuest())) {
    // Preserve the original URL as redirect parameter
    const redirectUrl = new URL("/invite-pin", request.url);
    redirectUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Apply middleware to specific routes
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/invitations/:path*", "/invite/:path*"],
};
