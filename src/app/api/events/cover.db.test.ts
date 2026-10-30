import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { prisma } from "@/server/db/client";
import { eventRepo, type Event } from "@/server/repositories/event.repo";
import { sessionCookieFor, stubAuthEnv } from "../../../../tests/helpers/auth";
import * as cover from "./[eventId]/cover/route";
import * as uploads from "../../uploads/[file]/route";

let hostCookie = "";
let otherCookie = "";
let event: Event;

beforeAll(() => {
  stubAuthEnv();
});

// Accounts, events and images are truncated before each test
beforeEach(async () => {
  hostCookie = await sessionCookieFor("host@example.com");
  otherCookie = await sessionCookieFor("other@example.com");
  const host = await prisma.user.findUniqueOrThrow({ where: { email: "host@example.com" } });
  event = await eventRepo.create(host.id, {
    slug: "main",
    type: "WEDDING",
    title: "Main",
    date: new Date("2027-05-23T14:00:00Z"),
    timezone: "Africa/Lagos",
  });
});

const ctx = (eventId: string) => ({ params: Promise.resolve({ eventId }) });

// A real image: width x height, with EXIF metadata (including a GPS-ish comment) attached
async function photo(format: "jpeg" | "png" | "webp", width = 3000, height = 1500) {
  return sharp({ create: { width, height, channels: 3, background: "#C07A54" } })
    .withExif({ IFD0: { ImageDescription: "GPS 6.45N 3.39E" } })
    .toFormat(format)
    .toBuffer();
}

function upload(cookie: string, bytes: Buffer | string, type = "image/jpeg", eventId = event.id) {
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(Buffer.from(bytes))], { type }), "cover");
  const request = new NextRequest("http://localhost/api/events/x/cover", {
    method: "POST",
    headers: { cookie },
    body: form,
  });
  return cover.POST(request, ctx(eventId));
}

function remove(cookie: string) {
  return cover.DELETE(
    new NextRequest("http://localhost/api/events/x/cover", {
      method: "DELETE",
      headers: { cookie },
    }),
    ctx(event.id),
  );
}

// The ids of every stored image, as they appear in /uploads/<id>.webp
const storedImages = async () =>
  (await prisma.eventImage.findMany({ select: { id: true } })).map(({ id }) => id);
const idOf = (url: string) => url.replace(/^\/uploads\/|\.webp$/g, "");

async function serve(url: string) {
  const file = url.replace(/^\/uploads\//, "");
  return uploads.GET(new Request(`http://localhost${url}`), {
    params: Promise.resolve({ file }),
  });
}

describe("POST /api/events/[eventId]/cover", () => {
  it.each(["jpeg", "png", "webp"] as const)(
    "stores a %s as a WebP at most 2000px wide, without its metadata",
    async (format) => {
      const res = await upload(hostCookie, await photo(format), `image/${format}`);

      expect(res.status).toBe(200);
      const { coverImageUrl } = await res.json();
      expect(coverImageUrl).toMatch(/^\/uploads\/[0-9a-f-]{36}\.webp$/);
      expect((await eventRepo.findById(event.id))?.coverImageUrl).toBe(coverImageUrl);

      const served = await serve(coverImageUrl);
      expect(served.headers.get("content-type")).toBe("image/webp");
      expect(served.headers.get("cache-control")).toContain("immutable");
      const meta = await sharp(Buffer.from(await served.arrayBuffer())).metadata();
      expect(meta).toMatchObject({ format: "webp", width: 2000, height: 1000 });
      expect(meta.exif).toBeUndefined();
    },
  );

  it("replaces the previous cover and deletes its file", async () => {
    const first = await (await upload(hostCookie, await photo("png", 400, 200))).json();
    const second = await (await upload(hostCookie, await photo("png", 400, 200))).json();

    expect(second.coverImageUrl).not.toBe(first.coverImageUrl);
    expect(await storedImages()).toEqual([idOf(second.coverImageUrl)]);
    expect((await serve(first.coverImageUrl)).status).toBe(404);
  });

  it("refuses files that aren't JPEG, PNG or WebP, whatever their declared type", async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const gif = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "#000" },
    })
      .gif()
      .toBuffer();

    for (const [bytes, type] of [
      [svg, "image/png"],
      [gif, "image/jpeg"],
      ["not an image", "image/jpeg"],
      ["", "image/jpeg"],
    ] as const) {
      const res = await upload(hostCookie, bytes, type);
      expect(res.status).toBe(400);
      expect((await res.json()).details.fieldErrors.file).toHaveLength(1);
    }
    expect(await storedImages()).toEqual([]);
    expect((await eventRepo.findById(event.id))?.coverImageUrl).toBeNull();
  });

  it("refuses images over 5 MB", async () => {
    const res = await upload(hostCookie, Buffer.alloc(5 * 1024 * 1024 + 1), "image/jpeg");

    expect(res.status).toBe(400);
    expect((await res.json()).details.fieldErrors.file).toEqual(["Images must be 5 MB or smaller"]);
    expect(await storedImages()).toEqual([]);
  });

  it("answers another account with 404 and signed-out callers with 401, storing nothing", async () => {
    const image = await photo("png", 100, 100);

    expect((await upload(otherCookie, image)).status).toBe(404);
    expect((await upload("", image)).status).toBe(401);
    expect((await upload(hostCookie, image, "image/png", "no-such-event")).status).toBe(404);
    expect(await storedImages()).toEqual([]);
  });
});

describe("DELETE /api/events/[eventId]/cover", () => {
  it("removes the cover and its file; only the owner can", async () => {
    const { coverImageUrl } = await (await upload(hostCookie, await photo("png", 100, 100))).json();

    expect((await remove(otherCookie)).status).toBe(404);
    expect(await storedImages()).toHaveLength(1);

    expect((await remove(hostCookie)).status).toBe(200);
    expect((await eventRepo.findById(event.id))?.coverImageUrl).toBeNull();
    expect(await storedImages()).toEqual([]);
    expect((await serve(coverImageUrl)).status).toBe(404);
  });
});

describe("stored images", () => {
  it("are deleted with their event, and one event's cover never touches another's", async () => {
    const host = await prisma.user.findUniqueOrThrow({ where: { email: "host@example.com" } });
    const other = await eventRepo.create(host.id, {
      slug: "other",
      type: "OTHER",
      title: "Other",
      date: new Date("2027-06-01T14:00:00Z"),
      timezone: "Africa/Lagos",
    });
    const mine = await (await upload(hostCookie, await photo("png", 100, 100))).json();
    const theirs = await (
      await upload(hostCookie, await photo("png", 100, 100), "image/png", other.id)
    ).json();

    // Replacing this event's cover leaves the other event's image alone
    await upload(hostCookie, await photo("png", 100, 100));
    expect(await storedImages()).toContain(idOf(theirs.coverImageUrl));
    expect(await storedImages()).not.toContain(idOf(mine.coverImageUrl));

    await eventRepo.delete(event.id);
    expect(await storedImages()).toEqual([idOf(theirs.coverImageUrl)]);
  });
});

describe("GET /uploads/[file]", () => {
  it("only serves stored file names, so paths can't escape the folder", async () => {
    for (const file of ["../package.json", "..%2Fpackage.json", "x.webp", "cover.png"]) {
      const res = await uploads.GET(new Request("http://localhost/uploads/x"), {
        params: Promise.resolve({ file }),
      });
      expect(res.status).toBe(404);
    }
  });
});
