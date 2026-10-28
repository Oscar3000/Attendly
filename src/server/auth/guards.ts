/**
 * Route handler auth guards
 * Throw ApiErrors so handleRoute turns them into 401/403 responses
 * Middleware does a coarse check first; these decide what each endpoint allows
 */
import "server-only";
import type { NextRequest } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";
import { verifySession, type Session } from "./session";

async function getSessions(request: NextRequest) {
  const [admin, guest] = await Promise.all([
    verifySession(request.cookies.get("auth_token")?.value, "admin"),
    verifySession(request.cookies.get("invite_token")?.value, "guest"),
  ]);
  return { admin, guest };
}

// Admin only: a guest gets 403, no session gets 401
export async function requireAdmin(request: NextRequest): Promise<Session> {
  const { admin, guest } = await getSessions(request);
  if (admin) return admin;
  if (guest) throw new ForbiddenError();
  throw new UnauthorizedError();
}

// Admin or guest (guest endpoints are also usable from the admin dashboard)
export async function requireAdminOrGuest(request: NextRequest): Promise<Session> {
  const { admin, guest } = await getSessions(request);
  const session = admin ?? guest;
  if (!session) throw new UnauthorizedError();
  return session;
}
