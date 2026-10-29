/**
 * API endpoint for admin metrics
 * GET /api/admin - Get admin dashboard metrics and invitations
 * Query: page?, limit? (max 100), search?
 */
import { NextResponse } from "next/server";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { metricsRepo } from "@/server/repositories/metrics.repo";
import { handleRoute } from "@/server/http/errors";
import { requireAdminUser } from "@/server/auth/current-user";
import { requireCurrentEvent } from "@/server/events/current-event";
import { parseQuery } from "@/server/http/validate";
import { adminInvitationsQuerySchema } from "@/server/validation/invitation.schemas";

export const GET = handleRoute(async (request) => {
  const user = await requireAdminUser(request.headers);
  const { page, limit, search } = parseQuery(request, adminInvitationsQuerySchema);
  const event = await requireCurrentEvent(user.id);

  const metrics = await metricsRepo.getAdminMetrics(event.id);
  const invitationData = await invitationRepo.getAdminInvitations(event.id, page, limit, search);

  return NextResponse.json(
    {
      metrics,
      invitations: invitationData.invitations,
      pagination: invitationData.pagination,
    },
    { status: 200 },
  );
});
