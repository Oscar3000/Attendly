/**
 * API endpoint for individual invitation management
 * GET /api/invitations/[id] - Get invitation by ID
 * PUT /api/invitations/[id] - Update invitation
 * DELETE /api/invitations/[id] - Delete invitation
 * PATCH /api/invitations/[id] - Update RSVP status
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { InviteDetails } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const invitation = await db.getInvitationById(id);

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ invitation }, { status: 200 });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Partial<Omit<InviteDetails, "id" | "createdAt">> = {
      name: body.name,
      venue: body.venue,
      status: body.status,
      plusOne: body.plusOne,
    };
    if (body.eventDate) {
      updateData.eventDate = new Date(body.eventDate);
    }
    const updatedInvitation = await db.updateInvitation(id, updateData);

    if (!updatedInvitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { invitation: updatedInvitation },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating invitation:", error);
    return NextResponse.json(
      { error: "Failed to update invitation" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const deleted = await db.deleteInvitation(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Invitation deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const updatedInvitation = await db.updateRsvpStatus(id, body.status);

    if (!updatedInvitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { invitation: updatedInvitation },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating RSVP status:", error);
    return NextResponse.json(
      { error: "Failed to update RSVP status" },
      { status: 500 },
    );
  }
}
