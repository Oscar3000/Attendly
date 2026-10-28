import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { signSession } from "@/server/auth/session";
import { GET as listInvitations, POST as createInvitation } from "./route";
import { POST as bulkCreate } from "./bulk/route";
import {
  DELETE as deleteInvitation,
  GET as getInvitation,
  PATCH as patchStatus,
  PUT as updateInvitation,
} from "./[id]/route";

const url = "http://localhost/api/invitations";

type Caller = "admin" | "guest" | "anonymous";
const cookies: Record<Caller, string> = { admin: "", guest: "", anonymous: "" };

beforeAll(async () => {
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
  cookies.admin = `auth_token=${await signSession("admin")}`;
  cookies.guest = `invite_token=${await signSession("guest")}`;
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
  const { body } = await call(
    createInvitation(
      jsonRequest("POST", { name: "Ada", eventDate: "2026-05-23T14:00", venue: "Hall" }),
      {},
    ),
  );
  return body.invitation as { id: string; status: string; plusOne: number };
}

describe("POST /api/invitations", () => {
  it("creates an invitation with defaults", async () => {
    const invitation = await createGuest();
    expect(invitation).toMatchObject({ status: "pending", plusOne: 0 });
  });

  it("rejects invalid fields with a 400 and field errors", async () => {
    const { status, body } = await call(
      createInvitation(
        jsonRequest("POST", { name: " ", eventDate: "not a date", plusOne: -1 }),
        {},
      ),
    );

    expect(status).toBe(400);
    expect(body.error).toBe("Invalid request body");
    expect(Object.keys(body.details.fieldErrors).sort()).toEqual([
      "eventDate",
      "name",
      "plusOne",
      "venue",
    ]);
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
      bulkCreate(
        jsonRequest("POST", {
          eventDate: "2026-05-23T14:00",
          venue: "Hall",
          rows: [{ name: "Ada", plusOne: 1 }, { name: "  " }],
        }),
        {},
      ),
    );

    expect(status).toBe(201);
    expect(body.summary).toEqual({ total: 2, createdCount: 1, failedCount: 1 });
    expect(body.failed[0]).toMatchObject({ row: 2, error: "Name is required" });
  });

  it("rejects an empty rows array", async () => {
    const { status } = await call(
      bulkCreate(
        jsonRequest("POST", { eventDate: "2026-05-23T14:00", venue: "Hall", rows: [] }),
        {},
      ),
    );
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

  it("returns 403 when a guest calls an admin-only endpoint", async () => {
    const created = await createGuest();
    const guest = (method: string, body?: unknown) => jsonRequest(method, body, "guest");
    const valid = { name: "Eve", eventDate: "2026-05-23T14:00", venue: "Hall" };

    const responses = await Promise.all([
      listInvitations(guest("GET"), {}),
      createInvitation(guest("POST", valid), {}),
      bulkCreate(guest("POST", { ...valid, rows: [{ name: "Eve" }] }), {}),
      updateInvitation(guest("PUT", { name: "Hacked" }), params(created.id)),
      deleteInvitation(guest("DELETE"), params(created.id)),
    ]);

    expect(responses.map((r) => r.status)).toEqual([403, 403, 403, 403, 403]);
    const stillThere = await call(getInvitation(jsonRequest("GET"), params(created.id)));
    expect(stillThere.body.invitation.name).toBe("Ada");
  });

  it("returns 401 without a session, before validating the body", async () => {
    const { status } = await call(createInvitation(jsonRequest("POST", {}, "anonymous"), {}));
    expect(status).toBe(401);

    const read = await call(getInvitation(jsonRequest("GET", undefined, "anonymous"), params("x")));
    expect(read.status).toBe(401);
  });
});
