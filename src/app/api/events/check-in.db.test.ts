import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import { eventRepo, type Event } from "@/server/repositories/event.repo";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { checkInRepo } from "@/server/repositories/check-in.repo";
import { sessionCookieFor, stubAuthEnv } from "../../../../tests/helpers/auth";
import * as checkIn from "./[eventId]/check-in/route";

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
    date: new Date("2027-05-23T14:00:00Z"),
    timezone: "Africa/Lagos",
  };
  event = await eventRepo.create(hostId, { ...base, slug: "main" });
  // The same host's other event: scoping is by event, not just by owner
  otherEvent = await eventRepo.create(hostId, { ...base, slug: "other" });
});

// A guest with `plusOne` extra people; returns their ticket URL and token
async function guest(name: string, plusOne = 0, inEvent = event) {
  const invitation = await invitationRepo.createInvitation(inEvent, {
    name,
    status: "pending",
    plusOne,
  });
  const { accessToken } = await prisma.invitation.findUniqueOrThrow({
    where: { id: invitation.id },
  });
  return { id: invitation.id, url: invitation.ticketUrl!, token: accessToken };
}

async function scan(code: string, count?: number, cookie = hostCookie, eventId = event.id) {
  return post(count === undefined ? { code } : { code, count }, cookie, eventId);
}

async function post(body: object, cookie = hostCookie, eventId = event.id) {
  const response = await checkIn.POST(
    new NextRequest("http://localhost/api/events/x/check-in", {
      method: "POST",
      headers: { cookie },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ eventId }) },
  );
  return { status: response.status, body: await response.json() };
}

const stored = (id: string) =>
  prisma.invitation.findUniqueOrThrow({
    where: { id },
    select: { admittedCount: true, status: true },
  });

describe("POST /api/events/[eventId]/check-in", () => {
  it("admits everyone on the invitation by default, and confirms it", async () => {
    const zelda = await guest("Zelda", 2);

    const { status, body } = await scan(zelda.url);

    expect(status).toBe(200);
    expect(body).toEqual({
      result: "admitted",
      guest: { name: "Zelda", admits: 3, admitted: 3 },
      count: 3,
    });
    expect(await stored(zelda.id)).toEqual({ admittedCount: 3, status: "CONFIRMED" });
    expect(
      await prisma.checkIn.findMany({ select: { count: true, checkedInByUserId: true } }),
    ).toEqual([{ count: 3, checkedInByUserId: hostId }]);
  });

  it("refuses a second scan once everyone is in, saying when and by whom", async () => {
    const zelda = await guest("Zelda", 1);
    await scan(zelda.url);

    // The guest sends their QR code to a friend outside
    const { status, body } = await scan(zelda.url);

    expect(status).toBe(409);
    expect(body).toMatchObject({
      result: "full",
      guest: { name: "Zelda", admits: 2, admitted: 2 },
      lastCheckIn: { by: "Ada" },
    });
    expect(new Date(body.lastCheckIn.at).getTime()).toBeGreaterThan(Date.now() - 60_000);
    expect(await stored(zelda.id)).toMatchObject({ admittedCount: 2 });
  });

  it("lets a group arrive in parts, up to what the invitation admits", async () => {
    const zelda = await guest("Zelda", 2);

    expect((await scan(zelda.url, 2)).body).toMatchObject({
      result: "admitted",
      guest: { admitted: 2 },
    });
    // One place left
    const tooMany = await scan(zelda.url, 2);
    expect(tooMany.status).toBe(409);
    expect(tooMany.body).toMatchObject({
      result: "too_many",
      requested: 2,
      guest: { admitted: 2 },
    });
    expect((await scan(zelda.url, 1)).body).toMatchObject({
      result: "admitted",
      guest: { admitted: 3 },
    });
    expect((await scan(zelda.url, 1)).body).toMatchObject({ result: "full" });
    expect(await prisma.checkIn.count()).toBe(2);
  });

  it("refuses cancelled and declined invitations without admitting anyone", async () => {
    const cancelled = await guest("Cancelled");
    const declined = await guest("Declined");
    await invitationRepo.updateRsvpStatus(event.id, cancelled.id, "rescinded");
    await invitationRepo.updateRsvpStatus(event.id, declined.id, "declined");

    expect(await scan(cancelled.url)).toEqual({
      status: 409,
      body: { result: "not_valid", guest: { name: "Cancelled" }, status: "rescinded" },
    });
    expect((await scan(declined.url)).body).toMatchObject({
      result: "not_valid",
      status: "declined",
    });
    expect(await stored(cancelled.id)).toEqual({ admittedCount: 0, status: "RESCINDED" });
    expect(await prisma.checkIn.count()).toBe(0);
  });

  it("doesn't know another event's tickets, unknown tokens or other QR codes", async () => {
    const elsewhere = await guest("Other event's guest", 0, otherEvent);

    for (const code of [
      elsewhere.url,
      elsewhere.token,
      "A".repeat(43),
      "https://example.com/some/other/qr",
      "hello",
    ]) {
      expect(await scan(code), code).toEqual({ status: 404, body: { result: "not_found" } });
    }
    expect(await stored(elsewhere.id)).toEqual({ admittedCount: 0, status: "PENDING" });
    // Under its own event the same ticket works
    expect((await scan(elsewhere.url, undefined, hostCookie, otherEvent.id)).status).toBe(200);
  });

  it("accepts the bare token and ticket URLs on another host", async () => {
    const a = await guest("A");
    const b = await guest("B");

    expect((await scan(` ${a.token} `)).status).toBe(200);
    expect((await scan(`https://attendly.example/e/main/i/${b.token}?utm=x`)).status).toBe(200);
  });

  it("validates the request and requires the event's owner", async () => {
    const zelda = await guest("Zelda");

    expect((await scan(zelda.url, 0)).status).toBe(400);
    expect((await scan("")).status).toBe(400);
    expect((await scan(zelda.url, undefined, "")).status).toBe(401);
    const stranger = await sessionCookieFor("stranger@example.com");
    expect((await scan(zelda.url, undefined, stranger)).status).toBe(404);
    expect(await stored(zelda.id)).toMatchObject({ admittedCount: 0 });
  });
});

describe("preview (T-505)", () => {
  it("says who the ticket is for and how many can come in, admitting nobody", async () => {
    const zelda = await guest("Zelda", 2);
    await scan(zelda.url, 1);

    expect(await post({ code: zelda.url, preview: true })).toEqual({
      status: 200,
      body: { result: "ready", guest: { name: "Zelda", admits: 3, admitted: 1 } },
    });
    expect(await stored(zelda.id)).toMatchObject({ admittedCount: 1 });
    expect(await prisma.checkIn.count()).toBe(1);
  });

  it("gives the same refusals as admitting would", async () => {
    const full = await guest("Full");
    await scan(full.url);
    const cancelled = await guest("Cancelled");
    await invitationRepo.updateRsvpStatus(event.id, cancelled.id, "rescinded");

    expect((await post({ code: full.url, preview: true })).body).toMatchObject({
      result: "full",
      lastCheckIn: { by: "Ada" },
    });
    expect((await post({ code: cancelled.url, preview: true })).body).toMatchObject({
      result: "not_valid",
    });
    expect(await post({ code: "A".repeat(43), preview: true })).toEqual({
      status: 404,
      body: { result: "not_found" },
    });
  });
});

describe("checkInRepo.checkIn", () => {
  it("never admits more than allowed when the same code is scanned many times at once", async () => {
    const zelda = await guest("Zelda", 2);

    // Ten helpers each try to admit two people at the same moment: only one can
    const outcomes = await Promise.all(
      Array.from({ length: 10 }, () =>
        checkInRepo.checkIn(event.id, zelda.token, 2, { userId: hostId }),
      ),
    );

    expect(outcomes.filter((outcome) => outcome.result === "admitted")).toHaveLength(1);
    expect(await stored(zelda.id)).toMatchObject({ admittedCount: 2 });
    expect(await prisma.checkIn.count()).toBe(1);
  });

  it("admits a full group exactly once when scanned at the same moment", async () => {
    const zelda = await guest("Zelda", 3);

    const outcomes = await Promise.all(
      Array.from({ length: 8 }, () =>
        checkInRepo.checkIn(event.id, zelda.token, undefined, { userId: hostId }),
      ),
    );

    const admitted = outcomes.flatMap((outcome) =>
      outcome.result === "admitted" ? [outcome.count] : [],
    );
    expect(admitted.reduce((sum, count) => sum + count, 0)).toBe(4);
    expect(await stored(zelda.id)).toMatchObject({ admittedCount: 4 });
  });
});
