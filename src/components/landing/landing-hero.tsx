"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { TicketCard } from "@/components/ui/ticket-card";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { SampleQr } from "./sample-qr";

// Made-up events; the ticket shows how the wording and theme follow the kind of event
const SAMPLES = {
  wedding: {
    label: "Wedding",
    kind: "Wedding celebration",
    title: "Amara & Chike",
    color: THEMES.terracotta.colors.accent,
    date: "May 24, 2027",
    time: "4:00 PM",
    venue: "The Glasshouse",
    seed: 3,
  },
  birthday: {
    label: "Birthday",
    kind: "Birthday celebration",
    title: "Zelda turns 30",
    color: THEMES.blush.colors.accent,
    date: "Aug 7, 2027",
    time: "7:30 PM",
    venue: "Rooftop 9",
    seed: 5,
  },
  corporate: {
    label: "Company event",
    kind: "Event invitation",
    title: "Northlight Summit",
    color: THEMES.navy.colors.accent,
    date: "Oct 12, 2027",
    time: "9:00 AM",
    venue: "Harbour Hall",
    seed: 7,
  },
} as const;

type SampleId = keyof typeof SAMPLES;

/**
 * Landing page header and hero: what Attendly is, the main call to action, and a sample ticket
 * to play with. Signed-in hosts get a link to their events instead of log in / sign up
 */
export function LandingHero({ signedIn }: { signedIn: boolean }) {
  const [sample, setSample] = useState<SampleId>("wedding");

  return (
    <section className="bg-ink px-6 pb-24 text-paper">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 py-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-display text-[26px] font-extrabold tracking-tight"
        >
          attendly
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2 text-[15px] font-medium">
          <a href="#how-it-works" className="hidden min-h-11 items-center px-3.5 sm:inline-flex">
            How it works
          </a>
          {signedIn ? (
            <Link href="/dashboard" className={buttonClasses({ variant: "light", size: "sm" })}>
              Your events
            </Link>
          ) : (
            <>
              <Link href="/login" className="inline-flex min-h-11 items-center px-3.5">
                Log in
              </Link>
              <Link href="/signup" className={buttonClasses({ variant: "light", size: "sm" })}>
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1200px] items-center gap-14 pt-14 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-[clamp(3rem,7vw,5.75rem)] leading-[0.98] font-extrabold tracking-tight text-balance">
            From first invite to last guest through the door.
          </h1>
          <p className="mt-7 max-w-[520px] text-[19px] leading-relaxed text-mist">
            Give your event its own page, send every guest a personal ticket with a QR code, and
            check them in from your phone.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href={signedIn ? "/dashboard" : "/signup"}
              className={buttonClasses({ size: "lg" })}
            >
              {signedIn ? "Go to your events" : "Create your event"}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex min-h-14 items-center px-2 font-medium underline"
            >
              See how it works
            </a>
          </div>

          <div className="mt-14">
            <p className="mb-3 font-mono text-[13px] text-mist">Try it: what are you hosting?</p>
            <div role="group" aria-label="Kind of event" className="flex flex-wrap gap-2">
              {(Object.keys(SAMPLES) as SampleId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={sample === id}
                  onClick={() => setSample(id)}
                  className={cn(
                    "min-h-11 rounded-full border-[1.5px] px-4.5 text-[15px] font-semibold transition-transform hover:-translate-y-0.5",
                    sample === id ? "border-paper bg-paper text-ink" : "border-slate text-paper",
                  )}
                >
                  {SAMPLES[id].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SampleTicket id={sample} />
      </div>
    </section>
  );
}

// The ticket leans towards the pointer. Only with a mouse, and not under reduced motion
const CAN_TILT = "(pointer: fine) and (prefers-reduced-motion: no-preference)";

function SampleTicket({ id }: { id: SampleId }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const sample = SAMPLES[id];

  const lean = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia(CAN_TILT).matches) return;
    const box = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: -((e.clientY - box.top) / box.height - 0.5) * 12,
      y: ((e.clientX - box.left) / box.width - 0.5) * 16,
    });
  };

  return (
    <div
      aria-hidden="true"
      onPointerMove={lean}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="flex justify-center py-3 [perspective:1100px]"
    >
      <div
        className="w-full max-w-[400px] transition-transform duration-150 ease-out"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotate(-2deg)` }}
      >
        <TicketCard
          notchColor="var(--color-ink)"
          className="rounded-[28px] text-ink shadow-[0_40px_80px_rgba(0,0,0,0.45)]"
          stub={
            <div className="flex items-center gap-5 px-7 py-6">
              <SampleQr seed={sample.seed} size={112} />
              <p className="text-[15px] leading-snug text-slate">
                Show this at the entrance. It&apos;s only for the people on this invitation.
              </p>
            </div>
          }
        >
          <div
            className="px-7 pt-7 pb-6 text-white transition-colors duration-300"
            style={{ backgroundColor: sample.color }}
          >
            <p className="font-mono text-[13px]">{sample.kind}</p>
            <p className="mt-2.5 font-display text-[42px] leading-[1.02] font-extrabold tracking-tight">
              {sample.title}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3.5 px-7 py-5.5">
            {[
              ["Date", sample.date],
              ["Time", sample.time],
              ["Venue", sample.venue],
              ["Guest", "Zelda, admits 2"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-mono text-xs text-slate">{label}</dt>
                <dd className="mt-0.5 text-[15px] font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </TicketCard>
      </div>
    </div>
  );
}
