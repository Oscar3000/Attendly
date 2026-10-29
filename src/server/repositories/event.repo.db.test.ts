import { beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { eventRepo, type EventInput } from "./event.repo";

let ownerId = "";
let otherOwnerId = "";

// Users are truncated before each test; Better Auth isn't needed to own an event
async function createUser(email: string) {
  const user = await prisma.user.create({
    data: { id: crypto.randomUUID(), name: "Host", email },
  });
  return user.id;
}

beforeEach(async () => {
  ownerId = await createUser("host@example.com");
  otherOwnerId = await createUser("other@example.com");
});

const wedding: EventInput = {
  slug: "ada-and-charles",
  type: "WEDDING",
  title: "Ada & Charles",
  date: new Date("2027-05-23T14:00:00Z"),
  timezone: "Europe/London",
  venueName: "Hall",
};

describe("eventRepo", () => {
  it("creates an event and reads it back by id and slug", async () => {
    const created = await eventRepo.create(ownerId, wedding);

    expect(created).toMatchObject({ ...wedding, ownerId, venueAddress: null, rsvpDeadline: null });
    expect(await eventRepo.findById(created.id)).toEqual(created);
    expect(await eventRepo.findBySlug("ada-and-charles")).toEqual(created);
  });

  it("returns undefined for unknown ids and slugs", async () => {
    expect(await eventRepo.findById("missing")).toBeUndefined();
    expect(await eventRepo.findBySlug("missing")).toBeUndefined();
  });

  it("rejects a slug that is already taken", async () => {
    await eventRepo.create(ownerId, wedding);

    await expect(eventRepo.create(otherOwnerId, wedding)).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    );
  });

  it("lists only the owner's events, soonest first", async () => {
    await eventRepo.create(ownerId, { ...wedding, slug: "later", date: new Date("2028-01-01") });
    await eventRepo.create(ownerId, { ...wedding, slug: "sooner", date: new Date("2027-01-01") });
    await eventRepo.create(otherOwnerId, { ...wedding, slug: "not-mine" });

    const events = await eventRepo.listByOwner(ownerId);
    expect(events.map((event) => event.slug)).toEqual(["sooner", "later"]);
  });

  it("updates only the given fields, and null clears an optional one", async () => {
    const created = await eventRepo.create(ownerId, wedding);

    const updated = await eventRepo.update(created.id, {
      title: "Renamed",
      venueName: null,
      timezone: undefined,
    });
    expect(updated).toMatchObject({
      title: "Renamed",
      venueName: null,
      slug: "ada-and-charles",
      timezone: "Europe/London",
    });
  });

  it("reports a missing event on update and delete", async () => {
    expect(await eventRepo.update("missing", { title: "x" })).toBeUndefined();
    expect(await eventRepo.delete("missing")).toBe(false);
  });

  it("deletes an event", async () => {
    const created = await eventRepo.create(ownerId, wedding);

    expect(await eventRepo.delete(created.id)).toBe(true);
    expect(await eventRepo.findById(created.id)).toBeUndefined();
  });

  it("deletes an event's invitations with it, leaving other events' invitations", async () => {
    const event = await eventRepo.create(ownerId, wedding);
    const other = await eventRepo.create(ownerId, { ...wedding, slug: "other-event" });
    const guest = { qrCode: "qr", eventDate: wedding.date, venue: "Hall" };
    await prisma.invitation.create({ data: { ...guest, name: "Ada", eventId: event.id } });
    await prisma.invitation.create({ data: { ...guest, name: "Other guest", eventId: other.id } });

    await eventRepo.delete(event.id);

    const remaining = await prisma.invitation.findMany();
    expect(remaining.map((invitation) => invitation.name)).toEqual(["Other guest"]);
  });

  it("deletes a user's events with the user", async () => {
    await eventRepo.create(ownerId, wedding);

    await prisma.user.delete({ where: { id: ownerId } });
    expect(await prisma.event.count()).toBe(0);
  });
});
