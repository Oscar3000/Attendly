import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRoute, UnauthorizedError } from '@/server/http/errors';
import { parseBody } from '@/server/http/validate';

/**
 * Admin login API endpoint
 * POST /api/auth/login
 * Body: { password: string }
 * Response: { token: string } or { error: string }
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const bodySchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const POST = handleRoute(async (request) => {
  const { password } = await parseBody(request, bodySchema);

  if (password !== ADMIN_PASSWORD) {
    throw new UnauthorizedError('Invalid password');
  }

  // Generate a simple token (in production, use JWT)
  const token = Buffer.from(`admin:${Date.now()}`).toString('base64');

  const response = NextResponse.json(
    { token, message: 'Login successful' },
    { status: 200 }
  );

  // Set secure HTTP-only cookie
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });

  return response;
});
