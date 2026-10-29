/**
 * API endpoint for admin status updates
 * GET /api/admin/status - Get recent status updates
 */
import { NextResponse } from "next/server";
import { metricsRepo } from "@/server/repositories/metrics.repo";
import { handleRoute } from "@/server/http/errors";
import { requireAdminUser } from "@/server/auth/current-user";
import { requireCurrentEvent } from "@/server/events/current-event";

export const GET = handleRoute(async (request) => {
  const user = await requireAdminUser(request.headers);
  const event = await requireCurrentEvent(user.id);
  const statusUpdates = await metricsRepo.getRecentStatusUpdates(event.id);
  return NextResponse.json({ statusUpdates }, { status: 200 });
});
