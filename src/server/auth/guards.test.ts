import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";
import { requireAdmin, requireAdminOrGuest } from "./guards";
import { signSession } from "./session";

let adminCookie = "";
let guestCookie = "";

beforeAll(async () => {
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-at-least-32-characters-long");
  adminCookie = `auth_token=${await signSession("admin")}`;
  guestCookie = `invite_token=${await signSession("guest")}`;
});

const request = (cookie?: string) =>
  new NextRequest("http://localhost/api/test", { headers: cookie ? { cookie } : {} });

describe("requireAdmin", () => {
  it("returns the admin session", async () => {
    await expect(requireAdmin(request(adminCookie))).resolves.toEqual({ role: "admin" });
  });

  it("rejects a guest with 403", async () => {
    await expect(requireAdmin(request(guestCookie))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects no session, or a guest token placed in the admin cookie, with 401", async () => {
    await expect(requireAdmin(request())).rejects.toBeInstanceOf(UnauthorizedError);
    const guestTokenAsAdmin = guestCookie.replace("invite_token", "auth_token");
    await expect(requireAdmin(request(guestTokenAsAdmin))).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe("requireAdminOrGuest", () => {
  it("accepts either session, preferring admin", async () => {
    await expect(requireAdminOrGuest(request(guestCookie))).resolves.toEqual({ role: "guest" });
    await expect(requireAdminOrGuest(request(`${adminCookie}; ${guestCookie}`))).resolves.toEqual({
      role: "admin",
    });
  });

  it("rejects no session with 401", async () => {
    await expect(requireAdminOrGuest(request())).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
