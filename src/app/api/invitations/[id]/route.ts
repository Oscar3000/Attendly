/**
 * A guest's own invitation, for shared-PIN guests (the /invite/[id] page)
 * GET /api/invitations/[id] - Read the invitation
 * PATCH /api/invitations/[id] - Update its RSVP status
 * Hosts use /api/events/[eventId]/invitations/[id]. The PIN isn't tied to an event, so the id
 * in the guest's link identifies the invitation; replaced by per-invitation links (T-502 – T-505)
 */
import { NextResponse } from "next/server";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { handleRoute, NotFoundError } from "@/server/http/errors";
import { requireGuest } from "@/server/auth/guards";
import { parseBody } from "@/server/http/validate";
import { updateRsvpStatusSchema } from "@/server/validation/invitation.schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = handleRoute(async (request, { params }: RouteParams) => {
  await requireGuest(request);
  const { id } = await params;

  const invitation = await invitationRepo.getInvitationForGuest(id);
  if (!invitation) throw new NotFoundError("Invitation not found");
  return NextResponse.json({ invitation }, { status: 200 });
});

export const PATCH = handleRoute(async (request, { params }: RouteParams) => {
  await requireGuest(request);
  const { id } = await params;
  const { status } = await parseBody(request, updateRsvpStatusSchema);

  const invitation = await invitationRepo.updateRsvpStatusForGuest(id, status);
  if (!invitation) throw new NotFoundError("Invitation not found");
  return NextResponse.json({ invitation }, { status: 200 });
});
