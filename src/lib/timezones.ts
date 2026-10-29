/**
 * Time zone helpers on the built-in Intl API (no date library)
 * Events store their start in UTC plus an IANA zone; hosts enter and read wall-clock times
 */

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

// Every IANA zone the runtime knows, for the time zone picker
export function listTimeZones(): string[] {
  return Intl.supportedValuesOf("timeZone");
}

// Milliseconds the zone's wall clock is ahead of UTC at a given instant
function offsetAt(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const wallAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return wallAsUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * "2026-05-23T15:00" (a datetime-local value) on the wall clock in `timeZone` -> UTC Date
 * The second pass corrects for a daylight-saving change between the guess and the answer.
 * A wall time skipped by a spring-forward change resolves to the instant just after it
 */
export function zonedTimeToUtc(local: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) throw new Error(`Expected YYYY-MM-DDTHH:mm, got "${local}"`);
  const [, year, month, day, hour, minute] = match.map(Number) as number[];
  const wall = Date.UTC(year!, month! - 1, day!, hour!, minute!);

  let utc = wall - offsetAt(wall, timeZone);
  utc = wall - offsetAt(utc, timeZone);
  return new Date(utc);
}

// "Saturday, May 23, 2026 at 3:00 PM", read on the event's own wall clock
export function formatEventDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
