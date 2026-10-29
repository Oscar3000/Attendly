/**
 * API endpoint for individual invitation management
 * GET /api/invitations/[id] - Get invitation by ID (admin or guest)
 * PUT /api/invitations/[id] - Update invitation (admin)
 * DELETE /api/invitations/[id] - Delete invitation (admin)
 * PATCH /api/invitations/[id] - Update RSVP status (admin or guest)
 */
import { NextResponse } from "next/server";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { handleRoute, NotFoundError } from "@/server/http/errors";
import { requireAdminUser } from "@/server/auth/current-user";
import { requireAdminOrGuest } from "@/server/auth/guards";
import { parseBody } from "@/server/http/validate";
import {
  updateInvitationSchema,
  updateRsvpStatusSchema,
} from "@/server/validation/invitation.schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const GET = handleRoute(async (request, { params }: RouteParams) => {
  await requireAdminOrGuest(request);
  const { id } = await params;
  const invitation = await invitationRepo.getInvitationById(id);

  if (!invitation) {
    throw new NotFoundError("Invitation not found");
  }

  return NextResponse.json({ invitation }, { status: 200 });
});

export const PUT = handleRoute(async (request, { params }: RouteParams) => {
  await requireAdminUser(request.headers);
  const { id } = await params;
  const updates = await parseBody(request, updateInvitationSchema);

  const updatedInvitation = await invitationRepo.updateInvitation(id, updates);

  if (!updatedInvitation) {
    throw new NotFoundError("Invitation not found");
  }

  return NextResponse.json({ invitation: updatedInvitation }, { status: 200 });
});

export const DELETE = handleRoute(async (request, { params }: RouteParams) => {
  await requireAdminUser(request.headers);
  const { id } = await params;
  const deleted = await invitationRepo.deleteInvitation(id);

  if (!deleted) {
    throw new NotFoundError("Invitation not found");
  }

  return NextResponse.json({ message: "Invitation deleted successfully" }, { status: 200 });
});

export const PATCH = handleRoute(async (request, { params }: RouteParams) => {
  await requireAdminOrGuest(request);
  const { id } = await params;
  const { status } = await parseBody(request, updateRsvpStatusSchema);

  const updatedInvitation = await invitationRepo.updateRsvpStatus(id, status);

  if (!updatedInvitation) {
    throw new NotFoundError("Invitation not found");
  }

  return NextResponse.json({ invitation: updatedInvitation }, { status: 200 });
});
