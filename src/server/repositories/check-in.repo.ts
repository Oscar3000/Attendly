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

// Who is admitting: the event owner's account (door helper links come in T-506)
export interface CheckInBy {
  userId: string;
}

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
    select: { createdAt: true, checkedInBy: { select: { name: true } } },
  });
  const lastCheckIn = last && { at: last.createdAt, by: last.checkedInBy?.name ?? null };
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
    data: { invitationId: found.id, eventId, count: requested, checkedInByUserId: by.userId },
  });
  return {
    result: "admitted",
    guest: { ...guest, admitted: Number(updated[0]!.admittedCount) },
    count: requested,
  };
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
};
