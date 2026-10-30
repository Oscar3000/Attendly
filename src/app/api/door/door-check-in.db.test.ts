import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { prisma } from "@/server/db/client";
import { eventRepo, type Event } from "@/server/repositories/event.repo";
import { invitationRepo } from "@/server/repositories/invitation.repo";
import { doorLinkRepo } from "@/server/repositories/door-link.repo";
import * as doorCheckIn from "./[token]/check-in/route";
import DoorPage from "../../door/[token]/page";

// The camera needs a browser
vi.mock("@/components/check-in/qr-camera", () => ({ QrCamera: () => null }));

let event: Event;
let otherEvent: Event;

// Events, invitations, door links and check-ins are truncated before each test
beforeEach(async () => {
  const owner = await prisma.user.create({
    data: { id: crypto.randomUUID(), name: "Ada", email: "host@example.com" },
  });
  const base = {
    type: "WEDDING" as const,
    date: new Date("2030-05-23T14:00:00Z"),
    timezone: "Africa/Lagos",
  };
  event = await eventRepo.create(owner.id, {
    ...base,
    slug: "main",
    title: "Main",
    hostNames: "Ada & Charles",
  });
  otherEvent = await eventRepo.create(owner.id, { ...base, slug: "other", title: "Other" });
});

async function guest(name: string, plusOne = 0, inEvent = event) {
  const { id, ticketUrl } = await invitationRepo.createInvitation(inEvent, {
    name,
    status: "pending",
    plusOne,
  });
  return { id, url: ticketUrl! };
}

const helper = async (name = "Ben, front gate", inEvent = event) => {
  const { link, token } = await doorLinkRepo.create(inEvent, name);
  return { id: link.id, token };
};

async function scan(token: string, body: object) {
  const response = await doorCheckIn.POST(
    new NextRequest("http://localhost/api/door/x/check-in", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ token }) },
  );
  return { status: response.status, body: await response.json() };
}

describe("POST /api/door/[token]/check-in", () => {
  it("checks guests in with no sign-in, recording the helper's link as who admitted them", async () => {
    const ben = await helper();
    const zelda = await guest("Zelda", 1);

    expect((await scan(ben.token, { code: zelda.url, preview: true })).body).toEqual({
      result: "ready",
      guest: { name: "Zelda", admits: 2, admitted: 0 },
    });
    expect(await scan(ben.token, { code: zelda.url })).toEqual({
      status: 200,
      body: { result: "admitted", guest: { name: "Zelda", admits: 2, admitted: 2 }, count: 2 },
    });
    expect(
      await prisma.checkIn.findMany({ select: { doorLinkId: true, checkedInByUserId: true } }),
    ).toEqual([{ doorLinkId: ben.id, checkedInByUserId: null }]);

    // The friend outside: a second scan names the helper who let them in
    expect((await scan(ben.token, { code: zelda.url })).body).toMatchObject({
      result: "full",
      lastCheckIn: { by: "Ben, front gate" },
    });
    expect((await doorLinkRepo.listForEvent(event.id))[0]).toMatchObject({ admitted: 2 });
  });

  it("can't check in another event's guests, even the same host's", async () => {
    const ben = await helper();
    const elsewhere = await guest("Other event's guest", 0, otherEvent);

    expect(await scan(ben.token, { code: elsewhere.url })).toEqual({
      status: 404,
      body: { result: "not_found" },
    });
    expect(await prisma.checkIn.count()).toBe(0);
  });

  it("stops working once revoked or expired, and for unknown tokens", async () => {
    const ben = await helper();
    const expired = await helper("Amy");
    await prisma.doorLink.update({
      where: { id: expired.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const zelda = await guest("Zelda");
    await doorLinkRepo.revoke(event.id, ben.id);

    for (const token of [ben.token, expired.token, "A".repeat(43), ""]) {
      expect(await scan(token, { code: zelda.url })).toEqual({
        status: 403,
        body: { result: "link_inactive" },
      });
    }
    expect(await prisma.invitation.findUniqueOrThrow({ where: { id: zelda.id } })).toMatchObject({
      admittedCount: 0,
    });
  });
});

describe("/door/[token]", () => {
  const render = async (token: string) =>
    renderToStaticMarkup(await DoorPage({ params: Promise.resolve({ token }) }));

  it("shows the event's name, who is checking in and the scanner, and nothing else", async () => {
    const ben = await helper();
    await guest("Zelda Fitzgerald");

    const html = await render(ben.token);

    expect(html).toContain("Ada &amp; Charles");
    expect(html).toContain("Checking in as Ben, front gate");
    expect(html).toContain("Or paste the ticket link or code");
    // No guest list
    expect(html).not.toContain("Zelda");
  });

  it("says a revoked link no longer works, and 404s for an unknown one", async () => {
    const ben = await helper();
    await doorLinkRepo.revoke(event.id, ben.id);

    const html = await render(ben.token);
    expect(html).toContain("This check-in link no longer works");
    expect(html).not.toContain("Ada &amp; Charles");

    await expect(render("A".repeat(43))).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });
});
