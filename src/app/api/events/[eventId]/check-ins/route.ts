/**
 * An event's check-ins (owner only, T-509)
 * GET /api/events/[eventId]/check-ins - { summary, recent }: people in vs expected, and the
 *     latest check-ins with who admitted them
 */
import { NextResponse } from "next/server";
import { checkInRepo } from "@/server/repositories/check-in.repo";
import { handleRoute } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export const GET = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);
  const [summary, recent] = await Promise.all([
    checkInRepo.summary(event.id),
    checkInRepo.recent(event.id),
  ]);
  return NextResponse.json({ summary, recent });
});
