"use client";

import { useSyncExternalStore } from "react";
import { countdownAt } from "@/lib/countdown";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

const currentSecond = () => Math.floor(Date.now() / 1000) * 1000;

interface CountdownSectionProps {
  // ISO string and epoch ms: they cross from the server page to this client component.
  startsAt: string;
  timezone: string;
  // When the server rendered the page, so the first paint already shows the real time left
  renderedAt: number;
  // The event type's wording (src/lib/event-copy.ts)
  label: string;
  todayLabel: string;
}

/**
 * Ticks down to the start, says so on the day, and goes away once the day has passed
 */
export default function CountdownSection({
  startsAt,
  timezone,
  renderedAt,
  label,
  todayLabel,
}: CountdownSectionProps) {
  const now = useSyncExternalStore(subscribe, currentSecond, () => renderedAt);
  const countdown = countdownAt(new Date(startsAt), timezone, new Date(now));
  if (countdown.state === "over") return null;

  return (
    <section
      className="px-6 py-8"
      style={{ backgroundColor: "var(--event-bg-alt)", color: "var(--event-text)" }}
    >
      <div className="mx-auto max-w-2xl text-center">
        {countdown.state === "today" ? (
          <p
            className="text-[26px] leading-tight font-bold"
            style={{ color: "var(--event-ink)", fontFamily: "var(--event-heading-font)" }}
          >
            {todayLabel}
          </p>
        ) : (
          <>
            <p className="text-sm">{label}</p>
            <div role="timer" className="mt-3.5 grid grid-cols-4 gap-2">
              {[
                { unit: "Days", value: countdown.days },
                { unit: "Hours", value: countdown.hours },
                { unit: "Mins", value: countdown.minutes },
                { unit: "Secs", value: countdown.seconds },
              ].map(({ unit, value }) => (
                <div
                  key={unit}
                  className="rounded-2xl py-3.5"
                  style={{ backgroundColor: "var(--event-ink)", color: "var(--event-bg)" }}
                >
                  <p className="text-[30px] leading-none font-bold tabular-nums">
                    {String(value).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-xs">{unit}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
