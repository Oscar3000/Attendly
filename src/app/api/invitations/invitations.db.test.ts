import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import { signSession } from "@/server/auth/session";
import { eventRepo } from "@/server/repositories/event.repo";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { sessionCookieFor, stubAuthEnv } from "../../../../tests/helpers/auth";
import * as route from "./[id]/route";

let guestCookie = "";
let invitationId = "";

beforeAll(async () => {
  stubAuthEnv();
  guestCookie = `invite_token=${await signSession("guest")}`;
});

// Tables are truncated before each test
beforeEach(async () => {
  const host = await prisma.user.create({
    data: { id: crypto.randomUUID(), name: "Host", email: "host@example.com" },
  });
  const event = await eventRepo.create(host.id, {
    slug: "wedding",
    type: "WEDDING",
    title: "Wedding",
    date: new Date("2027-05-23T14:00:00Z"),
    timezone: "Africa/Lagos",
    venueName: "Hall",
  });
  const invitation = await invitationRepo.createInvitation(event, {
    name: "Ada",
    status: "pending",
  });
  invitationId = invitation.id;
});

function req(cookie: string, method = "GET", body?: unknown) {
  return new NextRequest(`http://localhost/api/invitations/${invitationId}`, {
    method,
    headers: cookie ? { cookie } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });
async function call(response: Promise<Response>) {
  const res = await response;
  return { status: res.status, body: await res.json() };
}

describe("/api/invitations/[id] (PIN guests)", () => {
  it("lets a guest read their invitation, with the event's date and venue", async () => {
    const { status, body } = await call(route.GET(req(guestCookie), params(invitationId)));

    expect(status).toBe(200);
    expect(body.invitation).toMatchObject({
      name: "Ada",
      venue: "Hall",
      eventDate: "2027-05-23T14:00:00.000Z",
    });
  });

  it("lets a guest update their RSVP status, and rejects an unknown status", async () => {
    const rsvp = await call(
      route.PATCH(req(guestCookie, "PATCH", { status: "confirmed" }), params(invitationId)),
    );
    expect(rsvp.status).toBe(200);
    expect(rsvp.body.invitation.status).toBe("confirmed");

    const invalid = await call(
      route.PATCH(req(guestCookie, "PATCH", { status: "maybe" }), params(invitationId)),
    );
    expect(invalid.status).toBe(400);
  });

  it("returns 404 for an unknown invitation", async () => {
    const { status, body } = await call(route.GET(req(guestCookie), params("missing")));
    expect(status).toBe(404);
    expect(body).toEqual({ error: "Invitation not found" });
  });

  it("rejects account sessions and signed-out callers with 401: hosts use /api/events/...", async () => {
    const hostCookie = await sessionCookieFor("someone@example.com");

    for (const cookie of [hostCookie, ""]) {
      const read = await call(route.GET(req(cookie), params(invitationId)));
      const rsvp = await call(
        route.PATCH(req(cookie, "PATCH", { status: "declined" }), params(invitationId)),
      );
      expect([read.status, rsvp.status]).toEqual([401, 401]);
    }
  });

  it("no longer offers the old admin PUT and DELETE", () => {
    expect(Object.keys(route).sort()).toEqual(["GET", "PATCH"]);
  });
});
