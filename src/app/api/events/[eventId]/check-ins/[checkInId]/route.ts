/**
 * One check-in (owner only, T-509); door helpers can't undo
 * DELETE /api/events/[eventId]/check-ins/[checkInId] - Undo a check-in made by mistake
 */
import { NextResponse } from "next/server";
import { checkInRepo } from "@/server/repositories/check-in.repo";
import { handleRoute, NotFoundError } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";

interface RouteParams {
  params: Promise<{ eventId: string; checkInId: string }>;
}

export const DELETE = handleRoute(async (request, { params }: RouteParams) => {
  const { eventId, checkInId } = await params;
  const { event } = await requireEventOwner(eventId, request.headers);

  if (!(await checkInRepo.undo(event.id, checkInId))) {
    throw new NotFoundError("Check-in not found");
  }
  return NextResponse.json({ message: "Check-in undone" });
});
