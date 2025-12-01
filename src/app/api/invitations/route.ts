/**
 * API endpoint for managing invitations
 * GET /api/invitations - Get all invitations (admin)
 * POST /api/invitations - Create new invitation
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import type { InviteDetails } from "@/lib/types";

export async function GET() {
  try {
    const invitations = db.getAllInvitations();
    return NextResponse.json({ invitations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['guestName', 'guestEmail', 'eventDate', 'venue'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Create the invitation
    const newInvitation = db.createInvitation({
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      qrCode: `QR_CODE_DATA_${Date.now()}`, // Generate unique QR code data
      eventDate: new Date(body.eventDate),
      venue: body.venue,
      rsvpStatus: body.rsvpStatus || "pending",
      plusOne: body.plusOne || 0,
      dietaryRestrictions: body.dietaryRestrictions || "",
      message: body.message || "",
    });

    return NextResponse.json({ invitation: newInvitation }, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}