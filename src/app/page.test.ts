import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "./page";

const cookie = vi.hoisted(() => ({ value: "" }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(cookie.value ? { cookie: cookie.value } : {}),
}));

async function render(sessionCookie: string) {
  cookie.value = sessionCookie;
  return renderToStaticMarkup(await HomePage());
}

const links = (html: string) => [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);

describe("landing page", () => {
  it("offers sign-up and log-in to visitors", async () => {
    const html = await render("");

    expect(html).toContain("Create your event");
    expect(links(html)).toEqual(expect.arrayContaining(["/signup", "/login", "#how-it-works"]));
    expect(links(html)).not.toContain("/dashboard");
  });

  it("offers signed-in hosts their events instead", async () => {
    const html = await render("better-auth.session_token=any-value");

    expect(html).toContain("Go to your events");
    expect(links(html)).toContain("/dashboard");
    expect(links(html)).not.toContain("/signup");
    expect(links(html)).not.toContain("/login");
  });

  it("doesn't mention the original wedding", async () => {
    expect(await render("")).not.toMatch(/Oscar|Pamela|P &amp; O|OscarPam/);
  });
});
