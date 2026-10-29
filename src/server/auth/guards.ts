/**
 * Guard for the invitation endpoints guests share with the dashboard
 * Admin-only endpoints call requireAdminUser() from current-user.ts instead
 * Throws ApiErrors so handleRoute turns them into 401/403 responses
 */
import "server-only";
import type { NextRequest } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";
import { getCurrentUser, isAdminEmail, type CurrentUser } from "./current-user";
import { verifySession } from "./session";

export type InvitationCaller = { role: "admin"; user: CurrentUser } | { role: "guest" };

// The admin account or a guest (PIN) session; other accounts get 403, no session gets 401
export async function requireAdminOrGuest(request: NextRequest): Promise<InvitationCaller> {
  const [user, guest] = await Promise.all([
    getCurrentUser(request.headers),
    verifySession(request.cookies.get("invite_token")?.value, "guest"),
  ]);

  if (user && isAdminEmail(user.email)) return { role: "admin", user };
  if (guest) return { role: "guest" };
  if (user) throw new ForbiddenError();
  throw new UnauthorizedError();
}
