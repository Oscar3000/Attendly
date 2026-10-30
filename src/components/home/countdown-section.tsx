"use client";

import { useState, useEffect } from "react";

function useCountdown(startsAt: string) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(startsAt).getTime();
    const calculate = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, [startsAt]);

  return timeLeft;
}

// startsAt is an ISO string: it crosses from the server page to this client component.
// label is the event type's wording (src/lib/event-copy.ts)
export default function CountdownSection({ startsAt, label }: { startsAt: string; label: string }) {
  const countdown = useCountdown(startsAt);

  return (
    <section className="px-4 py-12 text-center" style={{ backgroundColor: "var(--event-ink)" }}>
      <p
        className="text-xs uppercase tracking-[0.35em] mb-7"
        style={{ color: "var(--event-ornament)" }}
      >
        {label}
      </p>
      <div className="flex justify-center gap-3 sm:gap-8">
        {[
          { label: "Days", value: countdown.days },
          { label: "Hours", value: countdown.hours },
          { label: "Mins", value: countdown.minutes },
          { label: "Secs", value: countdown.seconds },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold mb-2 leading-none"
              style={{
                backgroundColor: "var(--event-accent)",
                color: "#FFFFFF",
                fontFamily: "var(--event-heading-font)",
                fontVariantNumeric: "lining-nums tabular-nums",
                boxShadow: "0 4px 14px color-mix(in srgb, var(--event-accent) 40%, transparent)",
              }}
            >
              {String(value).padStart(2, "0")}
            </div>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--event-muted)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
