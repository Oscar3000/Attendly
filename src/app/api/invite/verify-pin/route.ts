import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleRoute, UnauthorizedError } from '@/server/http/errors';
import { parseBody } from '@/server/http/validate';

/**
 * Invite PIN verification API endpoint
 * POST /api/invite/verify-pin
 * Body: { pin: string }
 * Response: { token: string } or { error: string }
 */

const INVITE_PIN = process.env.INVITE_PIN || '1234';

const bodySchema = z.object({
  pin: z.string().min(1, 'PIN is required'),
});

export const POST = handleRoute(async (request) => {
  const { pin } = await parseBody(request, bodySchema);

  if (pin !== INVITE_PIN) {
    throw new UnauthorizedError('Invalid PIN');
  }

  // Generate a simple token
  const token = Buffer.from(`invite:${Date.now()}`).toString('base64');

  const response = NextResponse.json(
    { token, message: 'PIN verified' },
    { status: 200 }
  );

  // Set secure HTTP-only cookie
  response.cookies.set('invite_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });

  return response;
});
