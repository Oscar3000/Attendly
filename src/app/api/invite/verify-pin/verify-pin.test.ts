import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

beforeAll(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://unused");
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
  vi.stubEnv("ADMIN_PASSWORD", "correct-horse");
  vi.stubEnv("INVITE_PIN", "2468");
  vi.stubEnv("BETTER_AUTH_SECRET", "better-auth-test-secret-at-least-32-characters");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
});

function verify(pin: string, ip: string) {
  return POST(
    new NextRequest("http://localhost/api/invite/verify-pin", {
      method: "POST",
      headers: { "x-real-ip": ip },
      body: JSON.stringify({ pin }),
    }),
    {},
  );
}

describe("POST /api/invite/verify-pin", () => {
  it("sets the guest cookie for the right PIN", async () => {
    const response = await verify("2468", "10.1.0.1");
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toMatch(/invite_token=/);
  });

  it("allows 10 failed attempts per IP, then returns 429", async () => {
    const ip = "10.1.0.2";
    for (let i = 0; i < 10; i++) expect((await verify("0000", ip)).status).toBe(401);

    expect((await verify("2468", ip)).status).toBe(429);
  });

  it("doesn't count correct PINs, so guests sharing a venue IP aren't blocked", async () => {
    const venueIp = "10.1.0.3";
    for (let i = 0; i < 50; i++) expect((await verify("2468", venueIp)).status).toBe(200);
  });
});
