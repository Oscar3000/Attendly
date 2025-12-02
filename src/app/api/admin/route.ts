/**
 * API endpoint for admin metrics
 * GET /api/admin/metrics - Get admin dashboard metrics
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/database";

export async function GET() {
  try {
    const metrics = db.getAdminMetrics();
    const invitations = db.getAdminInvitations();

    return NextResponse.json(
      {
        metrics,
        invitations,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin metrics" },
      { status: 500 },
    );
  }
}
