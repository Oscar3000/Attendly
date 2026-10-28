import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, UnauthorizedError } from "@/server/http/errors";
import { parseBody } from "@/server/http/validate";
import { sessionCookieOptions, signSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";

/**
 * Invite PIN verification API endpoint
 * POST /api/invite/verify-pin
 * Body: { pin: string }
 * Response: { message: string } or { error: string }; the session is set as an HTTP-only cookie
 */

const bodySchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});

export const POST = handleRoute(async (request) => {
  const { pin } = await parseBody(request, bodySchema);

  if (pin !== getEnv().INVITE_PIN) {
    throw new UnauthorizedError("Invalid PIN");
  }

  const token = await signSession("guest");

  const response = NextResponse.json({ message: "PIN verified" }, { status: 200 });
  response.cookies.set("invite_token", token, sessionCookieOptions);

  return response;
});
