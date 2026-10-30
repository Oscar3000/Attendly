import type { Event } from "@/server/repositories/event.repo";

export default function HomeFooter({ event }: { event: Event }) {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: event.timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(event.date);

  return (
    <footer className="py-8 text-center px-4" style={{ backgroundColor: "var(--event-ink)" }}>
      <p
        className="text-sm font-medium mb-1"
        style={{ color: "var(--event-ornament)", fontFamily: "var(--event-heading-font)" }}
      >
        {event.hostNames ?? event.title} · {date}
      </p>
      <p className="text-xs" style={{ color: "var(--event-text)" }}>
        Powered by Attendly
      </p>
    </footer>
  );
}
