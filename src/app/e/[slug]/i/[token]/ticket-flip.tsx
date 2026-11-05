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
  const side = "backface-hidden [grid-area:1/1]";

  return (
    <>
      <div className="my-auto perspective-[1400px]">
        <div
          className={cn(
            "grid transition-transform duration-600 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform-3d",
            flipped && "rotate-y-180",
          )}
        >
          <div className={side} inert={flipped}>
            {front}
          </div>
          <div className={cn(side, "rotate-y-180")} inert={!flipped}>
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
