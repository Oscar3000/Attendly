import { describe, expect, it } from "vitest";
import { shareLinks } from "./share-links";

const url = "https://attendly.test/e/ada/i/token";

describe("shareLinks", () => {
  it("puts the type's wording and the ticket link in both messages", () => {
    const { email, whatsApp } = shareLinks("WEDDING", "Zelda", url);
    expect(decodeURIComponent(email)).toContain("subject=Wedding invitation - Zelda");
    expect(decodeURIComponent(email)).toContain(`View your invitation: ${url}`);
    expect(decodeURIComponent(whatsApp)).toContain("You're invited to our wedding!");
    expect(decodeURIComponent(whatsApp)).toContain(url);
  });

  it("escapes names that would break the link", () => {
    const { email } = shareLinks("OTHER", "Ada & Co?", url);
    expect(email).toContain("Ada%20%26%20Co%3F");
    expect(email.split("?")).toHaveLength(2);
  });
});
