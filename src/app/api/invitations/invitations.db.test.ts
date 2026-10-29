import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import { signSession } from "@/server/auth/session";
import { eventRepo } from "@/server/repositories/event.repo";
import { sessionCookieFor, stubAuthEnv } from "../../../../tests/helpers/auth";
import { GET as listInvitations, POST as createInvitation } from "./route";
import { POST as bulkCreate } from "./bulk/route";
import {
  DELETE as deleteInvitation,
  GET as getInvitation,
  PATCH as patchStatus,
  PUT as updateInvitation,
} from "./[id]/route";

const url = "http://localhost/api/invitations";

type Caller = "admin" | "user" | "guest" | "anonymous";
const cookies: Record<Caller, string> = { admin: "", user: "", guest: "", anonymous: "" };

beforeAll(async () => {
  stubAuthEnv();
  cookies.guest = `invite_token=${await signSession("guest")}`;
});

const eventDate = new Date("2026-05-23T14:00:00Z");

// Accounts are truncated before each test, so sign in again each time.
// New invitations go to the admin's only event (requireCurrentEvent)
beforeEach(async () => {
  cookies.admin = await sessionCookieFor("admin@example.com");
  cookies.user = await sessionCookieFor("someone@example.com");
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@example.com" } });
  await eventRepo.create(admin.id, {
    slug: "wedding",
    type: "WEDDING",
    title: "Wedding",
    date: eventDate,
    timezone: "Africa/Lagos",
    venueName: "Hall",
  });
});

function jsonRequest(method: string, body?: unknown, as: Caller = "admin") {
  return new NextRequest(url, {
    method,
    headers: cookies[as] ? { cookie: cookies[as] } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

async function call(response: Promise<Response>) {
  const res = await response;
  return { status: res.status, body: await res.json() };
}

async function createGuest() {
  const { body } = await call(createInvitation(jsonRequest("POST", { name: "Ada" }), {}));
  return body.invitation as { id: string; status: string; plusOne: number; eventId: string };
}

describe("POST /api/invitations", () => {
  it("creates an invitation with defaults, on the admin's event", async () => {
    const invitation = await createGuest();
    const event = await prisma.event.findFirstOrThrow();
    expect(invitation).toMatchObject({
      status: "pending",
      plusOne: 0,
      eventId: event.id,
      venue: "Hall",
      eventDate: eventDate.toISOString(),
    });
  });

  it("ignores a date or venue sent with the invitation: they belong to the event", async () => {
    const { body } = await call(
      createInvitation(
        jsonRequest("POST", { name: "Ada", eventDate: "2030-01-01T00:00", venue: "Elsewhere" }),
        {},
      ),
    );
    expect(body.invitation).toMatchObject({ venue: "Hall", eventDate: eventDate.toISOString() });
  });

  it("returns 409 when the admin has no event yet", async () => {
    await prisma.event.deleteMany();
    const { status, body } = await call(createInvitation(jsonRequest("POST", { name: "Ada" }), {}));
    expect(status).toBe(409);
    expect(body.error).toMatch(/no event yet/);
  });

  it("rejects invalid fields with a 400 and field errors", async () => {
    const { status, body } = await call(
      createInvitation(jsonRequest("POST", { name: " ", plusOne: -1 }), {}),
    );

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid request body");
    expect(Object.keys(body.details.fieldErrors).sort()).toEqual(["name", "plusOne"]);
  });
});

describe("/api/invitations/[id]", () => {
  it("returns 404 for an unknown invitation", async () => {
    const { status, body } = await call(getInvitation(jsonRequest("GET"), params("missing")));
    expect(status).toBe(404);
    expect(body).toEqual({ error: "Invitation not found" });
  });

  it("PUT only changes the fields that were sent", async () => {
    const created = await createGuest();
    await call(patchStatus(jsonRequest("PATCH", { status: "confirmed" }), params(created.id)));

    const { status, body } = await call(
      updateInvitation(jsonRequest("PUT", { plusOne: 2 }), params(created.id)),
    );

    expect(status).toBe(200);
    expect(body.invitation).toMatchObject({ plusOne: 2, status: "confirmed", name: "Ada" });
  });

  it("PATCH rejects an unknown status", async () => {
    const created = await createGuest();
    const { status } = await call(
      patchStatus(jsonRequest("PATCH", { status: "maybe" }), params(created.id)),
    );
    expect(status).toBe(400);
  });
});

describe("POST /api/invitations/bulk", () => {
  it("creates valid rows and reports empty names per row", async () => {
    const { status, body } = await call(
      bulkCreate(jsonRequest("POST", { rows: [{ name: "Ada", plusOne: 1 }, { name: "  " }] }), {}),
    );

    expect(status).toBe(201);
    expect(body.summary).toEqual({ total: 2, createdCount: 1, failedCount: 1 });
    expect(body.failed[0]).toMatchObject({ row: 2, error: "Name is required" });
  });

  it("rejects an empty rows array", async () => {
    const { status } = await call(bulkCreate(jsonRequest("POST", { rows: [] }), {}));
    expect(status).toBe(400);
  });
});

describe("access control", () => {
  it("lets a guest read one invitation and update its RSVP status", async () => {
    const created = await createGuest();

    const read = await call(
      getInvitation(jsonRequest("GET", undefined, "guest"), params(created.id)),
    );
    expect(read.status).toBe(200);

    const rsvp = await call(
      patchStatus(jsonRequest("PATCH", { status: "confirmed" }, "guest"), params(created.id)),
    );
    expect(rsvp.status).toBe(200);
    expect(rsvp.body.invitation.status).toBe("confirmed");
  });

  // A guest has no account session, so admin-only endpoints treat them as signed out
  it("returns 401 when a guest calls an admin-only endpoint", async () => {
    const created = await createGuest();
    const guest = (method: string, body?: unknown) => jsonRequest(method, body, "guest");
    const valid = { name: "Eve" };

    const responses = await Promise.all([
      listInvitations(guest("GET"), {}),
      createInvitation(guest("POST", valid), {}),
      bulkCreate(guest("POST", { ...valid, rows: [{ name: "Eve" }] }), {}),
      updateInvitation(guest("PUT", { name: "Hacked" }), params(created.id)),
      deleteInvitation(guest("DELETE"), params(created.id)),
    ]);

    expect(responses.map((r) => r.status)).toEqual([401, 401, 401, 401, 401]);
    const stillThere = await call(getInvitation(jsonRequest("GET"), params(created.id)));
    expect(stillThere.body.invitation.name).toBe("Ada");
  });

  it("returns 403 when a signed-in account other than ADMIN_EMAIL calls the API", async () => {
    const created = await createGuest();

    const responses = await Promise.all([
      listInvitations(jsonRequest("GET", undefined, "user"), {}),
      getInvitation(jsonRequest("GET", undefined, "user"), params(created.id)),
      deleteInvitation(jsonRequest("DELETE", undefined, "user"), params(created.id)),
    ]);

    expect(responses.map((r) => r.status)).toEqual([403, 403, 403]);
  });

  it("returns 401 without a session, before validating the body", async () => {
    const { status } = await call(createInvitation(jsonRequest("POST", {}, "anonymous"), {}));
    expect(status).toBe(401);

    const read = await call(getInvitation(jsonRequest("GET", undefined, "anonymous"), params("x")));
    expect(read.status).toBe(401);
  });
});
