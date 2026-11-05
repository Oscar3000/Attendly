import type { Event } from "@/server/repositories/event.repo";
import { copyFor } from "@/lib/event-copy";
import { splitCouple } from "@/lib/event-content";
import { formatEventDate } from "@/lib/timezones";
import { cn } from "@/lib/utils";

/**
 * The top of the event page. The words sit on solid ink below the photo, not on it, so they stay
 * readable whatever the host uploads
 */
export default function HeroSection({ event }: { event: Event }) {
  const names = event.hostNames ?? event.title;
  const couple = splitCouple(event.type, names);
  const nameStyle = { fontFamily: "var(--event-heading-font)" };
  // Small enough for the longest word to fit on a line, so a long name doesn't break mid-word
  const longestWord = Math.max(...names.split(/[\s-]+/).map((word) => word.length));
  const fontSize = couple ? "clamp(3.5rem,17vw,6.5rem)" : "clamp(2.75rem,12vw,5rem)";

  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "var(--event-ink)", color: "var(--event-bg)" }}
    >
      {event.coverImageUrl ? (
        <div className="relative h-[50svh] min-h-72">
          {/* Decorative: the words below say what the event is */}
          {/* eslint-disable-next-line @next/next/no-img-element -- already resized server-side */}
          <img src={event.coverImageUrl} alt="" className="block h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, var(--event-ink), transparent 60%)" }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 80% 0%, var(--event-accent), transparent 65%)",
          }}
        />
      )}

      <div
        className={cn(
          "relative mx-auto flex max-w-2xl flex-col justify-end px-6 pb-9",
          event.coverImageUrl ? "-mt-6" : "min-h-[56svh] pt-16",
        )}
      >
        {couple && (
          <p
            aria-hidden="true"
            className="mb-5 animate-rise text-3xl font-bold tracking-widest select-none"
            style={{ ...nameStyle, color: "var(--event-ornament)" }}
          >
            {couple[0].charAt(0)} &amp; {couple[1].charAt(0)}
          </p>
        )}

        <p className="animate-rise text-sm [animation-delay:50ms]">
          {event.headline ?? copyFor(event.type).headline}
        </p>

        <h1
          className="mt-2.5 animate-rise leading-[0.98] font-bold [overflow-wrap:anywhere] [animation-delay:150ms]"
          style={{
            ...nameStyle,
            fontSize: `min(${fontSize}, calc(min(100vw - 3rem, 39rem) / ${longestWord * 0.7}))`,
          }}
        >
          {couple ? (
            <>
              <span className="block">{couple[0]}</span>
              <span className="block">
                <span style={{ color: "var(--event-ornament)" }}>&amp;</span>{" "}
                <span>{couple[1]}</span>
              </span>
            </>
          ) : (
            names
          )}
        </h1>

        {event.tagline && (
          <p className="mt-3.5 animate-rise break-words [animation-delay:250ms]">{event.tagline}</p>
        )}

        <p className="mt-3.5 animate-rise font-semibold [animation-delay:250ms]">
          {formatEventDate(event.date, event.timezone)}
        </p>
      </div>
    </section>
  );
}
