import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, type RsvpStatus } from "@prisma/client";
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

  describe("listByOwnerWithReplies (T-607)", () => {
    const addGuests = (eventId: string, statuses: RsvpStatus[]) =>
      prisma.invitation.createMany({
        data: statuses.map((status) => ({
          name: "Guest",
          status,
          eventId,
          accessToken: crypto.randomUUID(),
        })),
      });

    it("counts every invitation, and all but pending as replied", async () => {
      const event = await eventRepo.create(ownerId, wedding);
      await addGuests(event.id, ["PENDING", "PENDING", "CONFIRMED", "DECLINED", "RESCINDED"]);

      const [listed] = await eventRepo.listByOwnerWithReplies(ownerId);
      expect(listed).toMatchObject({ id: event.id, invited: 5, replied: 3 });
    });

    it("keeps each event's counts apart, soonest first", async () => {
      const later = await eventRepo.create(ownerId, { ...wedding, slug: "later" });
      const sooner = await eventRepo.create(ownerId, {
        ...wedding,
        slug: "sooner",
        date: new Date("2026-01-01T00:00:00Z"),
      });
      await addGuests(later.id, ["CONFIRMED"]);
      await addGuests(sooner.id, ["PENDING", "PENDING"]);

      const events = await eventRepo.listByOwnerWithReplies(ownerId);
      expect(events.map(({ slug, invited, replied }) => [slug, invited, replied])).toEqual([
        ["sooner", 2, 0],
        ["later", 1, 1],
      ]);
    });

    it("gives zeros to an event with no invitations", async () => {
      await eventRepo.create(ownerId, wedding);

      const [listed] = await eventRepo.listByOwnerWithReplies(ownerId);
      expect(listed).toMatchObject({ invited: 0, replied: 0 });
    });

    it("only returns the owner's events and counts", async () => {
      const mine = await eventRepo.create(ownerId, wedding);
      const theirs = await eventRepo.create(otherOwnerId, { ...wedding, slug: "not-mine" });
      await addGuests(theirs.id, ["CONFIRMED", "CONFIRMED"]);

      const events = await eventRepo.listByOwnerWithReplies(ownerId);
      expect(events.map((event) => event.id)).toEqual([mine.id]);
      expect(events[0]).toMatchObject({ invited: 0, replied: 0 });
    });

    it("counts with one query, however many events there are", async () => {
      for (const slug of ["one", "two", "three"]) {
        await eventRepo.create(ownerId, { ...wedding, slug });
      }
      // Prisma's models are proxies, so a spy can't call through; only the call count matters here
      const groupBy = vi.spyOn(prisma.invitation, "groupBy").mockResolvedValue([] as never);

      await eventRepo.listByOwnerWithReplies(ownerId);
      expect(groupBy).toHaveBeenCalledTimes(1);
      groupBy.mockRestore();
    });
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

  it("starts with empty content, then stores and clears it", async () => {
    const created = await eventRepo.create(ownerId, wedding);
    expect(created).toMatchObject({
      hostNames: null,
      headline: null,
      notes: null,
      familyLines: [],
      colorPalette: [],
    });

    const content = {
      hostNames: "Ada & Charles",
      headline: "Request your presence",
      familyLines: [{ name: "Mr & Mrs Obi", detail: "of Ntezi" }, { name: "The Smiths" }],
      colorPalette: [{ name: "Gold", hex: "#D4AF37" }],
      notes: "Church service at 10:00 AM",
    };
    await eventRepo.update(created.id, content);
    expect(await eventRepo.findById(created.id)).toMatchObject(content);

    const cleared = await eventRepo.update(created.id, { hostNames: null, familyLines: [] });
    expect(cleared).toMatchObject({
      hostNames: null,
      familyLines: [],
      colorPalette: content.colorPalette,
    });
  });

  it("reads content that doesn't match its shape as empty", async () => {
    const created = await eventRepo.create(ownerId, wedding);
    await prisma.event.update({
      where: { id: created.id },
      data: { familyLines: { name: "not a list" }, colorPalette: [{ name: "Gold", hex: "gold" }] },
    });

    expect(await eventRepo.findById(created.id)).toMatchObject({
      familyLines: [],
      colorPalette: [],
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
    const guest = () => ({ accessToken: crypto.randomUUID() });
    await prisma.invitation.create({ data: { ...guest(), name: "Ada", eventId: event.id } });
    await prisma.invitation.create({
      data: { ...guest(), name: "Other guest", eventId: other.id },
    });

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
