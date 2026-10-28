import { NextResponse } from "next/server";
import { z } from "zod";
import { handleRoute, UnauthorizedError } from "@/server/http/errors";
import { parseBody } from "@/server/http/validate";
import { sessionCookieOptions, signSession } from "@/server/auth/session";

/**
 * Admin login API endpoint
 * POST /api/auth/login
 * Body: { password: string }
 * Response: { message: string } or { error: string }; the session is set as an HTTP-only cookie
 */

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const bodySchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const POST = handleRoute(async (request) => {
  const { password } = await parseBody(request, bodySchema);

  if (password !== ADMIN_PASSWORD) {
    throw new UnauthorizedError("Invalid password");
  }

  const token = await signSession("admin");

  const response = NextResponse.json({ message: "Login successful" }, { status: 200 });
  response.cookies.set("auth_token", token, sessionCookieOptions);

  return response;
});
