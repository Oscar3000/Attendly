/**
 * Guard for the shared-PIN guest endpoints (GET/PATCH /api/invitations/[id])
 * Hosts use the event-scoped routes, which call requireEventOwner instead.
 * Removed with the PIN flow in T-508
 */
import "server-only";
import type { NextRequest } from "next/server";
import { UnauthorizedError } from "@/server/http/errors";
import { verifySession, type Session } from "./session";

// A valid guest (PIN) session, else 401
export async function requireGuest(request: NextRequest): Promise<Session> {
  const guest = await verifySession(request.cookies.get("invite_token")?.value, "guest");
  if (!guest) throw new UnauthorizedError();
  return guest;
}
