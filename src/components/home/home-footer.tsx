import type { Event } from "@/server/repositories/event.repo";

export default function HomeFooter({ event }: { event: Event }) {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: event.timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(event.date);

  return (
    <footer className="py-8 text-center px-4" style={{ backgroundColor: "#2C1810" }}>
      <p
        className="text-sm font-medium mb-1"
        style={{ color: "#D4AF37", fontFamily: "Georgia, serif" }}
      >
        {event.hostNames ?? event.title} · {date}
      </p>
      <p className="text-xs" style={{ color: "#6B4A3A" }}>
        Powered by Attendly
      </p>
    </footer>
  );
}
