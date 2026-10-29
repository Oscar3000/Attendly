/**
 * Create an event
 * POST /api/events - any signed-in user; they become its owner
 * Body: { title, type, date, timezone, venueName?, venueAddress?, rsvpDeadline? }
 * (date and rsvpDeadline are datetime-local values on the event's wall clock)
 */
import { NextResponse } from "next/server";
import { handleRoute } from "@/server/http/errors";
import { requireUser } from "@/server/auth/current-user";
import { createEvent } from "@/server/events/create-event";
import { parseBody } from "@/server/http/validate";
import { createEventSchema } from "@/server/validation/event.schemas";

export const POST = handleRoute(async (request) => {
  const user = await requireUser(request.headers);
  const input = await parseBody(request, createEventSchema);

  const event = await createEvent(user.id, input);
  return NextResponse.json({ event }, { status: 201 });
});
