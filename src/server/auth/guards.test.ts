import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { UnauthorizedError } from "@/server/http/errors";
import { requireGuest } from "./guards";
import { signSession } from "./session";

beforeAll(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
});

const request = (cookie?: string) =>
  new NextRequest("http://localhost/api/invitations/abc", {
    headers: cookie ? { cookie } : {},
  });

describe("requireGuest", () => {
  it("returns the guest session for a valid PIN cookie", async () => {
    const cookie = `invite_token=${await signSession("guest")}`;
    await expect(requireGuest(request(cookie))).resolves.toEqual({ role: "guest" });
  });

  it("rejects no cookie, a forged token, an account session or an old admin token with 401", async () => {
    const adminTokenAsGuest = `invite_token=${await signSession("admin")}`;

    for (const cookie of [
      undefined,
      "invite_token=forged.token.value",
      "better-auth.session_token=some-account-session",
      adminTokenAsGuest,
    ]) {
      await expect(requireGuest(request(cookie))).rejects.toBeInstanceOf(UnauthorizedError);
    }
  });
});
