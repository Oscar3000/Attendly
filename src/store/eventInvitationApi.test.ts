import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { invitationApi } from "./invitationApi";
import { eventInvitationApi } from "./eventInvitationApi";

// The slice calls relative /api/ URLs, as in the browser; resolve them against a dummy origin
class RelativeRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === "string" ? new URL(input, "http://localhost") : input, init);
  }
}

let calls: string[] = [];

function makeStore() {
  return configureStore({
    reducer: { [invitationApi.reducerPath]: invitationApi.reducer },
    middleware: (getDefault) => getDefault().concat(invitationApi.middleware),
  });
}

beforeEach(() => {
  calls = [];
  vi.stubGlobal("Request", RelativeRequest);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      const { pathname, search } = new URL(request.url);
      calls.push(`${request.method} ${pathname}${search}`);
      if (pathname.endsWith("/metrics")) return Response.json({ metrics: { totalInvitations: 0 } });
      if (pathname.endsWith("/status")) return Response.json({ statusUpdates: [] });
      if (request.method === "GET") {
        return Response.json({
          invitations: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
      }
      return Response.json({ invitation: { id: "new" } }, { status: 201 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const { endpoints } = eventInvitationApi;
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("eventInvitationApi", () => {
  it("calls the event-scoped routes", async () => {
    const store = makeStore();

    await store.dispatch(
      endpoints.getEventInvitations.initiate({ eventId: "ev 1", page: 2, search: "ada" }),
    );
    await store.dispatch(endpoints.getEventMetrics.initiate("ev1"));
    await store.dispatch(endpoints.getEventStatusUpdates.initiate("ev1"));
    await store.dispatch(
      endpoints.updateEventRsvpStatus.initiate({ eventId: "ev1", id: "inv1", status: "confirmed" }),
    );

    // The PATCH then refetches this event's still-subscribed queries; only check the requests made
    expect(calls.slice(0, 4)).toEqual([
      "GET /api/events/ev%201/invitations?page=2&limit=10&search=ada",
      "GET /api/events/ev1/metrics",
      "GET /api/events/ev1/status",
      "PATCH /api/events/ev1/invitations/inv1",
    ]);
  });

  it("refetches only the changed event's data after a write", async () => {
    const store = makeStore();
    // Subscribed queries, as a mounted dashboard would have
    for (const eventId of ["A", "B"]) {
      store.dispatch(endpoints.getEventInvitations.initiate({ eventId }));
      store.dispatch(endpoints.getEventMetrics.initiate(eventId));
      store.dispatch(endpoints.getEventStatusUpdates.initiate(eventId));
    }
    await settle();
    calls = [];

    await store.dispatch(
      endpoints.createEventInvitation.initiate({
        eventId: "A",
        invitation: { name: "Ada", status: "pending", plusOne: 0 },
      }),
    );
    await settle();

    expect(calls[0]).toBe("POST /api/events/A/invitations");
    const refetched = calls.slice(1).sort();
    expect(refetched).toEqual([
      "GET /api/events/A/invitations?page=1&limit=10",
      "GET /api/events/A/metrics",
      "GET /api/events/A/status",
    ]);
  });
});
