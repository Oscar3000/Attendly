/**
 * API endpoint for individual invitation management
 * GET /api/invitations/[id] - Get invitation by ID
 * PUT /api/invitations/[id] - Update invitation
 * DELETE /api/invitations/[id] - Delete invitation
 * PATCH /api/invitations/[id] - Update RSVP status
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const invitation = db.getInvitationById(id);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ invitation }, { status: 200 });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedInvitation = db.updateInvitation(id, {
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      venue: body.venue,
      rsvpStatus: body.rsvpStatus,
      plusOne: body.plusOne,
      dietaryRestrictions: body.dietaryRestrictions,
      message: body.message,
    });

    if (!updatedInvitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ invitation: updatedInvitation }, { status: 200 });
  } catch (error) {
    console.error("Error updating invitation:", error);
    return NextResponse.json(
      { error: "Failed to update invitation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const deleted = db.deleteInvitation(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Invitation deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.rsvpStatus) {
      return NextResponse.json(
        { error: "RSVP status is required" },
        { status: 400 }
      );
    }

    const updatedInvitation = db.updateRsvpStatus(id, body.rsvpStatus);

    if (!updatedInvitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ invitation: updatedInvitation }, { status: 200 });
  } catch (error) {
    console.error("Error updating RSVP status:", error);
    return NextResponse.json(
      { error: "Failed to update RSVP status" },
      { status: 500 }
    );
  }
}