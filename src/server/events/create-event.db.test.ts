import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { createEvent, slugify } from "./create-event";

let ownerId = "";

beforeEach(async () => {
  const owner = await prisma.user.create({
    data: { id: crypto.randomUUID(), name: "Host", email: "host@example.com" },
  });
  ownerId = owner.id;
});

const party = {
  type: "BIRTHDAY" as const,
  title: "Ada's 30th",
  date: new Date("2027-01-01T18:00:00Z"),
  timezone: "Europe/London",
};

describe("slugify", () => {
  it("makes a readable URL segment from a title", () => {
    expect(slugify("Pamela & Oscar")).toBe("pamela-and-oscar");
    expect(slugify("  Zoë's Café — 2027!  ")).toBe("zoe-s-cafe-2027");
    expect(slugify("x".repeat(100))).toHaveLength(60);
  });

  it("falls back to 'event' when nothing usable is left", () => {
    expect(slugify("🎉🎉")).toBe("event");
    expect(slugify("婚礼")).toBe("event");
  });
});

describe("createEvent", () => {
  it("creates the event for its owner with a slug from the title", async () => {
    const event = await createEvent(ownerId, party);
    expect(event).toMatchObject({ ...party, ownerId, slug: "ada-s-30th" });
  });

  it("numbers the slug when it's taken, even by another account", async () => {
    const other = await prisma.user.create({
      data: { id: crypto.randomUUID(), name: "Other", email: "other@example.com" },
    });
    await createEvent(other.id, party);

    const second = await createEvent(ownerId, party);
    const third = await createEvent(ownerId, party);

    expect([second.slug, third.slug]).toEqual(["ada-s-30th-2", "ada-s-30th-3"]);
  });

  it("gets distinct slugs when the same title is created concurrently", async () => {
    const events = await Promise.all(Array.from({ length: 4 }, () => createEvent(ownerId, party)));

    expect(new Set(events.map((event) => event.slug)).size).toBe(4);
  });
});
