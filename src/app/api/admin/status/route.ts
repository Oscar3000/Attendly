/**
 * API endpoint for admin status updates
 * GET /api/admin/status - Get recent status updates
 */
import { NextResponse } from "next/server";
import { metricsRepo } from "@/server/repositories/metrics.repo";

export async function GET() {
  try {
    const statusUpdates = await metricsRepo.getRecentStatusUpdates();
    return NextResponse.json({ statusUpdates }, { status: 200 });
  } catch (error) {
    console.error("Error fetching status updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch status updates" },
      { status: 500 },
    );
  }
}