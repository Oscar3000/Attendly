import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { BadRequestError, NotFoundError, handleRoute } from "./errors";

const request = () => new NextRequest("http://localhost/api/test");

async function run(handler: () => Promise<Response>) {
  const response = await handleRoute(handler)(request(), {});
  return { status: response.status, body: await response.json() };
}

describe("handleRoute", () => {
  it("passes through successful responses", async () => {
    expect(await run(async () => Response.json({ ok: true }))).toEqual({
      status: 200,
      body: { ok: true },
    });
  });

  it("maps ApiError subclasses to their status and message", async () => {
    expect(
      await run(async () => {
        throw new NotFoundError("Invitation not found");
      }),
    ).toEqual({
      status: 404,
      body: { error: "Invitation not found" },
    });
  });

  it("includes details when provided", async () => {
    const details = { fieldErrors: { name: ["Required"] } };
    expect(
      await run(async () => {
        throw new BadRequestError("Invalid", details);
      }),
    ).toEqual({
      status: 400,
      body: { error: "Invalid", details },
    });
  });

  it("hides unexpected errors behind a 500 and logs them", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(
      await run(async () => {
        throw new Error("db down");
      }),
    ).toEqual({
      status: 500,
      body: { error: "Internal server error" },
    });
    expect(log).toHaveBeenCalledOnce();

    log.mockRestore();
  });
});
