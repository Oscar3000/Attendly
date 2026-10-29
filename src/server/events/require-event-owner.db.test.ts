import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { NotFoundError, UnauthorizedError } from "@/server/http/errors";
import { eventRepo, type Event } from "@/server/repositories/event.repo";
import { sessionCookieFor, stubAuthEnv } from "../../../tests/helpers/auth";
import { requireEventOwner } from "./require-event-owner";

let ownerHeaders: Headers;
let otherHeaders: Headers;
let event: Event;

beforeAll(() => {
  stubAuthEnv();
});

// Accounts and events are truncated before each test
beforeEach(async () => {
  // Not ADMIN_EMAIL: owning the event is what grants access
  ownerHeaders = new Headers({ cookie: await sessionCookieFor("host@example.com") });
  otherHeaders = new Headers({ cookie: await sessionCookieFor("other@example.com") });
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: "host@example.com" } });
  event = await eventRepo.create(owner.id, {
    slug: "host-party",
    type: "BIRTHDAY",
    title: "Host's party",
    date: new Date("2027-01-01T18:00:00Z"),
    timezone: "Europe/London",
  });
});

describe("requireEventOwner", () => {
  it("returns the user and the event for its owner", async () => {
    const result = await requireEventOwner(event.id, ownerHeaders);

    expect(result.event).toEqual(event);
    expect(result.user.email).toBe("host@example.com");
  });

  it("answers another account with the same 404 as a missing event", async () => {
    const notMine = requireEventOwner(event.id, otherHeaders);
    const missing = requireEventOwner("no-such-event", ownerHeaders);

    await expect(notMine).rejects.toBeInstanceOf(NotFoundError);
    await expect(missing).rejects.toBeInstanceOf(NotFoundError);
    const [a, b] = await Promise.allSettled([notMine, missing]);
    expect((a as PromiseRejectedResult).reason.message).toBe(
      (b as PromiseRejectedResult).reason.message,
    );
  });

  it("rejects a signed-out request with 401, before looking up the event", async () => {
    await expect(requireEventOwner(event.id, new Headers())).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
