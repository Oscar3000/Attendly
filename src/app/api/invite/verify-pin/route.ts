import { NextRequest, NextResponse } from 'next/server';

/**
 * Invite PIN verification API endpoint
 * POST /api/invite/verify-pin
 * Body: { pin: string }
 * Response: { token: string } or { error: string }
 */

const INVITE_PIN = process.env.INVITE_PIN || '1234';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { error: 'PIN is required' },
        { status: 400 }
      );
    }

    if (pin !== INVITE_PIN) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
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
  } catch (error) {
    console.error('PIN verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
