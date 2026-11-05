"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TicketFlipProps {
  front: React.ReactNode;
  back: React.ReactNode;
  // The button on the front, naming what's on the back
  backLabel: string;
}

/**
 * The two sides of a guest's ticket. They share a grid cell, so the card is as tall as its taller
 * side. Under reduced motion the global rule cuts the transition, so the sides just swap
 */
export function TicketFlip({ front, back, backLabel }: TicketFlipProps) {
  const [flipped, setFlipped] = useState(false);
  // WebKit can leave the far side showing, mirrored, over the QR code, so it's hidden outright too.
  // The swap waits for the card to be edge-on, about 100ms into the flip
  const side =
    "backface-hidden transition-[visibility] delay-100 duration-0 [grid-area:1/1] motion-reduce:delay-0";

  return (
    <>
      <div className="my-auto perspective-[1400px]">
        <div
          className={cn(
            "grid grid-cols-[minmax(0,1fr)] transition-transform duration-600 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform-3d",
            flipped && "rotate-y-180",
          )}
        >
          <div className={cn(side, flipped && "invisible")} inert={flipped}>
            {front}
          </div>
          <div className={cn(side, "rotate-y-180", !flipped && "invisible")} inert={!flipped}>
            {back}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="min-h-13 rounded-full border-[1.5px] px-6 font-semibold"
        style={{ borderColor: "var(--event-bg)", color: "var(--event-bg)" }}
      >
        {flipped ? "Back to my ticket" : backLabel}
      </button>
    </>
  );
}
