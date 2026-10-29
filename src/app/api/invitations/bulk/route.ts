/**
 * Bulk create invitations
 * POST /api/invitations/bulk
 * Body: { status?, rows: { name, plusOne? }[] } (max 1000 rows); the date and venue come from the event
 */
import { NextResponse } from "next/server";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { handleRoute } from "@/server/http/errors";
import { requireAdminUser } from "@/server/auth/current-user";
import { requireCurrentEvent } from "@/server/events/current-event";
import { parseBody } from "@/server/http/validate";
import { bulkCreateInvitationsSchema } from "@/server/validation/invitation.schemas";

export const POST = handleRoute(async (request) => {
  const user = await requireAdminUser(request.headers);
  const { status, rows } = await parseBody(request, bulkCreateInvitationsSchema);
  const event = await requireCurrentEvent(user.id);

  const created: { row: number; name: string; id: string }[] = [];
  const failed: { row: number; name: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rowNum = i + 1;
    const name = row.name.trim();

    if (!name) {
      failed.push({ row: rowNum, name: row.name, error: "Name is required" });
      continue;
    }

    try {
      const invite = await invitationRepo.createInvitation(event, {
        name,
        status,
        plusOne: row.plusOne,
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
        total: rows.length,
        createdCount: created.length,
        failedCount: failed.length,
      },
    },
    { status: 201 },
  );
});
