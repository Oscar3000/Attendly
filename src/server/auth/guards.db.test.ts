import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";
import { sessionCookieFor, stubAuthEnv } from "../../../tests/helpers/auth";
import { requireAdminOrGuest } from "./guards";
import { signSession } from "./session";

let adminCookie = "";
let userCookie = "";
let guestCookie = "";

beforeAll(async () => {
  stubAuthEnv();
  guestCookie = `invite_token=${await signSession("guest")}`;
});

// ADMIN_EMAIL is admin@example.com (vitest.config.mts)
beforeEach(async () => {
  adminCookie = await sessionCookieFor("admin@example.com");
  userCookie = await sessionCookieFor("someone@example.com");
});

const request = (cookie?: string) =>
  new NextRequest("http://localhost/api/test", { headers: cookie ? { cookie } : {} });

describe("requireAdminOrGuest", () => {
  it("accepts the admin account, returning the user", async () => {
    await expect(requireAdminOrGuest(request(adminCookie))).resolves.toMatchObject({
      role: "admin",
      user: { email: "admin@example.com" },
    });
  });

  it("accepts a guest session, preferring admin when both are present", async () => {
    await expect(requireAdminOrGuest(request(guestCookie))).resolves.toEqual({ role: "guest" });
    await expect(
      requireAdminOrGuest(request(`${adminCookie}; ${guestCookie}`)),
    ).resolves.toMatchObject({ role: "admin" });
  });

  it("rejects any other account with 403", async () => {
    await expect(requireAdminOrGuest(request(userCookie))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects no session, a forged session or an old admin token with 401", async () => {
    await expect(requireAdminOrGuest(request())).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      requireAdminOrGuest(request("better-auth.session_token=forged.signature")),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      requireAdminOrGuest(request(`auth_token=${await signSession("admin")}`)),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
