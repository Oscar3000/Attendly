/**
 * API endpoint for admin status updates
 * GET /api/admin/status - Get recent status updates
 */
import { NextResponse } from "next/server";
import { metricsRepo } from "@/server/repositories/metrics.repo";
import { handleRoute } from "@/server/http/errors";
import { requireAdmin } from "@/server/auth/guards";

export const GET = handleRoute(async (request) => {
  await requireAdmin(request);
  const statusUpdates = await metricsRepo.getRecentStatusUpdates();
  return NextResponse.json({ statusUpdates }, { status: 200 });
});
