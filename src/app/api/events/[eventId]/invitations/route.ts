/**
 * An event's invitations (owner only)
 * GET  /api/events/[eventId]/invitations?page&limit&search - Paginated list
 * POST /api/events/[eventId]/invitations - Create an invitation in the event
 */
import { NextResponse } from "next/server";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { handleRoute } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";
import { parseBody, parseQuery } from "@/server/http/validate";
import {
  adminInvitationsQuerySchema,
  createInvitationSchema,
} from "@/server/validation/invitation.schemas";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export const GET = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);
  const { page, limit, search } = parseQuery(request, adminInvitationsQuerySchema);

  const { invitations, pagination } = await invitationRepo.getAdminInvitations(
    event.id,
    page,
    limit,
    search,
  );
  return NextResponse.json({ invitations, pagination }, { status: 200 });
});

export const POST = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);
  const body = await parseBody(request, createInvitationSchema);

  const invitation = await invitationRepo.createInvitation(event, body);
  return NextResponse.json({ invitation }, { status: 201 });
});
