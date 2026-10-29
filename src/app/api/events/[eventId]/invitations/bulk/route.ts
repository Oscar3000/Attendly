/**
 * Bulk create invitations in an event (owner only)
 * POST /api/events/[eventId]/invitations/bulk
 * Body: { status?, rows: { name, plusOne? }[] } (max 1000 rows)
 * Responds 201 with each row's outcome: rows succeed or fail independently
 */
import { NextResponse } from "next/server";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { handleRoute } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";
import { parseBody } from "@/server/http/validate";
import { bulkCreateInvitationsSchema } from "@/server/validation/invitation.schemas";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export const POST = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);
  const { status, rows } = await parseBody(request, bulkCreateInvitationsSchema);

  const result = await invitationRepo.createInvitations(event, status, rows);
  return NextResponse.json(result, { status: 201 });
});
