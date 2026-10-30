import { describe, expect, it } from "vitest";
import { toIcs } from "./ics";

const event = {
  uid: "inv_123@attendly",
  title: "Ada & Charles",
  start: new Date("2027-05-24T15:00:00Z"),
  end: new Date("2027-05-24T18:00:00Z"),
};
const now = new Date("2026-10-30T12:34:56.789Z");

describe("toIcs", () => {
  it("writes one event in UTC with CRLF line endings", () => {
    const ics = toIcs(event, now);

    expect(ics).toBe(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Attendly//Tickets//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        "UID:inv_123@attendly",
        "DTSTAMP:20261030T123456Z",
        "DTSTART:20270524T150000Z",
        "DTEND:20270524T180000Z",
        "SUMMARY:Ada & Charles",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
      ].join("\r\n"),
    );
  });

  it("escapes separators and newlines in text, but not in the URL", () => {
    const ics = toIcs(
      {
        ...event,
        title: "Gala; dinner, dance \\ more",
        location: "Canary World, 23 Road\nFestac Town",
        url: "https://attendly.example/e/gala/i/abc?x=1,2",
      },
      now,
    );

    expect(ics).toContain("SUMMARY:Gala\; dinner\\, dance \\\\ more\r\n");
    expect(ics).toContain("LOCATION:Canary World\\, 23 Road\\nFestac Town\r\n");
    expect(ics).toContain("URL:https://attendly.example/e/gala/i/abc?x=1,2\r\n");
  });

  it("folds lines longer than 75 bytes without splitting characters", () => {
    const description = "Àdá ".repeat(40);
    const ics = toIcs({ ...event, description }, now);

    const lines = ics.split("\r\n");
    for (const line of lines) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    // Unfolding (dropping CRLF + space) gives back the original line
    expect(ics.replace(/\r\n /g, "")).toContain(`DESCRIPTION:${description}\r\n`);
  });
});
