import { describe, expect, it, vi } from "vitest";
import { invitationRepo } from "./invitation.repo";

const eventDate = new Date("2026-05-23T10:00:00Z");

function createGuest(name: string) {
  return invitationRepo.createInvitation({
    name,
    eventDate,
    venue: "Test Venue",
    status: "pending",
    plusOne: 1,
  });
}

describe("invitationRepo", () => {
  it("creates an invitation with a generated QR code and reads it back", async () => {
    const created = await createGuest("Ada Lovelace");

    expect(created.qrCode).toMatch(/^data:image\/png;base64,/);

    const found = await invitationRepo.getInvitationById(created.id);
    expect(found).toMatchObject({
      id: created.id,
      name: "Ada Lovelace",
      venue: "Test Venue",
      status: "pending",
      plusOne: 1,
    });
    expect(found?.eventDate.toISOString()).toBe(eventDate.toISOString());
  });

  it("returns undefined for an unknown id", async () => {
    expect(await invitationRepo.getInvitationById("missing")).toBeUndefined();
  });

  it("updates the RSVP status", async () => {
    const created = await createGuest("Grace Hopper");

    const updated = await invitationRepo.updateRsvpStatus(created.id, "confirmed");

    expect(updated?.status).toBe("confirmed");
  });

  it("deletes an invitation once", async () => {
    const created = await createGuest("Alan Turing");
    // The repo logs the failed second delete; keep test output clean
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await invitationRepo.deleteInvitation(created.id)).toBe(true);
    expect(await invitationRepo.deleteInvitation(created.id)).toBe(false);
    expect(await invitationRepo.getInvitationById(created.id)).toBeUndefined();

    log.mockRestore();
  });

  it("paginates and searches admin invitations case-insensitively", async () => {
    await createGuest("Ada Lovelace");
    await createGuest("Grace Hopper");
    await createGuest("Ada Byron");

    const page = await invitationRepo.getAdminInvitations(1, 2);
    expect(page.invitations).toHaveLength(2);
    expect(page.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });

    const search = await invitationRepo.getAdminInvitations(1, 10, "  ada ");
    expect(search.invitations.map((invite) => invite.name).sort()).toEqual([
      "Ada Byron",
      "Ada Lovelace",
    ]);
  });
});
