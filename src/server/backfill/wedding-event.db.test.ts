import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { WEDDING_EVENT, backfillWeddingEvent } from "./wedding-event";

let adminId = "";

async function createUser(email: string) {
  const user = await prisma.user.create({ data: { id: crypto.randomUUID(), name: "Host", email } });
  return user.id;
}

const createInvitation = (name: string, eventId: string | null = null) =>
  prisma.invitation.create({
    data: { name, qrCode: "qr", eventDate: WEDDING_EVENT.date, venue: "Canary World", eventId },
  });

beforeEach(async () => {
  adminId = await createUser("admin@example.com");
});

describe("backfillWeddingEvent", () => {
  it("creates the wedding for the admin and links every invitation without an event", async () => {
    await createInvitation("Ada");
    await createInvitation("Grace");

    // Email lookup ignores case, like sign-in
    const result = await backfillWeddingEvent("Admin@Example.com");

    expect(result).toMatchObject({ eventCreated: true, invitationsLinked: 2 });
    const event = await prisma.event.findUniqueOrThrow({ where: { id: result.eventId } });
    expect(event).toMatchObject({ ...WEDDING_EVENT, ownerId: adminId });
    expect(event.date.toISOString()).toBe("2026-05-23T14:00:00.000Z");
    expect(await prisma.invitation.count({ where: { eventId: event.id } })).toBe(2);
  });

  it("can run again: reuses the event and only links new invitations", async () => {
    await createInvitation("Ada");
    const first = await backfillWeddingEvent("admin@example.com");
    await createInvitation("Late guest");

    const second = await backfillWeddingEvent("admin@example.com");

    expect(second).toEqual({ eventId: first.eventId, eventCreated: false, invitationsLinked: 1 });
    expect(await prisma.event.count()).toBe(1);
  });

  it("leaves invitations that already belong to another event alone", async () => {
    const other = await prisma.event.create({
      data: { ...WEDDING_EVENT, slug: "another-event", ownerId: adminId },
    });
    await createInvitation("Someone else's guest", other.id);

    const result = await backfillWeddingEvent("admin@example.com");

    expect(result.invitationsLinked).toBe(0);
    expect(await prisma.invitation.count({ where: { eventId: other.id } })).toBe(1);
  });

  it("refuses when the admin account doesn't exist, changing nothing", async () => {
    await createInvitation("Ada");

    await expect(backfillWeddingEvent("missing@example.com")).rejects.toThrow(/npm run db:seed/);
    expect(await prisma.event.count()).toBe(0);
  });

  it("refuses when the slug is taken by another account", async () => {
    const otherId = await createUser("other@example.com");
    await prisma.event.create({ data: { ...WEDDING_EVENT, ownerId: otherId } });

    await expect(backfillWeddingEvent("admin@example.com")).rejects.toThrow(/another account/);
  });
});
