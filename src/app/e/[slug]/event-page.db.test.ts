import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { prisma } from "@/server/db/client";
import { eventRepo, type EventInput } from "@/server/repositories/event.repo";
import EventPage from "./page";

// The camera scanner needs a browser
vi.mock("@/components/home/qr-scanner", () => ({ default: () => null }));

let ownerId = "";

// Users and events are truncated before each test
beforeEach(async () => {
  const user = await prisma.user.create({
    data: { id: crypto.randomUUID(), name: "Host", email: "host@example.com" },
  });
  ownerId = user.id;
});

const base: EventInput = {
  slug: "ada-and-charles",
  type: "WEDDING",
  title: "Ada & Charles' wedding",
  // 23:30 UTC on May 23 is 00:30 on May 24 in Lagos
  date: new Date("2027-05-23T23:30:00Z"),
  timezone: "Africa/Lagos",
};

async function render(slug: string) {
  return renderToStaticMarkup(await EventPage({ params: Promise.resolve({ slug }) }));
}

describe("/e/[slug]", () => {
  it("shows the event's content, with times on the event's clock", async () => {
    await eventRepo.create(ownerId, {
      ...base,
      hostNames: "Ada & Charles",
      headline: "Request the pleasure of your company",
      tagline: "Two families, one celebration",
      venueName: "Canary World",
      venueAddress: "23 Road, Festac Town",
      rsvpDeadline: new Date("2027-05-01T11:00:00Z"),
      familyLines: [{ name: "Mr & Mrs Obi", detail: "of Ntezi" }, { name: "The Smiths" }],
      dressCode: "Traditional attire",
      colorPalette: [
        { name: "Gold", hex: "#D4AF37" },
        { name: "Brown", hex: "#8B4513" },
        { name: "Orange", hex: "#E8750A" },
      ],
      notes: "Church service at 10:00 AM",
    });

    const html = await render("ada-and-charles");

    for (const text of [
      "A &amp; C",
      "Request the pleasure of your company",
      ">Ada<",
      ">Charles<",
      "Two families, one celebration",
      "Monday, May 24, 2027",
      "12:30 AM",
      "Please RSVP by Saturday, May 1, 2027 at 12:00 PM",
      "Canary World",
      "23 Road, Festac Town",
      "Mr &amp; Mrs Obi",
      "of Ntezi",
      "The Smiths",
      "Traditional attire",
      "Gold, Brown &amp; Orange",
      "background-color:#8B4513",
      "Church service at 10:00 AM",
      "Ada &amp; Charles · May 24, 2027",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toContain("Pamela");
  });

  it("falls back to the title and leaves out sections with nothing to show", async () => {
    await eventRepo.create(ownerId, { ...base, title: "Ada's 30th", type: "BIRTHDAY" });

    const html = await render("ada-and-charles");

    expect(html).toContain("Ada&#x27;s 30th");
    expect(html).toContain("You&#x27;re invited to celebrate");
    for (const absent of ["📍", "Colours of the Day", "Dress Code", "Good to Know", "RSVP by"]) {
      expect(html).not.toContain(absent);
    }
  });

  it("is a 404 for an unknown slug", async () => {
    await expect(render("no-such-event")).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });
});
