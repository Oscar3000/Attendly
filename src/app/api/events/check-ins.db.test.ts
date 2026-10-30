import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import { eventRepo, type Event } from "@/server/repositories/event.repo";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { checkInRepo } from "@/server/repositories/check-in.repo";
import { doorLinkRepo } from "@/server/repositories/door-link.repo";
import { sessionCookieFor, stubAuthEnv } from "../../../../tests/helpers/auth";
import * as checkIns from "./[eventId]/check-ins/route";
import * as checkIn from "./[eventId]/check-ins/[checkInId]/route";

let hostCookie = "";
let hostId = "";
let event: Event;
let otherEvent: Event;

beforeAll(() => {
  stubAuthEnv();
});

// Accounts, events, invitations and check-ins are truncated before each test
beforeEach(async () => {
  hostCookie = await sessionCookieFor("host@example.com");
  hostId = (await prisma.user.findUniqueOrThrow({ where: { email: "host@example.com" } })).id;
  await prisma.user.update({ where: { id: hostId }, data: { name: "Ada" } });
  const base = {
    type: "WEDDING" as const,
    title: "Main",
    date: new Date("2030-05-23T14:00:00Z"),
    timezone: "UTC",
  };
  event = await eventRepo.create(hostId, { ...base, slug: "main" });
  otherEvent = await eventRepo.create(hostId, { ...base, slug: "other" });
});

async function guest(name: string, plusOne = 0, inEvent = event) {
  const { id } = await invitationRepo.createInvitation(inEvent, {
    name,
    status: "pending",
    plusOne,
  });
  const { accessToken } = await prisma.invitation.findUniqueOrThrow({ where: { id } });
  return { id, token: accessToken };
}

const admit = (token: string, count?: number, inEvent = event) =>
  checkInRepo.checkIn(inEvent.id, token, count, { userId: hostId });

async function overview(cookie = hostCookie, eventId = event.id) {
  const response = await checkIns.GET(
    new NextRequest("http://localhost/api/events/x/check-ins", { headers: { cookie } }),
    { params: Promise.resolve({ eventId }) },
  );
  return { status: response.status, body: await response.json() };
}

async function undo(checkInId: string, cookie = hostCookie, eventId = event.id) {
  const response = await checkIn.DELETE(
    new NextRequest("http://localhost/api/events/x/check-ins/x", {
      method: "DELETE",
      headers: { cookie },
    }),
    { params: Promise.resolve({ eventId, checkInId }) },
  );
  return response.status;
}

const stored = (id: string) =>
  prisma.invitation.findUniqueOrThrow({
    where: { id },
    select: { admittedCount: true, status: true },
  });

describe("GET /api/events/[eventId]/check-ins", () => {
  it("counts people in vs expected, leaving out declined and cancelled invitations", async () => {
    const zelda = await guest("Zelda", 2);
    await guest("Not here yet", 1);
    const declined = await guest("Declined", 4);
    await invitationRepo.updateRsvpStatus(event.id, declined.id, "declined");
    await guest("Other event's guest", 0, otherEvent);
    await admit(zelda.token, 2);

    const { status, body } = await overview();

    expect(status).toBe(200);
    expect(body.summary).toEqual({
      admitted: 2,
      expected: 5,
      invitationsCheckedIn: 1,
      invitations: 2,
    });
  });

  it("lists the latest check-ins, newest first, with who admitted them", async () => {
    const zelda = await guest("Zelda", 2);
    const solo = await guest("Solo");
    const { link } = await doorLinkRepo.create(event, "Ben, front gate");
    await admit(zelda.token, 1);
    await checkInRepo.checkIn(event.id, solo.token, undefined, { doorLinkId: link.id });

    const { body } = await overview();

    expect(body.recent).toMatchObject([
      { guestName: "Solo", count: 1, by: "Ben, front gate" },
      { guestName: "Zelda", count: 1, by: "Ada" },
    ]);
  });

  it("is for the event's owner only", async () => {
    expect((await overview("")).status).toBe(401);
    expect((await overview(await sessionCookieFor("stranger@example.com"))).status).toBe(404);
  });
});

describe("DELETE /api/events/[eventId]/check-ins/[checkInId]", () => {
  it("undoes a check-in, so the ticket admits those people again", async () => {
    const zelda = await guest("Zelda", 2);
    await admit(zelda.token, 1);
    await admit(zelda.token, 2);
    const latest = (await overview()).body.recent[0];

    expect(await undo(latest.id)).toBe(200);

    // Still one person in, so the invitation stays confirmed
    expect(await stored(zelda.id)).toEqual({ admittedCount: 1, status: "CONFIRMED" });
    expect((await admit(zelda.token)).result).toBe("admitted");
    expect(await stored(zelda.id)).toMatchObject({ admittedCount: 3 });
  });

  it("puts the invitation back to pending once nobody on it is in", async () => {
    const solo = await guest("Solo");
    await admit(solo.token);
    const [only] = (await overview()).body.recent;

    await undo(only.id);

    expect(await stored(solo.id)).toEqual({ admittedCount: 0, status: "PENDING" });
    expect((await overview()).body.recent).toEqual([]);
  });

  it("can't undo another event's check-in, even the same host's", async () => {
    const elsewhere = await guest("Elsewhere", 0, otherEvent);
    await admit(elsewhere.token, undefined, otherEvent);
    const [theirs] = (await overview(hostCookie, otherEvent.id)).body.recent;

    expect(await undo(theirs.id)).toBe(404);
    expect(await undo("no-such-check-in")).toBe(404);
    expect(
      await undo(theirs.id, await sessionCookieFor("stranger@example.com"), otherEvent.id),
    ).toBe(404);
    expect(await stored(elsewhere.id)).toMatchObject({ admittedCount: 1 });
  });
});
