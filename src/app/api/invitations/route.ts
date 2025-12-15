/**
 * API endpoint for managing invitations
 * GET /api/invitations - Get all invitations (admin)
 * POST /api/invitations - Create new invitation
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";


export async function GET() {
  try {
    const invitations = await db.getAllInvitations();
    return NextResponse.json({ invitations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "eventDate", "venue"];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Create the invitation
    const newInvitation = await db.createInvitation({
      name: body.name,
      eventDate: new Date(body.eventDate),
      venue: body.venue,
      status: body.status || "pending",
      plusOne: body.plusOne || 0,
    });

    return NextResponse.json({ invitation: newInvitation }, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}
