/**
 * Bulk create invitations
 * POST /api/invitations/bulk
 * Body: { status?, rows: { name, plusOne? }[] } (max 1000 rows); the date and venue come from the event
 * Superseded by /api/events/[eventId]/invitations/bulk (T-307); removed in T-312
 */
import { NextResponse } from "next/server";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { handleRoute } from "@/server/http/errors";
import { requireAdminUser } from "@/server/auth/current-user";
import { requireCurrentEvent } from "@/server/events/current-event";
import { parseBody } from "@/server/http/validate";
import { bulkCreateInvitationsSchema } from "@/server/validation/invitation.schemas";

export const POST = handleRoute(async (request) => {
  const user = await requireAdminUser(request.headers);
  const { status, rows } = await parseBody(request, bulkCreateInvitationsSchema);
  const event = await requireCurrentEvent(user.id);

  const result = await invitationRepo.createInvitations(event, status, rows);
  return NextResponse.json(result, { status: 201 });
});
