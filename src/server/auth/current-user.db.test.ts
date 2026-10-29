import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/server/http/errors";
import { stubAuthEnv } from "../../../tests/helpers/auth";
import { getAuth } from "./auth";
import { getCurrentUser, requireUser } from "./current-user";

// The helpers read the request's headers; each test sets the cookie it sends
let requestHeaders = new Headers();
vi.mock("next/headers", () => ({ headers: async () => requestHeaders }));

beforeAll(() => {
  stubAuthEnv();
});

beforeEach(() => {
  requestHeaders = new Headers();
});

// Signs a user up and returns the session cookie Better Auth issued
async function signUp(): Promise<string> {
  const { headers } = await getAuth().api.signUpEmail({
    body: { email: "ada@example.com", password: "correct-horse-battery", name: "Ada" },
    returnHeaders: true,
  });
  return headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

describe("getCurrentUser", () => {
  it("returns null when signed out", async () => {
    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("returns the user for a valid session cookie", async () => {
    requestHeaders = new Headers({ cookie: await signUp() });
    await expect(getCurrentUser()).resolves.toMatchObject({ email: "ada@example.com" });
  });

  it("returns null for a forged session cookie", async () => {
    await signUp();
    requestHeaders = new Headers({ cookie: "better-auth.session_token=forged.signature" });
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});

describe("requireUser", () => {
  it("returns the signed-in user", async () => {
    requestHeaders = new Headers({ cookie: await signUp() });
    await expect(requireUser()).resolves.toMatchObject({ name: "Ada" });
  });

  it("throws a 401 when signed out", async () => {
    await expect(requireUser()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("headers passed by a route handler", () => {
  it("are used instead of next/headers", async () => {
    const cookie = await signUp();
    await expect(getCurrentUser(new Headers({ cookie }))).resolves.toMatchObject({ name: "Ada" });
    // next/headers (requestHeaders) carries no cookie here
    await expect(getCurrentUser()).resolves.toBeNull();
  });
});
