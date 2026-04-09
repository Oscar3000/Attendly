"use client";

import { useState, useEffect } from "react";

const WEDDING_DATE = new Date("2026-05-23T10:00:00+01:00");

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculate = () => {
      const diff = targetDate.getTime() - Date.now();
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
  }, [targetDate]);

  return timeLeft;
}

export default function CountdownSection() {
  const countdown = useCountdown(WEDDING_DATE);

  return (
    <section
      className="px-4 py-12 text-center"
      style={{ backgroundColor: "#2C1810" }}
    >
      <p
        className="text-xs uppercase tracking-[0.35em] mb-7"
        style={{ color: "#D4AF37" }}
      >
        Counting Down to the Big Day
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
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold mb-2"
              style={{
                backgroundColor: "#C07A54",
                color: "#FFFFFF",
                fontFamily: "Georgia, serif",
                boxShadow: "0 4px 14px rgba(192,122,84,0.4)",
              }}
            >
              {String(value).padStart(2, "0")}
            </div>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: "#9A7B6B" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
