/**
 * Bulk create invitations
 * POST /api/invitations/bulk
 * Body: { eventDate, venue, status?, rows: { name, plusOne? }[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { RsvpStatus } from "@/lib/types";

interface BulkRow {
  name: string;
  plusOne?: number;
}

interface BulkBody {
  eventDate: string;
  venue: string;
  status?: RsvpStatus;
  rows: BulkRow[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<BulkBody>;

    if (!body.eventDate || !body.venue) {
      return NextResponse.json(
        { error: "Missing required fields: eventDate, venue" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json(
        { error: "rows must be a non-empty array" },
        { status: 400 },
      );
    }

    const eventDate = new Date(body.eventDate);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid eventDate" },
        { status: 400 },
      );
    }

    const status: RsvpStatus = body.status ?? "pending";
    const created: { row: number; name: string; id: string }[] = [];
    const failed: { row: number; name: string; error: string }[] = [];

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i]!;
      const rowNum = i + 1;
      const name = (row.name ?? "").trim();

      if (!name) {
        failed.push({ row: rowNum, name: row.name ?? "", error: "Name is required" });
        continue;
      }

      const plusOne = Number.isFinite(row.plusOne) ? Math.max(0, Math.floor(row.plusOne as number)) : 0;

      try {
        const invite = await db.createInvitation({
          name,
          eventDate,
          venue: body.venue,
          status,
          plusOne,
        });
        created.push({ row: rowNum, name, id: invite.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        failed.push({ row: rowNum, name, error: message });
      }
    }

    return NextResponse.json(
      {
        created,
        failed,
        summary: {
          total: body.rows.length,
          createdCount: created.length,
          failedCount: failed.length,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error bulk-creating invitations:", error);
    return NextResponse.json(
      { error: "Failed to bulk create invitations" },
      { status: 500 },
    );
  }
}
