import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canSendEmail, sendEmail } from "./send-email";

const email = { to: "guest@example.com", subject: "Verify your email", text: "Open this link" };

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://unused");
  vi.stubEnv("BETTER_AUTH_SECRET", "better-auth-test-secret-at-least-32-characters");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("without RESEND_API_KEY", () => {
  it("logs the email in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});

    await sendEmail(email);

    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0]?.[0]).toContain("To: guest@example.com");
    expect(log.mock.calls[0]?.[0]).toContain("Open this link");
  });

  it("throws in production instead of dropping the email", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(sendEmail(email)).rejects.toThrow("Email is not configured");
  });

  it("can send (by logging) in development, but not in production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(canSendEmail()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(canSendEmail()).toBe(false);
  });
});

describe("with RESEND_API_KEY", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "Attendly <hello@example.com>");
  });

  it("can send in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(canSendEmail()).toBe(true);
  });

  it("posts the email to Resend", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "email_1" }));
    vi.stubGlobal("fetch", fetchMock);

    await sendEmail({ ...email, html: "<p>Open this link</p>" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers).toMatchObject({ Authorization: "Bearer re_test_key" });
    expect(JSON.parse(init.body as string)).toEqual({
      from: "Attendly <hello@example.com>",
      to: ["guest@example.com"],
      subject: "Verify your email",
      text: "Open this link",
      html: "<p>Open this link</p>",
    });
  });

  it("throws with Resend's status and reason when it rejects the email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ message: "The example.com domain is not verified" }, { status: 403 }),
      ),
    );

    await expect(sendEmail(email)).rejects.toThrow(/403.*domain is not verified/);
  });
});
