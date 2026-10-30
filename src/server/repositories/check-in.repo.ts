/**
 * Door check-in repository (T-504): admitting people on an invitation, at most plusOne + 1 in
 * total. Scoped to one event: another event's ticket is treated exactly like an unknown one
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export interface CheckInGuest {
  name: string;
  // How many people the invitation lets in, and how many it has let in so far
  admits: number;
  admitted: number;
}

export type CheckInResult =
  | { result: "admitted"; guest: CheckInGuest; count: number }
  // Everyone on the invitation is already in; the last check-in says when and by whom
  | { result: "full"; guest: CheckInGuest; lastCheckIn: { at: Date; by: string | null } | null }
  // Fewer places left than people asked to come in
  | { result: "too_many"; guest: CheckInGuest; requested: number }
  | { result: "not_valid"; guest: { name: string }; status: "declined" | "rescinded" }
  | { result: "not_found" };

// Who is admitting: the event owner's account (door helper links come in T-506)
export interface CheckInBy {
  userId: string;
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
  const invitation = await tx.invitation.findUnique({
    where: { accessToken, eventId },
    select: { id: true, name: true, plusOne: true, admittedCount: true, status: true },
  });
  if (!invitation) return { result: "not_found" };
  if (invitation.status === "DECLINED" || invitation.status === "RESCINDED") {
    return {
      result: "not_valid",
      guest: { name: invitation.name },
      status: invitation.status === "DECLINED" ? "declined" : "rescinded",
    };
  }

  const guest = {
    name: invitation.name,
    admits: invitation.plusOne + 1,
    admitted: invitation.admittedCount,
  };
  const remaining = guest.admits - guest.admitted;
  if (remaining <= 0) {
    const last = await tx.checkIn.findFirst({
      where: { invitationId: invitation.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, checkedInBy: { select: { name: true } } },
    });
    return {
      result: "full",
      guest,
      lastCheckIn: last && { at: last.createdAt, by: last.checkedInBy?.name ?? null },
    };
  }
  // Without a count, everyone still to come in
  const requested = count ?? remaining;
  if (requested > remaining) return { result: "too_many", guest, requested };

  // The limit is enforced here, in one statement, not by the read above: two helpers scanning
  // the same code at the same moment can't both pass it. Checking in counts as confirming
  const updated = await tx.$queryRaw<{ admittedCount: number }[]>`
    UPDATE "invitations"
    SET "admittedCount" = "admittedCount" + ${requested}, "status" = 'CONFIRMED', "updatedAt" = NOW()
    WHERE "id" = ${invitation.id}
      AND "status" NOT IN ('DECLINED', 'RESCINDED')
      AND "admittedCount" + ${requested} <= "plusOne" + 1
    RETURNING "admittedCount"`;
  if (updated.length === 0) return RACED;

  await tx.checkIn.create({
    data: {
      invitationId: invitation.id,
      eventId,
      count: requested,
      checkedInByUserId: by.userId,
    },
  });
  return {
    result: "admitted",
    guest: { ...guest, admitted: Number(updated[0]!.admittedCount) },
    count: requested,
  };
}

export const checkInRepo = {
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
