import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import { signSession } from "@/server/auth/session";
import { eventRepo, type Event } from "@/server/repositories/event.repo";
import { sessionCookieFor, stubAuthEnv } from "../../../../tests/helpers/auth";
import * as invitations from "./[eventId]/invitations/route";
import * as invitation from "./[eventId]/invitations/[id]/route";
import * as bulk from "./[eventId]/invitations/bulk/route";
import * as metrics from "./[eventId]/metrics/route";
import * as status from "./[eventId]/status/route";

let hostCookie = "";
let otherCookie = "";
let guestCookie = "";
let event: Event;
let secondEvent: Event;

beforeAll(async () => {
  stubAuthEnv();
  guestCookie = `invite_token=${await signSession("guest")}`;
});

// Accounts and events are truncated before each test. The host isn't ADMIN_EMAIL:
// owning the event is what grants access
beforeEach(async () => {
  hostCookie = await sessionCookieFor("host@example.com");
  otherCookie = await sessionCookieFor("other@example.com");
  const host = await prisma.user.findUniqueOrThrow({ where: { email: "host@example.com" } });
  const base = { type: "WEDDING" as const, timezone: "Africa/Lagos", venueName: "Hall" };
  event = await eventRepo.create(host.id, {
    ...base,
    slug: "main",
    title: "Main",
    date: new Date("2027-05-23T14:00:00Z"),
  });
  secondEvent = await eventRepo.create(host.id, {
    ...base,
    slug: "second",
    title: "Second",
    date: new Date("2027-06-01T14:00:00Z"),
  });
});

function req(cookie: string, method = "GET", body?: unknown, query = "") {
  return new NextRequest(`http://localhost/api/events/x${query}`, {
    method,
    headers: cookie ? { cookie } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
// Route context for /events/[eventId]/... and /events/[eventId]/invitations/[id]
const ctx = (eventId: string) => ({ params: Promise.resolve({ eventId }) });
const ctxFor = (eventId: string, id: string) => ({ params: Promise.resolve({ eventId, id }) });
async function call(response: Promise<Response>) {
  const res = await response;
  return { status: res.status, body: await res.json() };
}

async function create(name: string, eventId = event.id, cookie = hostCookie) {
  const { body } = await call(invitations.POST(req(cookie, "POST", { name }), ctx(eventId)));
  return body.invitation as { id: string; eventId: string; venue: string };
}

describe("owner workflow", () => {
  it("creates, lists, reads, updates, RSVPs and deletes invitations in the event", async () => {
    const ada = await create("Ada");
    expect(ada.eventId).toBe(event.id);
    await create("Grace");

    const list = await call(
      invitations.GET(req(hostCookie, "GET", undefined, "?limit=1&search=a"), ctx(event.id)),
    );
    expect(list.status).toBe(200);
    expect(list.body.pagination).toMatchObject({ limit: 1, total: 2 });

    const read = await call(invitation.GET(req(hostCookie), ctxFor(event.id, ada.id)));
    expect(read.body.invitation).toMatchObject({ name: "Ada", venue: "Hall" });

    const put = await call(
      invitation.PUT(req(hostCookie, "PUT", { plusOne: 2 }), ctxFor(event.id, ada.id)),
    );
    expect(put.body.invitation).toMatchObject({ plusOne: 2, name: "Ada" });

    const rsvp = await call(
      invitation.PATCH(req(hostCookie, "PATCH", { status: "confirmed" }), ctxFor(event.id, ada.id)),
    );
    expect(rsvp.body.invitation.status).toBe("confirmed");

    const del = await call(invitation.DELETE(req(hostCookie, "DELETE"), ctxFor(event.id, ada.id)));
    expect(del.status).toBe(200);
    const gone = await call(invitation.GET(req(hostCookie), ctxFor(event.id, ada.id)));
    expect(gone.status).toBe(404);
  });

  it("bulk-creates rows and reports empty names", async () => {
    const { status: code, body } = await call(
      bulk.POST(req(hostCookie, "POST", { rows: [{ name: "Ada" }, { name: " " }] }), ctx(event.id)),
    );
    expect(code).toBe(201);
    expect(body.summary).toEqual({ total: 2, createdCount: 1, failedCount: 1 });
  });

  it("reports metrics and status updates for this event only", async () => {
    await create("Ada");
    await create("Elsewhere", secondEvent.id);

    const m = await call(metrics.GET(req(hostCookie), ctx(event.id)));
    expect(m.body.metrics).toMatchObject({ totalInvitations: 1 });

    const s = await call(status.GET(req(hostCookie), ctx(event.id)));
    expect(s.body.statusUpdates.map((u: { name: string }) => u.name)).toEqual(["Ada"]);
  });
});

describe("access control", () => {
  it("answers another account with 404 on every route, changing nothing", async () => {
    const ada = await create("Ada");
    const id = ctxFor(event.id, ada.id);

    const responses = await Promise.all([
      invitations.GET(req(otherCookie), ctx(event.id)),
      invitations.POST(req(otherCookie, "POST", { name: "Intruder" }), ctx(event.id)),
      bulk.POST(req(otherCookie, "POST", { rows: [{ name: "Intruder" }] }), ctx(event.id)),
      metrics.GET(req(otherCookie), ctx(event.id)),
      status.GET(req(otherCookie), ctx(event.id)),
      invitation.GET(req(otherCookie), id),
      invitation.PUT(req(otherCookie, "PUT", { name: "Hacked" }), id),
      invitation.PATCH(req(otherCookie, "PATCH", { status: "declined" }), id),
      invitation.DELETE(req(otherCookie, "DELETE"), id),
    ]);

    expect(responses.map((r) => r.status)).toEqual(Array(9).fill(404));
    expect(await prisma.invitation.count()).toBe(1);
    expect(await prisma.invitation.findUniqueOrThrow({ where: { id: ada.id } })).toMatchObject({
      name: "Ada",
      status: "PENDING",
    });
  });

  it("treats an invitation from the owner's other event as missing", async () => {
    const elsewhere = await create("Elsewhere", secondEvent.id);
    const wrongEvent = ctxFor(event.id, elsewhere.id);

    const responses = await Promise.all([
      invitation.GET(req(hostCookie), wrongEvent),
      invitation.PUT(req(hostCookie, "PUT", { name: "Moved?" }), wrongEvent),
      invitation.PATCH(req(hostCookie, "PATCH", { status: "declined" }), wrongEvent),
      invitation.DELETE(req(hostCookie, "DELETE"), wrongEvent),
    ]);

    expect(responses.map((r) => r.status)).toEqual([404, 404, 404, 404]);
    expect(
      await prisma.invitation.findUniqueOrThrow({ where: { id: elsewhere.id } }),
    ).toMatchObject({ name: "Elsewhere", status: "PENDING" });
  });

  it("rejects signed-out callers and PIN guests with 401", async () => {
    const ada = await create("Ada");

    for (const cookie of ["", guestCookie]) {
      const responses = await Promise.all([
        invitations.GET(req(cookie), ctx(event.id)),
        invitation.GET(req(cookie), ctxFor(event.id, ada.id)),
        invitation.PATCH(req(cookie, "PATCH", { status: "confirmed" }), ctxFor(event.id, ada.id)),
      ]);
      expect(responses.map((r) => r.status)).toEqual([401, 401, 401]);
    }
  });

  it("returns 404 for an event that doesn't exist", async () => {
    const { status: code } = await call(metrics.GET(req(hostCookie), ctx("no-such-event")));
    expect(code).toBe(404);
  });
});
