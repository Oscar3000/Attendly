import type { Event } from "@/server/repositories/event.repo";
import { copyFor } from "@/lib/event-copy";
import { formatEventDate } from "@/lib/timezones";

// "Pamela & Oscar" -> ["Pamela", "Oscar"], shown as two names with an ampersand between them;
// anything else (one name, three, a company) is shown as written
function splitCouple(names: string): [string, string] | undefined {
  const parts = names.split(/\s+(?:&|and)\s+/i);
  return parts.length === 2 && parts[0] && parts[1] ? [parts[0], parts[1]] : undefined;
}

export default function HeroSection({ event }: { event: Event }) {
  const names = event.hostNames ?? event.title;
  const couple = splitCouple(names);

  return (
    <section
      className="relative flex flex-col items-center justify-center px-4 pt-16 pb-20 text-center overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, var(--event-bg) 0%, var(--event-bg-alt) 55%, var(--event-bg) 100%)",
      }}
    >
      {/* Gold top border */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--event-accent), var(--event-ornament), var(--event-accent), transparent)",
        }}
      />

      {/* Monogram */}
      {couple && (
        <div
          className="mb-5 text-5xl sm:text-6xl font-bold tracking-widest select-none"
          style={{
            color: "var(--event-accent)",
            fontFamily: "var(--event-heading-font)",
            textShadow: "0 2px 6px color-mix(in srgb, var(--event-accent) 25%, transparent)",
          }}
        >
          {couple[0].charAt(0)} &amp; {couple[1].charAt(0)}
        </div>
      )}

      {/* Headline */}
      <p
        className="text-xs uppercase tracking-[0.35em] mb-6"
        style={{ color: "var(--event-muted)" }}
      >
        {event.headline ?? copyFor(event.type).headline}
      </p>

      {/* Host names */}
      {couple ? (
        <>
          <h1
            className="text-6xl sm:text-8xl font-bold mb-2 leading-tight break-words"
            style={{ color: "var(--event-ink)", fontFamily: "var(--event-heading-font)" }}
          >
            {couple[0]}
          </h1>
          <div
            className="text-3xl sm:text-4xl my-1"
            style={{ color: "var(--event-accent)", fontFamily: "var(--event-heading-font)" }}
          >
            &amp;
          </div>
          <p
            className="text-6xl sm:text-8xl font-bold mb-8 leading-tight break-words"
            style={{ color: "var(--event-ink)", fontFamily: "var(--event-heading-font)" }}
          >
            {couple[1]}
          </p>
        </>
      ) : (
        <h1
          className="text-5xl sm:text-7xl font-bold mb-8 leading-tight break-words"
          style={{ color: "var(--event-ink)", fontFamily: "var(--event-heading-font)" }}
        >
          {names}
        </h1>
      )}

      {event.tagline && (
        <p
          className="text-base sm:text-lg italic mb-8 max-w-md"
          style={{ color: "var(--event-text)" }}
        >
          {event.tagline}
        </p>
      )}

      {/* Date pill */}
      <div
        className="px-8 py-3 rounded-full text-base sm:text-lg font-semibold mb-10 tracking-wide"
        style={{ backgroundColor: "var(--event-accent)", color: "#FFFFFF" }}
      >
        {formatEventDate(event.date, event.timezone)}
      </div>

      {event.familyLines.length > 0 && (
        <>
          {/* Ornamental divider */}
          <div className="flex items-center gap-3 mb-8 w-full max-w-xs">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--event-ornament)" }} />
            <span className="text-xl" style={{ color: "var(--event-ornament)" }}>
              ❧
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--event-ornament)" }} />
          </div>

          {/* Families */}
          <div
            className="text-center text-sm sm:text-base max-w-sm leading-relaxed"
            style={{ color: "var(--event-text)" }}
          >
            {event.familyLines.map((family, index) => (
              <div key={index}>
                {index > 0 && (
                  <p className="my-3 text-sm" style={{ color: "var(--event-muted)" }}>
                    and
                  </p>
                )}
                <p className="font-semibold">{family.name}</p>
                {family.detail && (
                  <p className="italic text-xs" style={{ color: "var(--event-muted)" }}>
                    {family.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Gold bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--event-accent), var(--event-ornament), var(--event-accent), transparent)",
        }}
      />
    </section>
  );
}
