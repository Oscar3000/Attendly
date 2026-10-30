import { describe, expect, it } from "vitest";
import { invitationCardContent, type InvitationCardEvent } from "./invitation-image";
import { THEMES } from "./themes";

const wedding: InvitationCardEvent = {
  type: "WEDDING",
  title: "Ada & Charles' wedding",
  hostNames: "Ada & Charles",
  // 23:30 UTC on May 23 is 00:30 on May 24 in Lagos
  date: "2027-05-23T23:30:00.000Z",
  timezone: "Africa/Lagos",
  venueName: "Canary World",
  venueAddress: "23 Road, Festac Town",
  tagline: "#AdaCharles2027",
  colorPalette: [
    { name: "Gold", hex: "#D4AF37" },
    { name: "Brown", hex: "#8B4513" },
  ],
  theme: "terracotta",
};

const guest = { name: "Zelda Fitzgerald", plusOne: 2 };

describe("invitationCardContent", () => {
  it("draws the event's names, date, venue, colours and tagline, not the original wedding's", () => {
    const content = invitationCardContent(wedding, guest);

    expect(content).toMatchObject({
      monogram: "A & C",
      names: undefined,
      when: "May 24, 2027  •  12:30 AM",
      admits: "Admits 3",
      greeting: "Dear Zelda",
      venue: { name: "Canary World", address: "23 Road, Festac Town" },
      palette: ["#D4AF37", "#8B4513"],
      tagline: "#AdaCharles2027",
      colors: THEMES.terracotta.colors,
    });
    expect(content.invitation).toMatch(/beautiful union/);
    expect(JSON.stringify(content)).not.toMatch(/P & O|Canary World.*Lagos|#OscarPam|May 23rd/);
  });

  it("writes out names that aren't a couple, and uses the type's wording and the theme", () => {
    const content = invitationCardContent(
      { ...wedding, type: "CORPORATE", hostNames: null, title: "Acme Annual Gala", theme: "navy" },
      guest,
    );

    expect(content.monogram).toBeUndefined();
    expect(content.names).toBe("Acme Annual Gala");
    expect(content.invitation).not.toMatch(/union|wedding/i);
    expect(content.instructions).toMatch(/We look forward to seeing you there\.$/);
    expect(content.colors.accent).toBe(THEMES.navy.colors.accent);
  });

  it("leaves out the venue, colours and tagline when the event has none", () => {
    const content = invitationCardContent(
      { ...wedding, venueName: null, venueAddress: null, colorPalette: [], tagline: null },
      { name: "  ", plusOne: 0 },
    );

    expect(content).toMatchObject({
      venue: undefined,
      palette: [],
      tagline: undefined,
      greeting: undefined,
      admits: "Admits 1",
    });
  });
});

describe("couples", () => {
  it("only gets a monogram for a wedding's two short names", () => {
    const monogram = (type: InvitationCardEvent["type"], hostNames: string) =>
      invitationCardContent({ ...wedding, type, hostNames }, guest).monogram;

    expect(monogram("WEDDING", "Pamela and Oscar")).toBe("P & O");
    expect(monogram("WEDDING", "Mary Jane & Peter Parker")).toBe("M & P");
    expect(monogram("WEDDING", "Acme Annual Gala and Long Service Awards Night")).toBeUndefined();
    expect(monogram("CORPORATE", "Tech Summit and Expo")).toBeUndefined();
    expect(monogram("BIRTHDAY", "Ada & Charles")).toBeUndefined();
  });
});
