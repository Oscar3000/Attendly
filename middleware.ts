import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get auth tokens from cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const inviteToken = request.cookies.get('invite_token')?.value;

  // Define protected routes
  const adminRoutes = ['/admin', '/api/admin'];
  const inviteRoutes = ['/invite'];
  const apiInvitationsRoutes = ['/api/invitations'];
  
  // Check if current route is protected
  const isAdminRoute = adminRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  const isInviteRoute = inviteRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  const isApiInvitationsRoute = apiInvitationsRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Allow login and auth endpoints without authentication
  if (
    request.nextUrl.pathname.startsWith('/api/auth/') ||
    request.nextUrl.pathname.startsWith('/api/invite/verify-pin') ||
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/invite-pin'
  ) {
    return NextResponse.next();
  }

  // Check admin authentication
  if (isAdminRoute && !authToken) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Check API invitations authentication (either auth_token OR invite_token)
  if (isApiInvitationsRoute && !authToken && !inviteToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check invite authentication
  if (isInviteRoute && !inviteToken) {
    // Preserve the original URL as redirect parameter
    const redirectUrl = new URL('/invite-pin', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Apply middleware to specific routes
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/invitations/:path*', '/invite/:path*'],
};
