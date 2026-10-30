/**
 * One door helper link (owner only, T-506)
 * DELETE /api/events/[eventId]/door-links/[linkId] - Revoke it: the link stops working at once,
 *        but stays listed so past check-ins still say who admitted whom
 */
import { NextResponse } from "next/server";
import { doorLinkRepo } from "@/server/repositories/door-link.repo";
import { handleRoute, NotFoundError } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";

interface RouteParams {
  params: Promise<{ eventId: string; linkId: string }>;
}

export const DELETE = handleRoute(async (request, { params }: RouteParams) => {
  const { eventId, linkId } = await params;
  const { event } = await requireEventOwner(eventId, request.headers);

  const doorLink = await doorLinkRepo.revoke(event.id, linkId);
  if (!doorLink) throw new NotFoundError("Door link not found");
  return NextResponse.json({ doorLink });
});
