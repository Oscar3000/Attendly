/**
 * An event's recent RSVP status updates (owner only)
 * GET /api/events/[eventId]/status
 */
import { NextResponse } from "next/server";
import { metricsRepo } from "@/server/repositories/metrics.repo";
import { handleRoute } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export const GET = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);
  const statusUpdates = await metricsRepo.getRecentStatusUpdates(event.id);
  return NextResponse.json({ statusUpdates }, { status: 200 });
});
