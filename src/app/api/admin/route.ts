/**
 * API endpoint for admin metrics
 * GET /api/admin - Get admin dashboard metrics and invitations
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const metrics = await db.getAdminMetrics();
    const invitations = await db.getAdminInvitations();

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
