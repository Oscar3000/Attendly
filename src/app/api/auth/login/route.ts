import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, UnauthorizedError } from "@/server/http/errors";
import { parseBody } from "@/server/http/validate";
import { createFailureLimiter, getClientIp } from "@/server/http/rate-limit";
import { sessionCookieOptions, signSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { secretsMatch } from "@/server/auth/compare";

/**
 * Admin login API endpoint
 * POST /api/auth/login
 * Body: { password: string }
 * Response: { message: string } or { error: string }; the session is set as an HTTP-only cookie
 * 429 with Retry-After after 5 failed attempts per minute per IP
 */

const bodySchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const limiter = createFailureLimiter({ name: "login", maxFailures: 5, windowMs: 60_000 });

export const POST = handleRoute(async (request) => {
  const ip = getClientIp(request);
  await limiter.assertAllowed(ip);

  const { password } = await parseBody(request, bodySchema);

  if (!secretsMatch(password, getEnv().ADMIN_PASSWORD)) {
    await limiter.recordFailure(ip);
    throw new UnauthorizedError("Invalid password");
  }

  await limiter.reset(ip);
  const token = await signSession("admin");

  const response = NextResponse.json({ message: "Login successful" }, { status: 200 });
  response.cookies.set("auth_token", token, sessionCookieOptions);

  return response;
});
