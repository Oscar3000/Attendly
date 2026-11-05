import type { Event } from "@/server/repositories/event.repo";

export default function HomeFooter({ event }: { event: Event }) {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: event.timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(event.date);

  return (
    <footer>
      <div className="px-6 pt-4 pb-10 text-center" style={{ color: "var(--event-text)" }}>
        <h2
          className="text-[26px] leading-tight font-bold"
          style={{ color: "var(--event-ink)", fontFamily: "var(--event-heading-font)" }}
        >
          Have your ticket?
        </h2>
        <p className="mt-1.5">Your personal link from the hosts has your QR code.</p>
      </div>
      <div
        className="px-6 py-8 text-center"
        style={{ backgroundColor: "var(--event-ink)", color: "var(--event-bg)" }}
      >
        <p
          className="mb-1 text-sm font-medium break-words"
          style={{ color: "var(--event-ornament)", fontFamily: "var(--event-heading-font)" }}
        >
          {event.hostNames ?? event.title} · {date}
        </p>
        <p className="text-[13px]">Powered by Attendly</p>
      </div>
    </footer>
  );
}
