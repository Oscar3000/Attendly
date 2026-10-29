/**
 * Route handler auth guards
 * Throw ApiErrors so handleRoute turns them into 401/403 responses
 * Middleware does a coarse check first; these decide what each endpoint allows
 */
import "server-only";
import type { NextRequest } from "next/server";
import { getEnv } from "@/server/env";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";
import { getAuth } from "./auth";
import { verifySession, type Session } from "./session";

// Every account can sign in, but only ADMIN_EMAIL may use the dashboard until
// invitations are scoped per owner (Phase 3)
export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === getEnv().ADMIN_EMAIL.toLowerCase();
}

async function getSessions(request: NextRequest) {
  const [authSession, guest] = await Promise.all([
    getAuth().api.getSession({ headers: request.headers }),
    verifySession(request.cookies.get("invite_token")?.value, "guest"),
  ]);
  const user = authSession?.user ?? null;
  const admin: Session | null = user && isAdminEmail(user.email) ? { role: "admin" } : null;
  return { user, admin, guest };
}

// Admin only: a signed-in non-admin or a guest gets 403, no session gets 401
export async function requireAdmin(request: NextRequest): Promise<Session> {
  const { user, admin, guest } = await getSessions(request);
  if (admin) return admin;
  if (user || guest) throw new ForbiddenError();
  throw new UnauthorizedError();
}

// Admin or guest (guest endpoints are also usable from the admin dashboard)
export async function requireAdminOrGuest(request: NextRequest): Promise<Session> {
  const { user, admin, guest } = await getSessions(request);
  const session = admin ?? guest;
  if (session) return session;
  if (user) throw new ForbiddenError();
  throw new UnauthorizedError();
}
