import { daysUntil } from "./timezones";

export type Countdown =
  | { state: "counting"; days: number; hours: number; minutes: number; seconds: number }
  // It has started, and it's still the event's day on its own calendar
  | { state: "today" }
  | { state: "over" };

// What the event page's countdown shows at a moment
export function countdownAt(startsAt: Date, timezone: string, now: Date): Countdown {
  const left = Math.ceil((startsAt.getTime() - now.getTime()) / 1000);
  if (left <= 0) return { state: daysUntil(startsAt, timezone, now) === 0 ? "today" : "over" };
  return {
    state: "counting",
    days: Math.floor(left / 86400),
    hours: Math.floor(left / 3600) % 24,
    minutes: Math.floor(left / 60) % 60,
    seconds: left % 60,
  };
}
