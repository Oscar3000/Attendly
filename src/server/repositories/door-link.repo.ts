/**
 * Door helper links (T-506): check-in links the host gives to helpers at the door. Only a hash
 * of each link's token is stored; the link itself is shown to the host once, when created.
 * Every function is scoped to one event, like the other repositories
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Event } from "@prisma/client";
import { prisma } from "@/server/db/client";

export interface DoorLinkSummary {
  id: string;
  name: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  // People this link has checked in
  admitted: number;
}

const DAY = 24 * 60 * 60 * 1000;

export const hashDoorToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Links stop working a day after the event starts (or a day from now, for an event already
// under way or past), so a forgotten link doesn't stay open
export const defaultDoorLinkExpiry = (eventDate: Date, now = new Date()) =>
  new Date(Math.max(eventDate.getTime(), now.getTime()) + DAY);

const summaryFields = {
  id: true,
  name: true,
  createdAt: true,
  expiresAt: true,
  revokedAt: true,
} as const;

// What a door helper's page and API need about their link (T-507)
export interface ActiveDoorLink {
  id: string;
  name: string;
  event: { id: string; title: string; hostNames: string | null; timezone: string };
}

export const doorLinkRepo = {
  // The link with this token: "active" while it works, "inactive" once revoked or expired,
  // undefined for a token that was never issued
  async findByToken(
    token: string,
    now = new Date(),
  ): Promise<{ status: "active"; link: ActiveDoorLink } | { status: "inactive" } | undefined> {
    const link = await prisma.doorLink.findUnique({
      where: { tokenHash: hashDoorToken(token) },
      select: {
        id: true,
        name: true,
        revokedAt: true,
        expiresAt: true,
        event: { select: { id: true, title: true, hostNames: true, timezone: true } },
      },
    });
    if (!link) return undefined;
    if (link.revokedAt || link.expiresAt <= now) return { status: "inactive" };
    return { status: "active", link: { id: link.id, name: link.name, event: link.event } };
  },

  // Returns the token for the host to share; it can't be read back later
  async create(
    event: Pick<Event, "id" | "date">,
    name: string,
  ): Promise<{ link: DoorLinkSummary; token: string }> {
    const token = randomBytes(32).toString("base64url");
    const link = await prisma.doorLink.create({
      data: {
        eventId: event.id,
        name,
        tokenHash: hashDoorToken(token),
        expiresAt: defaultDoorLinkExpiry(event.date),
      },
      select: summaryFields,
    });
    return { link: { ...link, admitted: 0 }, token };
  },

  // Newest first, with how many people each has checked in
  async listForEvent(eventId: string): Promise<DoorLinkSummary[]> {
    const [links, totals] = await Promise.all([
      prisma.doorLink.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        select: summaryFields,
      }),
      prisma.checkIn.groupBy({
        by: ["doorLinkId"],
        where: { eventId, doorLinkId: { not: null } },
        _sum: { count: true },
      }),
    ]);
    const admitted = new Map(totals.map((total) => [total.doorLinkId, total._sum.count ?? 0]));
    return links.map((link) => ({ ...link, admitted: admitted.get(link.id) ?? 0 }));
  },

  // Stops the link working at once; revoking twice keeps the first time. Undefined if the link
  // isn't in this event
  async revoke(eventId: string, id: string): Promise<DoorLinkSummary | undefined> {
    await prisma.doorLink.updateMany({
      where: { id, eventId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const links = await doorLinkRepo.listForEvent(eventId);
    return links.find((link) => link.id === id);
  },
};
