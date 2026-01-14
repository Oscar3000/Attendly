import { NextResponse } from 'next/server';

/**
 * Admin logout API endpoint
 * POST /api/auth/logout
 * Clears the authentication token
 */

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logout successful' },
    { status: 200 }
  );

  // Clear auth token cookie
  response.cookies.delete('auth_token');

  return response;
}
