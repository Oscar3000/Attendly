/**
 * One invitation in an event (owner only; guests use /api/invitations/[id] until T-508)
 * GET    /api/events/[eventId]/invitations/[id]
 * PUT    /api/events/[eventId]/invitations/[id] - Update name, status or plusOne
 * PATCH  /api/events/[eventId]/invitations/[id] - Update RSVP status
 * DELETE /api/events/[eventId]/invitations/[id]
 * An invitation from another event is a 404, like a missing one
 */
import { NextResponse } from "next/server";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { handleRoute, NotFoundError } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";
import { parseBody } from "@/server/http/validate";
import {
  updateInvitationSchema,
  updateRsvpStatusSchema,
} from "@/server/validation/invitation.schemas";

interface RouteParams {
  params: Promise<{ eventId: string; id: string }>;
}

const notFound = () => new NotFoundError("Invitation not found");

export const GET = handleRoute(async (request, { params }: RouteParams) => {
  const { eventId, id } = await params;
  const { event } = await requireEventOwner(eventId, request.headers);

  const invitation = await invitationRepo.getInvitationById(event.id, id);
  if (!invitation) throw notFound();
  return NextResponse.json({ invitation }, { status: 200 });
});

export const PUT = handleRoute(async (request, { params }: RouteParams) => {
  const { eventId, id } = await params;
  const { event } = await requireEventOwner(eventId, request.headers);
  const updates = await parseBody(request, updateInvitationSchema);

  const invitation = await invitationRepo.updateInvitation(event.id, id, updates);
  if (!invitation) throw notFound();
  return NextResponse.json({ invitation }, { status: 200 });
});

export const PATCH = handleRoute(async (request, { params }: RouteParams) => {
  const { eventId, id } = await params;
  const { event } = await requireEventOwner(eventId, request.headers);
  const { status } = await parseBody(request, updateRsvpStatusSchema);

  const invitation = await invitationRepo.updateRsvpStatus(event.id, id, status);
  if (!invitation) throw notFound();
  return NextResponse.json({ invitation }, { status: 200 });
});

export const DELETE = handleRoute(async (request, { params }: RouteParams) => {
  const { eventId, id } = await params;
  const { event } = await requireEventOwner(eventId, request.headers);

  if (!(await invitationRepo.deleteInvitation(event.id, id))) throw notFound();
  return NextResponse.json({ message: "Invitation deleted successfully" }, { status: 200 });
});
