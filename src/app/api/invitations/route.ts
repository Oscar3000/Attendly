/**
 * API endpoint for managing invitations
 * GET /api/invitations - Get all invitations (admin)
 * POST /api/invitations - Create new invitation (admin)
 */
import { NextResponse } from "next/server";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { handleRoute } from "@/server/http/errors";
import { requireAdmin } from "@/server/auth/guards";
import { parseBody } from "@/server/http/validate";
import { createInvitationSchema } from "@/server/validation/invitation.schemas";

export const GET = handleRoute(async (request) => {
  await requireAdmin(request);
  const invitations = await invitationRepo.getAllInvitations();
  return NextResponse.json({ invitations }, { status: 200 });
});

export const POST = handleRoute(async (request) => {
  await requireAdmin(request);
  const body = await parseBody(request, createInvitationSchema);

  const newInvitation = await invitationRepo.createInvitation(body);

  return NextResponse.json({ invitation: newInvitation }, { status: 201 });
});
