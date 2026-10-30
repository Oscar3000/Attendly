import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { prisma } from "@/server/db/client";
import { eventRepo, type Event, type EventInput } from "@/server/repositories/event.repo";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import TicketPage, { generateMetadata } from "./page";

// next/font only works under Next's compiler
vi.mock("next/font/google", () => ({
  Playfair_Display: () => ({ variable: "font-playfair" }),
  Montserrat: () => ({ variable: "font-montserrat" }),
}));

const base: EventInput = {
  slug: "ada-and-charles",
  type: "WEDDING",
  title: "Ada & Charles' wedding",
  hostNames: "Ada & Charles",
  // 23:30 UTC on May 23 is 00:30 on May 24 in Lagos
  date: new Date("2027-05-23T23:30:00Z"),
  timezone: "Africa/Lagos",
  venueName: "Canary World",
  venueAddress: "23 Road, Festac Town",
};

let event: Event;
let other: Event;

// Tables are truncated before each test
beforeEach(async () => {
  const owner = await prisma.user.create({
    data: { id: crypto.randomUUID(), name: "Host", email: "host@example.com" },
  });
  event = await eventRepo.create(owner.id, base);
  other = await eventRepo.create(owner.id, { ...base, slug: "other-event", title: "Other" });
});

async function guest(name: string, plusOne = 0, inEvent = event) {
  const { id } = await invitationRepo.createInvitation(inEvent, {
    name,
    status: "pending",
    plusOne,
  });
  const { accessToken } = await prisma.invitation.findUniqueOrThrow({ where: { id } });
  return { id, token: accessToken };
}

const params = (slug: string, token: string) => ({ params: Promise.resolve({ slug, token }) });
const render = async (slug: string, token: string) =>
  renderToStaticMarkup(await TicketPage(params(slug, token)));

// notFound() throws an error Next turns into the 404 page
const isNotFound = (error: unknown) =>
  error instanceof Error && "digest" in error && String(error.digest).includes("404");

describe("/e/[slug]/i/[token]", () => {
  it("shows the guest's ticket: name, how many it admits, the event and a QR code", async () => {
    const { token } = await guest("Zelda Fitzgerald", 2);

    const html = await render(base.slug, token);

    expect(html).toContain("Zelda Fitzgerald");
    expect(html).toContain("Admits 3 (you and 2 guests)");
    expect(html).toContain("Ada &amp; Charles");
    expect(html).toContain("Monday, May 24, 2027");
    expect(html).toContain("12:30 AM");
    expect(html).toContain("Canary World");
    expect(html).toMatch(/<img src="data:image\/png;base64,[^"]+" alt="Your entry QR code"/);
  });

  it("has nothing a guest could confirm, decline or check in with", async () => {
    const { token } = await guest("Zelda Fitzgerald");

    const html = await render(base.slug, token);

    expect(html).not.toMatch(/<button|<form|confirm|decline|check in/i);
  });

  it("is a 404 for an unknown token, a malformed one, or another event's", async () => {
    const theirs = await guest("Someone else", 0, other);
    const unknown = "A".repeat(43);

    for (const [slug, token] of [
      [base.slug, unknown],
      [base.slug, "not-a-token"],
      [base.slug, theirs.token],
      ["no-such-event", theirs.token],
    ] as const) {
      await expect(render(slug, token)).rejects.toSatisfy(isNotFound);
    }
    // The same token works under its own event
    expect(await render("other-event", theirs.token)).toContain("Someone else");
  });

  it("shows no QR code for a cancelled or declined invitation", async () => {
    const cancelled = await guest("Cancelled guest");
    const declined = await guest("Declined guest");
    await invitationRepo.updateRsvpStatus(event.id, cancelled.id, "rescinded");
    await invitationRepo.updateRsvpStatus(event.id, declined.id, "declined");

    const cancelledHtml = await render(base.slug, cancelled.token);
    expect(cancelledHtml).toContain("This invitation has been cancelled");
    expect(cancelledHtml).not.toContain("<img");

    const declinedHtml = await render(base.slug, declined.token);
    expect(declinedHtml).toContain("This invitation was declined");
    expect(declinedHtml).not.toContain("<img");
  });

  it("is kept out of search engines and Referer headers, without the guest's name in the title", async () => {
    const { token } = await guest("Zelda Fitzgerald");

    const metadata = await generateMetadata(params(base.slug, token));

    expect(metadata).toMatchObject({
      title: { absolute: "Your invitation · Ada & Charles" },
      robots: { index: false, follow: false },
      referrer: "no-referrer",
    });
    expect(JSON.stringify(metadata)).not.toContain("Zelda");
  });
});
