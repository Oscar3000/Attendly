/// <reference types="vite/client" />
/**
 * Tenant isolation (T-311): one account can't read, list, change or delete another account's
 * events or invitations through any API route, or open their dashboard.
 *
 * Every route file under src/app/api is discovered automatically and must be classified in
 * ROUTE_POLICY below, so a new route fails this test until its isolation behaviour is declared.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getAuth } from "@/server/auth/auth";
import { prisma } from "@/server/db/client";
import { eventRepo, type Event } from "@/server/repositories/event.repo";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { doorLinkRepo } from "@/server/repositories/door-link.repo";
import { sessionCookieFor, stubAuthEnv } from "../../../tests/helpers/auth";
import DashboardPage from "../dashboard/page";
import EventDashboardLayout from "../dashboard/events/[eventId]/layout";
import EventSettingsPage from "../dashboard/events/[eventId]/settings/page";
import * as checkIn from "./events/[eventId]/check-in/route";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Handler = (request: NextRequest, context: { params: Promise<object> }) => Promise<Response>;

/*
 * - "victim": addressed at the victim's event or invitation; must be refused (401/403/404;
 *   401 where the route doesn't accept account sessions at all)
 * - "own": works on the caller's own data (or creates for them); may succeed, but must not
 *   reveal or touch the victim's data
 * - "not tenant data": no event or invitation data behind it
 */
type Policy = "victim" | "own" | "not tenant data";

const ROUTE_POLICY: Record<string, Partial<Record<Method, Policy>> | "not tenant data"> = {
  "/api/events/[eventId]": { PUT: "victim" },
  "/api/events/[eventId]/cover": { POST: "victim", DELETE: "victim" },
  "/api/events/[eventId]/invitations": { GET: "victim", POST: "victim" },
  "/api/events/[eventId]/invitations/[id]": {
    GET: "victim",
    PUT: "victim",
    PATCH: "victim",
    DELETE: "victim",
  },
  "/api/events/[eventId]/invitations/bulk": { POST: "victim" },
  "/api/events/[eventId]/metrics": { GET: "victim" },
  "/api/events/[eventId]/check-in": { POST: "victim" },
  "/api/events/[eventId]/door-links": { GET: "victim", POST: "victim" },
  "/api/events/[eventId]/door-links/[linkId]": { DELETE: "victim" },
  "/api/events/[eventId]/status": { GET: "victim" },
  // Creating an event makes the caller its owner (T-310)
  "/api/events": { POST: "own" },
  // PIN guests only (T-312a): account sessions are refused outright
  "/api/invitations/[id]": { GET: "victim", PATCH: "victim" },
  "/api/auth/[...all]": "not tenant data",
  "/api/health": "not tenant data",
  "/api/invite/verify-pin": "not tenant data",
};

// Every route module, keyed by its URL path ("./events/[eventId]/route.ts" -> "/api/events/[eventId]")
const routes = Object.entries(import.meta.glob("./**/route.ts", { eager: true })).map(
  ([file, module]) => ({
    path: `/api/${file.replace(/^\.\//, "").replace(/\/?route\.ts$/, "")}`.replace(/\/$/, ""),
    handlers: module as Partial<Record<Method, Handler>>,
  }),
);
const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

// Every classified route/method to attack. "victim" calls come first, so "own" calls (which
// change the attacker's state, e.g. POST /api/events adds an event) can't change how the
// victim-addressed routes are reached
const attacks = routes
  .flatMap(({ path, handlers }) => {
    const policy = ROUTE_POLICY[path];
    if (!policy || policy === "not tenant data") return [];
    return METHODS.flatMap((method) => {
      const handler = handlers[method];
      const expectation = policy[method];
      return handler && expectation ? [{ path, method, handler, expectation }] : [];
    });
  })
  .sort((a, b) => Number(a.expectation === "own") - Number(b.expectation === "own"));

// Bodies valid enough that only authorization can stop them. A function gets the victim's
// data, e.g. their guest's ticket token to scan
const BODIES: Partial<Record<string, unknown | ((victim: { token: string }) => unknown)>> = {
  "PUT /api/events/[eventId]": {
    title: "Hacked",
    type: "OTHER",
    date: "2030-01-01T12:00",
    timezone: "Europe/London",
  },
  "POST /api/events/[eventId]/invitations": { name: "Intruder" },
  "POST /api/events/[eventId]/invitations/bulk": { rows: [{ name: "Intruder" }] },
  "PUT /api/events/[eventId]/invitations/[id]": { name: "Hacked", plusOne: 9 },
  "PATCH /api/events/[eventId]/invitations/[id]": { status: "declined" },
  "POST /api/events": {
    title: "Intruder's event",
    type: "OTHER",
    date: "2030-01-01T12:00",
    timezone: "Europe/London",
  },
  "PATCH /api/invitations/[id]": { status: "declined" },
  "POST /api/events/[eventId]/door-links": { name: "Intruder at the gate" },
  "POST /api/events/[eventId]/check-in": ({ token }: { token: string }) => ({ code: token }),
};

// Recognisable values, so any leak in a response body is easy to spot
const VICTIM = {
  email: "victim@example.com",
  eventTitle: "Victim's secret wedding",
  guest: "Victim's guest Zelda",
  doorHelper: "Victim's door helper Ben",
};

let victimEvent: Event;
let victimInvitationId = "";
let victimToken = "";
let victimDoorLinkId = "";

beforeAll(() => {
  stubAuthEnv();
});

// Tables are truncated before each test
beforeEach(async () => {
  await sessionCookieFor(VICTIM.email);
  const victim = await prisma.user.findUniqueOrThrow({ where: { email: VICTIM.email } });
  victimEvent = await eventRepo.create(victim.id, {
    slug: "victim-wedding",
    type: "WEDDING",
    title: VICTIM.eventTitle,
    date: new Date("2027-05-23T14:00:00Z"),
    timezone: "Africa/Lagos",
    venueName: "Victim's venue",
  });
  const invitation = await invitationRepo.createInvitation(victimEvent, {
    name: VICTIM.guest,
    status: "pending",
    plusOne: 1,
  });
  victimInvitationId = invitation.id;
  victimToken = (await prisma.invitation.findUniqueOrThrow({ where: { id: invitation.id } }))
    .accessToken;
  victimDoorLinkId = (await doorLinkRepo.create(victimEvent, VICTIM.doorHelper)).link.id;
});

// Everything about the victim's data, to compare before and after the attacks
async function victimSnapshot() {
  return JSON.stringify(
    await prisma.event.findMany({
      where: { owner: { email: VICTIM.email } },
      include: {
        invitations: { orderBy: { id: "asc" } },
        doorLinks: { orderBy: { id: "asc" } },
      },
    }),
  );
}

// Signs the attacker up; the admin variant also owns an event of their own
async function signInAttacker(email: string) {
  const cookie = await sessionCookieFor(email);
  const attacker = await prisma.user.findUniqueOrThrow({ where: { email } });
  const ownEvent = await eventRepo.create(attacker.id, {
    slug: `own-${attacker.id}`,
    type: "BIRTHDAY",
    title: "Attacker's own event",
    date: new Date("2027-06-01T14:00:00Z"),
    timezone: "Europe/London",
  });
  return { cookie, ownEvent };
}

describe("route coverage", () => {
  it("classifies every API route and method", () => {
    const unclassified = routes.flatMap(({ path, handlers }) => {
      const policy = ROUTE_POLICY[path];
      if (policy === "not tenant data") return [];
      return METHODS.filter((method) => handlers[method] && !policy?.[method]).map(
        (method) => `${method} ${path}`,
      );
    });

    expect(unclassified, "add these to ROUTE_POLICY with their isolation behaviour").toEqual([]);
    // Guards against the glob silently matching nothing
    expect(routes.map((route) => route.path)).toContain("/api/events/[eventId]/invitations");
  });
});

// Every account has the same powers; the attacker also owns an event of their own
const email = "attacker@example.com";

describe("another account attacking", () => {
  it("can't read, list, change or delete the victim's data through any route", async () => {
    const { cookie } = await signInAttacker(email);
    const before = await victimSnapshot();
    const failures: string[] = [];

    for (const { path, method, handler, expectation } of attacks) {
      const entry = BODIES[`${method} ${path}`];
      const body = typeof entry === "function" ? entry({ token: victimToken }) : entry;
      const request = new NextRequest(`http://localhost${path}`, {
        method,
        headers: { cookie },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const params = Promise.resolve({
        eventId: victimEvent.id,
        id: victimInvitationId,
        linkId: victimDoorLinkId,
      });
      const response = await handler(request, { params });
      const text = await response.text();

      const label = `${method} ${path} -> ${response.status}`;
      if (expectation === "victim" && ![401, 403, 404].includes(response.status)) {
        failures.push(`${label}: expected 401, 403 or 404`);
      }
      for (const secret of [
        VICTIM.eventTitle,
        VICTIM.guest,
        VICTIM.doorHelper,
        victimEvent.id,
        victimInvitationId,
        victimDoorLinkId,
      ]) {
        if (text.includes(secret)) failures.push(`${label}: response contains "${secret}"`);
      }
    }

    expect(failures).toEqual([]);
    expect(await victimSnapshot()).toBe(before);
  });

  it("can't check the victim's guests in through their own event (T-504)", async () => {
    const { cookie, ownEvent } = await signInAttacker(email);
    const before = await victimSnapshot();

    const response = await checkIn.POST(
      new NextRequest("http://localhost/api/events/x/check-in", {
        method: "POST",
        headers: { cookie },
        body: JSON.stringify({ code: victimToken }),
      }),
      { params: Promise.resolve({ eventId: ownEvent.id }) },
    );

    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain(VICTIM.guest);
    expect(await victimSnapshot()).toBe(before);
  });

  it("gets a 404 from the victim's event dashboard", async () => {
    const { cookie } = await signInAttacker(email);
    requestCookie = cookie;

    await expect(
      EventDashboardLayout({
        children: null,
        params: Promise.resolve({ eventId: victimEvent.id }),
      }),
    ).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("gets a 404 from the victim's settings page, which loads the event itself (T-402)", async () => {
    const { cookie } = await signInAttacker(email);
    requestCookie = cookie;

    await expect(
      EventSettingsPage({ params: Promise.resolve({ eventId: victimEvent.id }) }),
    ).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("sees only their own events on /dashboard (T-310)", async () => {
    const { cookie } = await signInAttacker(email);
    requestCookie = cookie;

    const page = stringsIn(await DashboardPage());
    expect(page).toContain("Attacker's own event");
    expect(page).not.toContain(VICTIM.eventTitle);
    expect(page).not.toContain(victimEvent.id);
  });
});

// Every string in a rendered element tree (text, hrefs, other props): what reaches the HTML
function stringsIn(node: unknown, seen = new WeakSet<object>()): string {
  if (typeof node === "string" || typeof node === "number") return `${node}\n`;
  if (!node || typeof node !== "object" || seen.has(node)) return "";
  seen.add(node);
  if (Array.isArray(node)) return node.map((child) => stringsIn(child, seen)).join("");
  const props = (node as { props?: Record<string, unknown> }).props;
  return props
    ? Object.values(props)
        .map((value) => stringsIn(value, seen))
        .join("")
    : "";
}

// The dashboard layout reads the session through next/headers
let requestCookie = "";
vi.mock("next/headers", () => ({
  headers: async () => new Headers(requestCookie ? { cookie: requestCookie } : {}),
}));

describe("the victim themself", () => {
  it("still sees their own event dashboard", async () => {
    requestCookie = await signInVictim();

    const layout = await EventDashboardLayout({
      children: "ok",
      params: Promise.resolve({ eventId: victimEvent.id }),
    });
    // Including the link to their public event page (T-410)
    expect(stringsIn(layout)).toContain(victimEvent.slug);
    const settings = await EventSettingsPage({
      params: Promise.resolve({ eventId: victimEvent.id }),
    });
    expect(settings.props.initial.title).toBe(VICTIM.eventTitle);
  });
});

// sessionCookieFor signed the victim up in beforeEach; sign in again for a fresh session cookie
async function signInVictim() {
  const { headers } = await getAuth().api.signInEmail({
    body: { email: VICTIM.email, password: "correct-horse-battery" },
    returnHeaders: true,
  });
  return headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}
