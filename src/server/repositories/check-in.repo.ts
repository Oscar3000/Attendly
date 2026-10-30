/**
 * Door check-in repository (T-504): admitting people on an invitation, at most plusOne + 1 in
 * total. Scoped to one event: another event's ticket is treated exactly like an unknown one
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { CheckInGuest, CheckInResponse } from "@/lib/check-in";

// The API's JSON (src/lib/check-in.ts), before dates are serialised
export type CheckInResult =
  | Exclude<CheckInResponse, { result: "full" }>
  | {
      result: "full";
      guest: CheckInGuest;
      lastCheckIn: { at: Date; by: string | null } | null;
    };

// Who is admitting: the event owner's account, or a door helper's link (T-507)
export type CheckInBy = { userId: string } | { doorLinkId: string };

// What a scan finds before admitting anyone: a final answer (unknown, not valid, everyone in),
// or the invitation with places left
async function lookUp(
  client: Prisma.TransactionClient,
  eventId: string,
  accessToken: string,
): Promise<{ answer: CheckInResult } | { id: string; guest: CheckInGuest; remaining: number }> {
  const invitation = await client.invitation.findUnique({
    where: { accessToken, eventId },
    select: { id: true, name: true, plusOne: true, admittedCount: true, status: true },
  });
  if (!invitation) return { answer: { result: "not_found" } };
  if (invitation.status === "DECLINED" || invitation.status === "RESCINDED") {
    const status = invitation.status === "DECLINED" ? "declined" : "rescinded";
    return { answer: { result: "not_valid", guest: { name: invitation.name }, status } };
  }

  const guest = {
    name: invitation.name,
    admits: invitation.plusOne + 1,
    admitted: invitation.admittedCount,
  };
  const remaining = guest.admits - guest.admitted;
  if (remaining > 0) return { id: invitation.id, guest, remaining };

  const last = await client.checkIn.findFirst({
    where: { invitationId: invitation.id },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      checkedInBy: { select: { name: true } },
      doorLink: { select: { name: true } },
    },
  });
  const lastCheckIn = last && {
    at: last.createdAt,
    by: last.checkedInBy?.name ?? last.doorLink?.name ?? null,
  };
  return { answer: { result: "full", guest, lastCheckIn } };
}

// Another scan got in between this one's read and its update; read again
const RACED = Symbol("raced");

async function attempt(
  tx: Prisma.TransactionClient,
  eventId: string,
  accessToken: string,
  count: number | undefined,
  by: CheckInBy,
): Promise<CheckInResult | typeof RACED> {
  const found = await lookUp(tx, eventId, accessToken);
  if ("answer" in found) return found.answer;
  const { guest, remaining } = found;

  // Without a count, everyone still to come in
  const requested = count ?? remaining;
  if (requested > remaining) return { result: "too_many", guest, requested };

  // The limit is enforced here, in one statement, not by the read above: two helpers scanning
  // the same code at the same moment can't both pass it. Checking in counts as confirming
  const updated = await tx.$queryRaw<{ admittedCount: number }[]>`
    UPDATE "invitations"
    SET "admittedCount" = "admittedCount" + ${requested}, "status" = 'CONFIRMED', "updatedAt" = NOW()
    WHERE "id" = ${found.id}
      AND "status" NOT IN ('DECLINED', 'RESCINDED')
      AND "admittedCount" + ${requested} <= "plusOne" + 1
    RETURNING "admittedCount"`;
  if (updated.length === 0) return RACED;

  await tx.checkIn.create({
    data: {
      invitationId: found.id,
      eventId,
      count: requested,
      ...("userId" in by ? { checkedInByUserId: by.userId } : { doorLinkId: by.doorLinkId }),
    },
  });
  return {
    result: "admitted",
    guest: { ...guest, admitted: Number(updated[0]!.admittedCount) },
    count: requested,
  };
}

// The check-in panel on the event dashboard (T-509)
export interface CheckInSummary {
  // People let in so far, out of everyone on invitations that aren't declined or cancelled
  admitted: number;
  expected: number;
  // Invitations with at least one person in, out of those still valid
  invitationsCheckedIn: number;
  invitations: number;
}

export interface CheckInEntry {
  id: string;
  guestName: string;
  count: number;
  at: Date;
  // The host's name or the door helper link's; null if that account was deleted
  by: string | null;
}

export const checkInRepo = {
  // What admitting would find, without admitting anyone: "ready" when there are places left
  // (T-505: the scanner then asks how many are coming in)
  async preview(eventId: string, accessToken: string): Promise<CheckInResult> {
    const found = await lookUp(prisma, eventId, accessToken);
    return "answer" in found ? found.answer : { result: "ready", guest: found.guest };
  },

  // Admit `count` people (default: everyone left) on the invitation with this ticket token
  async checkIn(
    eventId: string,
    accessToken: string,
    count: number | undefined,
    by: CheckInBy,
  ): Promise<CheckInResult> {
    // A raced attempt changed nothing; the next read sees the other scan's result
    for (let tries = 0; tries < 3; tries++) {
      const outcome = await prisma.$transaction((tx) =>
        attempt(tx, eventId, accessToken, count, by),
      );
      if (outcome !== RACED) return outcome;
    }
    throw new Error("Check-in kept racing with other scans");
  },

  async summary(eventId: string): Promise<CheckInSummary> {
    const valid = { eventId, status: { notIn: ["DECLINED" as const, "RESCINDED" as const] } };
    const [totals, invitationsCheckedIn] = await Promise.all([
      prisma.invitation.aggregate({
        where: valid,
        _count: true,
        _sum: { plusOne: true, admittedCount: true },
      }),
      prisma.invitation.count({ where: { ...valid, admittedCount: { gt: 0 } } }),
    ]);
    return {
      admitted: totals._sum.admittedCount ?? 0,
      // Each invitation is its guest plus their plus-ones
      expected: totals._count + (totals._sum.plusOne ?? 0),
      invitationsCheckedIn,
      invitations: totals._count,
    };
  },

  // Newest first
  async recent(eventId: string, limit = 10): Promise<CheckInEntry[]> {
    const rows = await prisma.checkIn.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        count: true,
        createdAt: true,
        invitation: { select: { name: true } },
        checkedInBy: { select: { name: true } },
        doorLink: { select: { name: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      guestName: row.invitation.name,
      count: row.count,
      at: row.createdAt,
      by: row.checkedInBy?.name ?? row.doorLink?.name ?? null,
    }));
  },

  // Undo a check-in made by mistake: those people are no longer counted as in, so the ticket
  // admits them again. Once nobody on the invitation is in, it goes back to pending, as checking
  // in had confirmed it. False if the check-in isn't in this event
  async undo(eventId: string, id: string): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const checkIn = await tx.checkIn.findUnique({
        where: { id, eventId },
        select: { invitationId: true, count: true },
      });
      if (!checkIn) return false;

      await tx.checkIn.delete({ where: { id } });
      await tx.$executeRaw`
        UPDATE "invitations"
        SET "admittedCount" = GREATEST("admittedCount" - ${checkIn.count}, 0),
            "status" = CASE
              WHEN "admittedCount" - ${checkIn.count} <= 0 AND "status" = 'CONFIRMED'
              THEN 'PENDING'::"rsvp_status" ELSE "status" END,
            "updatedAt" = NOW()
        WHERE "id" = ${checkIn.invitationId}`;
      return true;
    });
  },
};
