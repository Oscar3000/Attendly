import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { eventRepo, type Event } from "./event.repo";
import { invitationRepo } from "./invitation.repo";
import { metricsRepo } from "./metrics.repo";

let event: Event;
let otherEvent: Event;

beforeEach(async () => {
  const owner = await prisma.user.create({
    data: { id: crypto.randomUUID(), name: "Host", email: "host@example.com" },
  });
  const base = {
    type: "WEDDING" as const,
    date: new Date("2027-05-23T14:00:00Z"),
    timezone: "Africa/Lagos",
  };
  event = await eventRepo.create(owner.id, { ...base, slug: "mine", title: "Mine" });
  otherEvent = await eventRepo.create(owner.id, { ...base, slug: "other", title: "Other" });
});

describe("metricsRepo", () => {
  it("counts only the event's invitations and guests", async () => {
    await invitationRepo.createInvitation(event, { name: "Ada", status: "confirmed", plusOne: 1 });
    await invitationRepo.createInvitation(event, { name: "Grace", status: "pending" });
    await invitationRepo.createInvitation(otherEvent, {
      name: "Elsewhere",
      status: "confirmed",
      plusOne: 5,
    });

    expect(await metricsRepo.getAdminMetrics(event.id)).toEqual({
      totalInvitations: 2,
      totalGuests: 3,
      confirmedRsvps: 1,
      pendingRsvps: 1,
      declinedRsvps: 0,
      attendanceRate: 50,
    });
  });

  it("lists only the event's recent status updates", async () => {
    await invitationRepo.createInvitation(event, { name: "Ada", status: "pending" });
    await invitationRepo.createInvitation(otherEvent, { name: "Elsewhere", status: "pending" });

    const updates = await metricsRepo.getRecentStatusUpdates(event.id);
    expect(updates.map((update) => update.name)).toEqual(["Ada"]);
  });

  it("reports zeros for an event with no invitations", async () => {
    expect(await metricsRepo.getAdminMetrics(event.id)).toMatchObject({
      totalInvitations: 0,
      totalGuests: 0,
      attendanceRate: 0,
    });
  });
});
