/**
 * Calendar files (iCalendar, RFC 5545) for "Add to calendar" on a guest's ticket (T-510).
 * One event, times in UTC, which every calendar app converts to the viewer's zone
 */

export interface CalendarEvent {
  // Stable per invitation, so downloading again updates the entry instead of adding another
  uid: string;
  title: string;
  start: Date;
  end: Date;
  location?: string | undefined;
  description?: string | undefined;
  url?: string | undefined;
}

// 2027-05-24T15:00:00.000Z -> 20270524T150000Z
const utc = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

// Commas, semicolons and backslashes are separators in iCalendar text; newlines are written \n
const text = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// Lines may be at most 75 bytes; longer ones continue on the next line after a space. Splits
// between characters, never inside a multi-byte one
function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    // Continuation lines start with a space, which counts towards their 75
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function toIcs(event: CalendarEvent, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Attendly//Tickets//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${utc(now)}`,
    `DTSTART:${utc(event.start)}`,
    `DTEND:${utc(event.end)}`,
    `SUMMARY:${text(event.title)}`,
    ...(event.location ? [`LOCATION:${text(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${text(event.description)}`] : []),
    // A URI, not text: no escaping
    ...(event.url ? [`URL:${event.url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
