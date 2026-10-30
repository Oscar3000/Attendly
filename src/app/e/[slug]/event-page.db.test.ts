import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { prisma } from "@/server/db/client";
import { eventRepo, type EventInput } from "@/server/repositories/event.repo";
import { stubAuthEnv } from "../../../../tests/helpers/auth";
import EventPage, { generateMetadata } from "./page";
import OpengraphImage from "./opengraph-image";

// The camera scanner needs a browser
vi.mock("@/components/home/qr-scanner", () => ({ default: () => null }));
// next/font only works under Next's compiler
vi.mock("next/font/google", () => ({
  Playfair_Display: () => ({ variable: "font-playfair" }),
  Montserrat: () => ({ variable: "font-montserrat" }),
}));

let ownerId = "";

// generateMetadata reads BETTER_AUTH_URL for absolute preview image URLs
beforeAll(() => {
  stubAuthEnv();
});

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
    // A birthday with no headline gets the birthday wording (T-407)
    expect(html).toContain("You&#x27;re invited to celebrate the birthday of");
    expect(html).toContain("Counting down to the party");
    for (const absent of ["📍", "Colours of the Day", "Dress Code", "Good to Know", "RSVP by"]) {
      expect(html).not.toContain(absent);
    }
  });

  it("sets the event's theme as CSS variables, defaulting to terracotta (T-405)", async () => {
    const event = await eventRepo.create(ownerId, base);
    expect(await render("ada-and-charles")).toContain("--event-accent:#C07A54");

    await eventRepo.update(event.id, { theme: "navy" });
    const html = await render("ada-and-charles");
    expect(html).toContain("--event-accent:#2B4C7E");
    expect(html).toContain("--event-heading-font:var(--font-montserrat)");

    // A preset that no longer exists falls back to the default
    await prisma.event.update({ where: { id: event.id }, data: { theme: "retired" } });
    expect(await render("ada-and-charles")).toContain("--event-accent:#C07A54");
  });

  it("shows the cover image above the hero when there is one (T-406)", async () => {
    const event = await eventRepo.create(ownerId, base);
    expect(await render("ada-and-charles")).not.toContain("<img");

    const cover = "/uploads/0b8e9d4c-2f7a-4c1e-9d3b-5a6f7e8d9c0b.webp";
    await eventRepo.update(event.id, { coverImageUrl: cover });
    expect(await render("ada-and-charles")).toContain(`<img src="${cover}" alt=""`);
  });

  it("uses the wedding wording unless the host wrote their own headline (T-407)", async () => {
    const event = await eventRepo.create(ownerId, base);
    let html = await render("ada-and-charles");
    expect(html).toContain("Solemnly request your presence at their wedding celebration");
    expect(html).toContain("Counting down to the big day");

    await eventRepo.update(event.id, { headline: "Join us under the stars" });
    html = await render("ada-and-charles");
    expect(html).toContain("Join us under the stars");
    expect(html).not.toContain("Solemnly request");
  });

  it("is a 404 for an unknown slug", async () => {
    await expect(render("no-such-event")).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });
});

describe("/e/[slug] metadata (T-404)", () => {
  const metadataFor = (slug: string) => generateMetadata({ params: Promise.resolve({ slug }) });

  it("titles the page after the hosts and describes when and where, kept out of search", async () => {
    await eventRepo.create(ownerId, {
      ...base,
      hostNames: "Ada & Charles",
      tagline: "Two families, one celebration",
      venueName: "Canary World",
    });

    const metadata = await metadataFor("ada-and-charles");

    const description =
      "Two families, one celebration · Monday, May 24, 2027 at 12:30 AM · Canary World";
    expect(metadata).toMatchObject({
      title: { absolute: "Ada & Charles" },
      description,
      openGraph: { title: "Ada & Charles", description },
      robots: { index: false, follow: false },
    });
    expect(String(metadata.metadataBase)).toBe("http://localhost:3000/");
  });

  it("uses the title, and only the date when there's no venue or tagline", async () => {
    await eventRepo.create(ownerId, base);

    expect(await metadataFor("ada-and-charles")).toMatchObject({
      title: { absolute: "Ada & Charles' wedding" },
      description: "Monday, May 24, 2027 at 12:30 AM",
    });
  });

  it("reveals nothing for an unknown slug", async () => {
    expect(await metadataFor("no-such-event")).toEqual({ title: "Event not found" });
  });

  it("draws a PNG preview image for the event, and 404s for an unknown slug", async () => {
    await eventRepo.create(ownerId, base);

    const image = await OpengraphImage({ params: Promise.resolve({ slug: "ada-and-charles" }) });
    expect(image.headers.get("content-type")).toBe("image/png");
    expect((await image.arrayBuffer()).byteLength).toBeGreaterThan(1000);

    await expect(
      OpengraphImage({ params: Promise.resolve({ slug: "no-such-event" }) }),
    ).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });
});
