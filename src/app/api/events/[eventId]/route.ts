/**
 * Update an event's settings (owner only)
 * PUT /api/events/[eventId]
 * Body: every field from the settings page; blank or missing optional fields are cleared
 * (date and rsvpDeadline are datetime-local values on the event's wall clock)
 */
import { NextResponse } from "next/server";
import { handleRoute, NotFoundError } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";
import { eventRepo } from "@/server/repositories/event.repo";
import { parseBody } from "@/server/http/validate";
import { updateEventSchema } from "@/server/validation/event.schemas";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export const PUT = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);
  const updates = await parseBody(request, updateEventSchema);

  const updated = await eventRepo.update(event.id, updates);
  // Deleted between the ownership check and the update
  if (!updated) throw new NotFoundError("Event not found");
  return NextResponse.json({ event: updated }, { status: 200 });
});
