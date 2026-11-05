import { eventFontVariables } from "@/app/e/[slug]/fonts";
import { copyFor } from "@/lib/event-copy";
import { themeStyle, type ThemeId } from "@/lib/themes";
import { daysUntil, formatEventDateShort, zonedTimeToUtc } from "@/lib/timezones";

interface EventPreviewProps {
  type: string;
  title: string;
  // A datetime-local value, or blank until the host picks one
  date: string;
  timezone: string;
  venueName: string;
  theme: ThemeId;
}

/**
 * A phone showing the event page as it stands, in the real theme. Decoration: everything in it
 * is already in the form, so it's hidden from screen readers
 */
export function EventPreview({ type, title, date, timezone, venueName, theme }: EventPreviewProps) {
  const start = date && timezone ? zonedTimeToUtc(date, timezone) : undefined;
  const days = start && Math.max(0, daysUntil(start, timezone));

  return (
    <aside
      aria-hidden="true"
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 bg-ink px-6 py-10"
    >
      <p className="font-mono text-[13px] text-mist">What your guests will see</p>
      <div
        className={`${eventFontVariables} flex h-[600px] w-[300px] flex-col items-center justify-center gap-4 overflow-hidden rounded-[36px] border-8 border-[#2E2A3A] p-7 text-center transition-colors duration-300`}
        style={{ ...themeStyle(theme), color: "var(--event-ink)" }}
      >
        <p className="text-[13px]" style={{ color: "var(--event-text)" }}>
          {copyFor(type).headline}
        </p>
        <p
          className="text-[44px] leading-[1.05] font-bold wrap-anywhere"
          style={{ fontFamily: "var(--event-heading-font)" }}
        >
          {title.trim() || "Your event"}
        </p>
        {start && (
          <span
            className="rounded-full px-5.5 py-2.5 text-[15px] font-semibold text-white"
            style={{ backgroundColor: "var(--event-accent)" }}
          >
            {formatEventDateShort(start, timezone)}
          </span>
        )}
        {venueName.trim() && <p className="text-[15px] font-semibold">{venueName.trim()}</p>}
        {days !== undefined && (
          <p
            className="mt-2 w-full rounded-xl py-2.5 font-bold"
            style={{ backgroundColor: "var(--event-ink)", color: "var(--event-bg)" }}
          >
            {days} {days === 1 ? "day" : "days"} to go
          </p>
        )}
      </div>
    </aside>
  );
}
