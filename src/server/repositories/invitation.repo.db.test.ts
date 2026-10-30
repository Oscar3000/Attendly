import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { eventRepo, type Event } from "./event.repo";
import { invitationRepo } from "./invitation.repo";

const eventDate = new Date("2026-05-23T10:00:00Z");
let event: Event;
let otherEvent: Event;

// Tables are truncated before each test, so every test gets a fresh owner and event
beforeEach(async () => {
  const owner = await prisma.user.create({
    data: { id: crypto.randomUUID(), name: "Host", email: "host@example.com" },
  });
  event = await eventRepo.create(owner.id, {
    slug: "test-event",
    type: "WEDDING",
    title: "Test Event",
    date: eventDate,
    timezone: "Africa/Lagos",
    venueName: "Test Venue",
  });
  // Same owner: scoping is by event, not just by owner
  otherEvent = await eventRepo.create(owner.id, {
    slug: "other-event",
    type: "BIRTHDAY",
    title: "Other Event",
    date: eventDate,
    timezone: "Africa/Lagos",
    venueName: "Other Venue",
  });
});

function createGuest(name: string) {
  return invitationRepo.createInvitation(event, { name, status: "pending", plusOne: 1 });
}

describe("invitationRepo", () => {
  it("creates an invitation with a generated QR code and reads it back", async () => {
    const created = await createGuest("Ada Lovelace");

    expect(created.qrCode).toMatch(/^data:image\/png;base64,/);

    const found = await invitationRepo.getInvitationById(event.id, created.id);
    expect(found).toMatchObject({
      id: created.id,
      name: "Ada Lovelace",
      venue: "Test Venue",
      // The guest and dashboard pages show times on this clock and pick wording by type
      eventTimezone: "Africa/Lagos",
      eventType: "WEDDING",
      status: "pending",
      plusOne: 1,
    });
    expect(found?.eventDate.toISOString()).toBe(eventDate.toISOString());
  });

  it("takes the date and venue from the event, so changing the event changes every invitation", async () => {
    const created = await createGuest("Ada Lovelace");
    expect(created).toMatchObject({ eventId: event.id, venue: "Test Venue" });

    const newDate = new Date("2026-06-01T15:00:00Z");
    await eventRepo.update(event.id, { date: newDate, venueName: "New Hall" });

    const found = await invitationRepo.getInvitationById(event.id, created.id);
    expect(found).toMatchObject({ venue: "New Hall", eventDate: newDate });
    const [row] = (await invitationRepo.getAdminInvitations(event.id)).invitations;
    expect(row).toMatchObject({ venue: "New Hall", eventDate: newDate });
  });

  it("falls back to the venue's address when it has no name", async () => {
    await eventRepo.update(event.id, { venueName: null, venueAddress: "1 Main St" });
    const created = await createGuest("Ada Lovelace");

    expect(created.venue).toBe("1 Main St");
  });

  it("returns undefined for an unknown id", async () => {
    expect(await invitationRepo.getInvitationById(event.id, "missing")).toBeUndefined();
  });

  it("updates the RSVP status", async () => {
    const created = await createGuest("Grace Hopper");

    const updated = await invitationRepo.updateRsvpStatus(event.id, created.id, "confirmed");

    expect(updated?.status).toBe("confirmed");
  });

  it("deletes an invitation once", async () => {
    const created = await createGuest("Alan Turing");

    expect(await invitationRepo.deleteInvitation(event.id, created.id)).toBe(true);
    expect(await invitationRepo.deleteInvitation(event.id, created.id)).toBe(false);
    expect(await invitationRepo.getInvitationById(event.id, created.id)).toBeUndefined();
  });

  it("paginates and searches admin invitations case-insensitively", async () => {
    await createGuest("Ada Lovelace");
    await createGuest("Grace Hopper");
    await createGuest("Ada Byron");

    const page = await invitationRepo.getAdminInvitations(event.id, 1, 2);
    expect(page.invitations).toHaveLength(2);
    expect(page.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const search = await invitationRepo.getAdminInvitations(event.id, 1, 10, "  ada ");
    expect(search.invitations.map((invite) => invite.name).sort()).toEqual([
      "Ada Byron",
      "Ada Lovelace",
    ]);
  });
});

describe("scoping by event", () => {
  it("never reads, lists, changes or deletes another event's invitation", async () => {
    const theirs = await invitationRepo.createInvitation(otherEvent, {
      name: "Other guest",
      status: "pending",
    });
    await createGuest("Ada Lovelace");

    expect(await invitationRepo.getInvitationById(event.id, theirs.id)).toBeUndefined();
    expect((await invitationRepo.getAllInvitations(event.id)).map((i) => i.name)).toEqual([
      "Ada Lovelace",
    ]);
    const page = await invitationRepo.getAdminInvitations(event.id);
    expect(page.pagination.total).toBe(1);
    expect(page.invitations.map((i) => i.name)).toEqual(["Ada Lovelace"]);
    // A search can't reach across events either
    expect(
      (await invitationRepo.getAdminInvitations(event.id, 1, 10, "other")).invitations,
    ).toEqual([]);

    expect(
      await invitationRepo.updateInvitation(event.id, theirs.id, { name: "x" }),
    ).toBeUndefined();
    expect(await invitationRepo.updateRsvpStatus(event.id, theirs.id, "declined")).toBeUndefined();
    expect(await invitationRepo.deleteInvitation(event.id, theirs.id)).toBe(false);

    const untouched = await invitationRepo.getInvitationById(otherEvent.id, theirs.id);
    expect(untouched).toMatchObject({ name: "Other guest", status: "pending" });
  });

  it("lets a guest read and RSVP by invitation id alone (PIN flow, until T-505)", async () => {
    const created = await createGuest("Ada Lovelace");

    expect(await invitationRepo.getInvitationForGuest(created.id)).toMatchObject({
      name: "Ada Lovelace",
    });
    expect(await invitationRepo.updateRsvpStatusForGuest(created.id, "confirmed")).toMatchObject({
      status: "confirmed",
    });
    expect(await invitationRepo.getInvitationForGuest("missing")).toBeUndefined();
    expect(await invitationRepo.updateRsvpStatusForGuest("missing", "confirmed")).toBeUndefined();
  });
});
