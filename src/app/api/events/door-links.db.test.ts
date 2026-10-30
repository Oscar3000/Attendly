import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import { eventRepo, type Event } from "@/server/repositories/event.repo";
import { defaultDoorLinkExpiry, hashDoorToken } from "@/server/repositories/door-link.repo";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { sessionCookieFor, stubAuthEnv } from "../../../../tests/helpers/auth";
import * as doorLinks from "./[eventId]/door-links/route";
import * as doorLink from "./[eventId]/door-links/[linkId]/route";

let hostCookie = "";
let event: Event;
let otherEvent: Event;
const eventDate = new Date("2030-05-23T14:00:00Z");

beforeAll(() => {
  stubAuthEnv();
});

// Accounts, events and door links are truncated before each test
beforeEach(async () => {
  hostCookie = await sessionCookieFor("host@example.com");
  const host = await prisma.user.findUniqueOrThrow({ where: { email: "host@example.com" } });
  const base = { type: "WEDDING" as const, title: "Main", date: eventDate, timezone: "UTC" };
  event = await eventRepo.create(host.id, { ...base, slug: "main" });
  otherEvent = await eventRepo.create(host.id, { ...base, slug: "other" });
});

const request = (method: string, body?: object, cookie = hostCookie) =>
  new NextRequest("http://localhost/api/events/x/door-links", {
    method,
    headers: { cookie },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

async function create(name: string, eventId = event.id, cookie = hostCookie) {
  const response = await doorLinks.POST(request("POST", { name }, cookie), {
    params: Promise.resolve({ eventId }),
  });
  return { status: response.status, body: await response.json() };
}

async function list(eventId = event.id, cookie = hostCookie) {
  const response = await doorLinks.GET(request("GET", undefined, cookie), {
    params: Promise.resolve({ eventId }),
  });
  return { status: response.status, body: await response.json() };
}

async function revoke(linkId: string, eventId = event.id) {
  const response = await doorLink.DELETE(request("DELETE"), {
    params: Promise.resolve({ eventId, linkId }),
  });
  return { status: response.status, body: await response.json() };
}

describe("/api/events/[eventId]/door-links", () => {
  it("creates a named link, returning its URL once and storing only a hash of the token", async () => {
    const { status, body } = await create("  Ben, front gate ");

    expect(status).toBe(201);
    expect(body.doorLink).toMatchObject({ name: "Ben, front gate", revokedAt: null, admitted: 0 });
    // The helper's scanner page (T-507)
    const token = /^https?:\/\/[^/]+\/door\/([A-Za-z0-9_-]{43})$/.exec(body.url)?.[1];
    expect(token).toBeDefined();

    const stored = await prisma.doorLink.findUniqueOrThrow({ where: { id: body.doorLink.id } });
    expect(stored.tokenHash).toBe(hashDoorToken(token!));
    expect(JSON.stringify(stored)).not.toContain(token);
    // Listing never shows the token or the URL again
    expect(JSON.stringify((await list()).body)).not.toContain(token);
  });

  it("expires a day after the event, or a day from now for an event that has passed", () => {
    const now = new Date("2030-01-01T00:00:00Z");
    expect(defaultDoorLinkExpiry(eventDate, now)).toEqual(new Date("2030-05-24T14:00:00Z"));
    expect(defaultDoorLinkExpiry(new Date("2020-01-01T00:00:00Z"), now)).toEqual(
      new Date("2030-01-02T00:00:00Z"),
    );
  });

  it("lists the event's links, newest first, with how many people each checked in", async () => {
    const ben = (await create("Ben")).body.doorLink;
    const amy = (await create("Amy")).body.doorLink;
    await create("Not this event's", otherEvent.id);
    // Check-ins by Ben's link (T-507 writes these)
    const guest = await invitationRepo.createInvitation(event, {
      name: "Zelda",
      status: "pending",
    });
    await prisma.checkIn.createMany({
      data: [
        { invitationId: guest.id, eventId: event.id, count: 2, doorLinkId: ben.id },
        { invitationId: guest.id, eventId: event.id, count: 1, doorLinkId: ben.id },
      ],
    });

    const { body } = await list();

    expect(body.doorLinks).toMatchObject([
      { id: amy.id, name: "Amy", admitted: 0 },
      { id: ben.id, name: "Ben", admitted: 3 },
    ]);
  });

  it("revokes a link once, keeping it listed", async () => {
    const ben = (await create("Ben")).body.doorLink;

    const first = await revoke(ben.id);
    expect(first.status).toBe(200);
    expect(first.body.doorLink.revokedAt).not.toBeNull();
    // Revoking again keeps the first time
    expect((await revoke(ben.id)).body.doorLink.revokedAt).toBe(first.body.doorLink.revokedAt);
    expect((await list()).body.doorLinks).toMatchObject([{ id: ben.id, name: "Ben" }]);
  });

  it("can't revoke another event's link, even the same host's", async () => {
    const other = (await create("Other", otherEvent.id)).body.doorLink;

    expect((await revoke(other.id)).status).toBe(404);
    expect((await revoke("no-such-link")).status).toBe(404);
    expect(await prisma.doorLink.findUniqueOrThrow({ where: { id: other.id } })).toMatchObject({
      revokedAt: null,
    });
  });

  it("validates the name and requires the event's owner", async () => {
    expect((await create("   ")).status).toBe(400);
    expect((await create("x".repeat(81))).status).toBe(400);
    expect((await create("Ben", event.id, "")).status).toBe(401);
    const stranger = await sessionCookieFor("stranger@example.com");
    expect((await create("Ben", event.id, stranger)).status).toBe(404);
    expect((await list(event.id, stranger)).status).toBe(404);
    expect(await prisma.doorLink.count()).toBe(0);
  });
});
