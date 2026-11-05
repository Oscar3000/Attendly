"use client";

import { useEffect, useState } from "react";
import { THEMES, THEME_IDS } from "@/lib/themes";
import { cn } from "@/lib/utils";
import { SampleQr } from "./sample-qr";

const STEPS = [
  { title: "Create your event", body: "Add the date, venue and the details guests need." },
  { title: "Add your guests", body: "One at a time or a whole list at once, with plus-ones." },
  { title: "Send invitations", body: "Share each guest's invitation and QR code." },
  { title: "Track replies", body: "Watch confirmations come in on your dashboard." },
];

const SAMPLE_GUESTS = [
  ["Zelda Okafor", "Admits 2"],
  ["Tunde Bello", "Admits 1"],
  ["Ifeoma Nwosu", "Admits 3"],
  ["Ben Carter", "Admits 2"],
];

/**
 * The four steps, each with a small picture of that part of the product
 */
export function HowItWorks() {
  const [step, setStep] = useState(0);

  return (
    <section id="how-it-works" className="scroll-mt-4 px-6 pb-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 rounded-[32px] border-[1.5px] border-line bg-card p-[clamp(1.5rem,4vw,3.5rem)] lg:grid-cols-2">
        <div>
          <h2 className="mb-6 font-display text-[clamp(2.25rem,4vw,3.25rem)] leading-[1.02] font-extrabold tracking-tight">
            How it works
          </h2>
          <ol className="flex flex-col gap-2">
            {STEPS.map(({ title, body }, i) => (
              <li key={title}>
                <button
                  type="button"
                  aria-pressed={step === i}
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full gap-4 rounded-[18px] px-4.5 py-4 text-left transition-colors",
                    step === i ? "bg-ink text-paper" : "text-ink hover:bg-paper",
                  )}
                >
                  <span className="pt-0.5 font-mono text-sm">0{i + 1}</span>
                  <span>
                    <span className="block text-[19px] font-semibold">{title}</span>
                    <span
                      className={cn("block text-[15px]", step === i ? "text-mist" : "text-slate")}
                    >
                      {body}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex min-h-[380px] flex-col justify-center rounded-3xl bg-ink p-7 text-paper">
          <div key={step} className="animate-pop">
            {step === 0 && <CreateStep />}
            {step === 1 && <GuestsStep />}
            {step === 2 && <SendStep />}
            {step === 3 && <RepliesStep />}
          </div>
        </div>
      </div>
    </section>
  );
}

function CreateStep() {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[13px] text-mist">New event</p>
      <p className="font-display text-[40px] leading-tight font-extrabold">Amara &amp; Chike</p>
      <p className="text-mist">
        May 24, 2027, 4:00 PM
        <br />
        The Glasshouse, 12 Garden Row
      </p>
      <div className="mt-2 flex gap-2">
        {THEME_IDS.map((id, i) => (
          <span
            key={id}
            className={cn(
              "size-9 rounded-full",
              i === 0 && "ring-2 ring-paper ring-offset-2 ring-offset-ink",
            )}
            style={{ backgroundColor: THEMES[id].colors.accent }}
          />
        ))}
      </div>
    </div>
  );
}

function GuestsStep() {
  return (
    <div className="flex flex-col gap-2">
      <p className="mb-1 font-mono text-[13px] text-mist">Guest list</p>
      {SAMPLE_GUESTS.map(([name, party]) => (
        <div
          key={name}
          className="flex items-center justify-between gap-3 rounded-[14px] bg-graphite px-4 py-3"
        >
          <span className="font-semibold">{name}</span>
          <span className="font-mono text-[13px] text-mist">{party}</span>
        </div>
      ))}
    </div>
  );
}

function SendStep() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="rounded-2xl bg-white p-3 leading-none">
        <SampleQr seed={3} size={150} />
      </div>
      <ul className="flex flex-[1_1_160px] flex-col gap-2 font-semibold">
        {["Copy link", "Share to WhatsApp", "Download image"].map((action) => (
          <li key={action} className="rounded-[14px] bg-graphite px-4 py-3">
            {action}
          </li>
        ))}
      </ul>
    </div>
  );
}

const SAMPLE_INVITED = 12;
const SAMPLE_REPLIES_FROM = 7;

function RepliesStep() {
  const [replies, setReplies] = useState(SAMPLE_REPLIES_FROM);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(
      () => setReplies((n) => (n >= SAMPLE_INVITED ? SAMPLE_REPLIES_FROM : n + 1)),
      1400,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <p className="font-mono text-[13px] text-mist">Replies</p>
      <p className="mt-2 font-display text-[76px] leading-none font-extrabold tracking-tight">
        {replies}
        <span className="text-[28px] text-mist"> of {SAMPLE_INVITED}</span>
      </p>
      <div className="mt-5 h-3.5 overflow-hidden rounded-full bg-graphite">
        <div
          className="h-full rounded-full bg-lime transition-[width] duration-500"
          style={{ width: `${(replies / SAMPLE_INVITED) * 100}%` }}
        />
      </div>
      <p className="mt-4 text-mist">Sample data. Yours update as guests answer.</p>
    </div>
  );
}
