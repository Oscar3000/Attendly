/**
 * One-off backfill (T-303): turn the hard-coded wedding into an Event owned by the admin
 * and attach every invitation that has no event yet. Run with `npm run db:backfill-wedding`
 * Safe to run again: the event is reused by slug, and linked invitations are left alone
 */
import "server-only";
import { prisma } from "@/server/db/client";

// The reception: what the QR invitations are for (church service details move to notes in T-401)
export const WEDDING_EVENT = {
  slug: "pamela-and-oscar",
  type: "WEDDING",
  title: "Pamela & Oscar",
  // 3:00 PM in Lagos (WAT, UTC+1, no daylight saving)
  date: new Date("2026-05-23T15:00:00+01:00"),
  timezone: "Africa/Lagos",
  venueName: "Canary World",
  venueAddress: "23 Rd, opposite L Close, Festac Town, Lagos 102102, Lagos",
} as const;

export interface BackfillResult {
  eventId: string;
  eventCreated: boolean;
  invitationsLinked: number;
}

export async function backfillWeddingEvent(adminEmail: string): Promise<BackfillResult> {
  return prisma.$transaction(async (tx) => {
    const owner = await tx.user.findUnique({ where: { email: adminEmail.toLowerCase() } });
    if (!owner) {
      throw new Error(
        `No account for ${adminEmail}. Create it first with npm run db:seed (see DEPLOYMENT.md).`,
      );
    }

    let event = await tx.event.findUnique({ where: { slug: WEDDING_EVENT.slug } });
    if (event && event.ownerId !== owner.id) {
      throw new Error(
        `Event "${WEDDING_EVENT.slug}" already exists and belongs to another account.`,
      );
    }
    const eventCreated = !event;
    event ??= await tx.event.create({ data: { ...WEDDING_EVENT, ownerId: owner.id } });

    // Raw SQL: since T-304 the Prisma types say eventId can't be null, but a database the
    // T-304 migration refused to update (see its guard) still has unlinked rows
    const invitationsLinked = await tx.$executeRaw`
      UPDATE "invitations" SET "eventId" = ${event.id} WHERE "eventId" IS NULL`;

    return { eventId: event.id, eventCreated, invitationsLinked };
  });
}
