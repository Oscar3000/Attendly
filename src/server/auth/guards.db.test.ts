import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";
import { sessionCookieFor, stubAuthEnv } from "../../../tests/helpers/auth";
import { requireAdmin, requireAdminOrGuest } from "./guards";
import { signSession } from "./session";

let adminCookie = "";
let userCookie = "";
let guestCookie = "";

beforeAll(async () => {
  stubAuthEnv();
  guestCookie = `invite_token=${await signSession("guest")}`;
});

// ADMIN_EMAIL is admin@example.com (vitest.config.mts); case shouldn't matter
beforeEach(async () => {
  adminCookie = await sessionCookieFor("Admin@Example.com");
  userCookie = await sessionCookieFor("someone@example.com");
});

const request = (cookie?: string) =>
  new NextRequest("http://localhost/api/test", { headers: cookie ? { cookie } : {} });

describe("requireAdmin", () => {
  it("returns the admin session for the ADMIN_EMAIL account", async () => {
    await expect(requireAdmin(request(adminCookie))).resolves.toEqual({ role: "admin" });
  });

  it("rejects any other signed-in account with 403", async () => {
    await expect(requireAdmin(request(userCookie))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects a guest with 403", async () => {
    await expect(requireAdmin(request(guestCookie))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects no session, a forged session or an old admin token with 401", async () => {
    await expect(requireAdmin(request())).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      requireAdmin(request("better-auth.session_token=forged.signature")),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      requireAdmin(request(`auth_token=${await signSession("admin")}`)),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("requireAdminOrGuest", () => {
  it("accepts either session, preferring admin", async () => {
    await expect(requireAdminOrGuest(request(guestCookie))).resolves.toEqual({ role: "guest" });
    await expect(requireAdminOrGuest(request(`${adminCookie}; ${guestCookie}`))).resolves.toEqual({
      role: "admin",
    });
  });

  it("rejects a signed-in non-admin with 403", async () => {
    await expect(requireAdminOrGuest(request(userCookie))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects no session with 401", async () => {
    await expect(requireAdminOrGuest(request())).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
