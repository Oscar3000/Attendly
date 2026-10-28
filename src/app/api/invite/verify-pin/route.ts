import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, UnauthorizedError } from "@/server/http/errors";
import { parseBody } from "@/server/http/validate";
import { createFailureLimiter, getClientIp } from "@/server/http/rate-limit";
import { sessionCookieOptions, signSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { secretsMatch } from "@/server/auth/compare";

/**
 * Invite PIN verification API endpoint
 * POST /api/invite/verify-pin
 * Body: { pin: string }
 * Response: { message: string } or { error: string }; the session is set as an HTTP-only cookie
 * 429 with Retry-After after 10 failed attempts per minute per IP
 */

const bodySchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});

// Higher than login: guests at the venue often share one IP
const limiter = createFailureLimiter({ name: "invite-pin", maxFailures: 10, windowMs: 60_000 });

export const POST = handleRoute(async (request) => {
  const ip = getClientIp(request);
  await limiter.assertAllowed(ip);

  const { pin } = await parseBody(request, bodySchema);

  if (!secretsMatch(pin, getEnv().INVITE_PIN)) {
    await limiter.recordFailure(ip);
    throw new UnauthorizedError("Invalid PIN");
  }

  await limiter.reset(ip);
  const token = await signSession("guest");

  const response = NextResponse.json({ message: "PIN verified" }, { status: 200 });
  response.cookies.set("invite_token", token, sessionCookieOptions);

  return response;
});
