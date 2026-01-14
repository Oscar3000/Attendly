import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get auth token from cookies
  const authToken = request.cookies.get('auth_token')?.value;

  // Define protected routes
  const protectedRoutes = ['/admin', '/api/admin', '/api/invitations'];
  
  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Allow login and auth endpoints without authentication
  if (
    request.nextUrl.pathname.startsWith('/api/auth/') ||
    request.nextUrl.pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (isProtectedRoute && !authToken) {
    // Redirect to login page
    if (request.nextUrl.pathname.startsWith('/api/')) {
      // For API routes, return unauthorized
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    } else {
      // For pages, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Apply middleware to specific routes
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/invitations/:path*'],
};
