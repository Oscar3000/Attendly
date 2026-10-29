/**
 * An event's dashboard metrics (owner only)
 * GET /api/events/[eventId]/metrics
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
  const metrics = await metricsRepo.getAdminMetrics(event.id);
  return NextResponse.json({ metrics }, { status: 200 });
});
