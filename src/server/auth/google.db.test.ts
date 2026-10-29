import { beforeAll, describe, expect, it, vi } from "vitest";
import { stubAuthEnv } from "../../../tests/helpers/auth";
import { getAuth, isGoogleEnabled } from "./auth";

beforeAll(() => {
  stubAuthEnv();
  vi.stubEnv("GOOGLE_CLIENT_ID", "client-id.apps.googleusercontent.com");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
});

describe("Google sign-in", () => {
  it("is enabled when both Google variables are set", () => {
    expect(isGoogleEnabled()).toBe(true);
  });

  it("sends the browser to Google with our client id and callback URL", async () => {
    const result = await getAuth().api.signInSocial({
      body: { provider: "google", callbackURL: "/admin", errorCallbackURL: "/login" },
    });

    const url = new URL(result.url!);
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe("client-id.apps.googleusercontent.com");
    // The redirect URI to register in Google Cloud
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/callback/google",
    );
    expect(url.searchParams.get("prompt")).toBe("select_account");
  });

  it("is off without the variables", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    expect(isGoogleEnabled()).toBe(false);
  });
});
