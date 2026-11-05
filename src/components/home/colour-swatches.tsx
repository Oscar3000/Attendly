"use client";

import { useState } from "react";
import type { PaletteColor } from "@/lib/event-content";

// "Gold, Brown & Orange"
function listNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names.at(-1)}` : names.join("");
}

/**
 * The colours of the day. All their names show until one is tapped; then just that one's
 */
export default function ColourSwatches({ colors }: { colors: PaletteColor[] }) {
  const [picked, setPicked] = useState<number>();

  return (
    <>
      <div className="mt-3.5 flex flex-wrap gap-3">
        {colors.map(({ hex, name }, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setPicked(picked === index ? undefined : index)}
            aria-label={name}
            aria-pressed={picked === index}
            className="size-13 rounded-full transition-transform hover:scale-108"
            style={{
              backgroundColor: hex,
              // The inner line keeps a pale colour visible against the card
              boxShadow:
                picked === index
                  ? "0 0 0 2px var(--event-card), 0 0 0 4px var(--event-ink)"
                  : "0 0 0 1.5px var(--event-border)",
            }}
          />
        ))}
      </div>
      <p className="mt-3 font-semibold" style={{ color: "var(--event-ink)" }} aria-live="polite">
        {picked === undefined ? listNames(colors.map(({ name }) => name)) : colors[picked]?.name}
      </p>
    </>
  );
}
