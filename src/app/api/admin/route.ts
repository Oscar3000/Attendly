/**
 * API endpoint for admin metrics
 * GET /api/admin - Get admin dashboard metrics and invitations
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    
    // Get pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const metrics = await db.getAdminMetrics();
    const invitationData = await db.getAdminInvitations(page, limit);

    return NextResponse.json(
      {
        metrics,
        invitations: invitationData.invitations,
        pagination: invitationData.pagination,
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
