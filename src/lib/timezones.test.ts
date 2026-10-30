import { describe, expect, it } from "vitest";
import { formatEventDateTime, isValidTimeZone, utcToZonedLocal, zonedTimeToUtc } from "./timezones";

describe("zonedTimeToUtc", () => {
  it("converts a wall time in a fixed-offset zone", () => {
    // Lagos is UTC+1 all year
    expect(zonedTimeToUtc("2026-05-23T15:00", "Africa/Lagos").toISOString()).toBe(
      "2026-05-23T14:00:00.000Z",
    );
  });

  it("uses the offset in force on that date, not today's", () => {
    expect(zonedTimeToUtc("2026-07-01T12:00", "Europe/London").toISOString()).toBe(
      "2026-07-01T11:00:00.000Z", // BST, UTC+1
    );
    expect(zonedTimeToUtc("2026-12-01T12:00", "Europe/London").toISOString()).toBe(
      "2026-12-01T12:00:00.000Z", // GMT
    );
    expect(zonedTimeToUtc("2026-12-01T12:00", "America/New_York").toISOString()).toBe(
      "2026-12-01T17:00:00.000Z",
    );
  });

  it("handles times right after a daylight-saving change", () => {
    // New York springs forward at 2:00 on 2026-03-08: 3:30 is EDT (UTC-4)
    expect(zonedTimeToUtc("2026-03-08T03:30", "America/New_York").toISOString()).toBe(
      "2026-03-08T07:30:00.000Z",
    );
    // and falls back on 2026-11-01: 12:30 that afternoon is EST (UTC-5)
    expect(zonedTimeToUtc("2026-11-01T12:30", "America/New_York").toISOString()).toBe(
      "2026-11-01T17:30:00.000Z",
    );
  });

  it("handles zones ahead of UTC across midnight", () => {
    expect(zonedTimeToUtc("2026-01-01T00:30", "Asia/Tokyo").toISOString()).toBe(
      "2025-12-31T15:30:00.000Z",
    );
  });

  it("rejects anything that isn't a datetime-local value", () => {
    expect(() => zonedTimeToUtc("23/05/2026 15:00", "Africa/Lagos")).toThrow(/YYYY-MM-DD/);
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA zones and rejects anything else", () => {
    expect(isValidTimeZone("Africa/Lagos")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});

describe("formatEventDateTime", () => {
  it("shows the time on the event's wall clock", () => {
    const start = new Date("2026-05-23T14:00:00Z");
    expect(formatEventDateTime(start, "Africa/Lagos")).toBe("Saturday, May 23, 2026 at 3:00 PM");
    expect(formatEventDateTime(start, "Asia/Tokyo")).toBe("Saturday, May 23, 2026 at 11:00 PM");
  });
});

describe("utcToZonedLocal", () => {
  it("shows a UTC instant on the zone's wall clock", () => {
    expect(utcToZonedLocal(new Date("2026-05-23T14:00:00Z"), "Africa/Lagos")).toBe(
      "2026-05-23T15:00",
    );
    expect(utcToZonedLocal(new Date("2026-07-01T23:30:00Z"), "Europe/London")).toBe(
      "2026-07-02T00:30",
    );
    expect(utcToZonedLocal(new Date("2026-12-01T17:05:00Z"), "America/New_York")).toBe(
      "2026-12-01T12:05",
    );
  });

  it("round-trips with zonedTimeToUtc", () => {
    for (const local of ["2026-03-08T03:30", "2026-11-01T12:30", "2026-06-15T00:00"]) {
      expect(utcToZonedLocal(zonedTimeToUtc(local, "America/New_York"), "America/New_York")).toBe(
        local,
      );
    }
  });
});
