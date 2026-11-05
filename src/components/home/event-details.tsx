import type { Event } from "@/server/repositories/event.repo";
import { formatEventDate, formatEventDateTime, formatEventTime } from "@/lib/timezones";
import ColourSwatches from "./colour-swatches";

const headingStyle = { color: "var(--event-ink)", fontFamily: "var(--event-heading-font)" };

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[22px] border-[1.5px] p-[22px]"
      style={{ borderColor: "var(--event-border)", backgroundColor: "var(--event-card)" }}
    >
      {title && <CardHeading>{title}</CardHeading>}
      {children}
    </div>
  );
}

function CardHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[26px] leading-tight font-bold break-words" style={headingStyle}>
      {children}
    </h2>
  );
}

export default function EventDetails({ event }: { event: Event }) {
  return (
    <section
      className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-8"
      style={{ color: "var(--event-text)" }}
    >
      <Card>
        <CardHeading>{formatEventDate(event.date, event.timezone)}</CardHeading>
        <p className="mt-0.5">{formatEventTime(event.date, event.timezone)}</p>
        {event.venueName && (
          <p className="mt-3.5 font-semibold break-words" style={{ color: "var(--event-ink)" }}>
            {event.venueName}
          </p>
        )}
        {event.venueAddress && (
          <p className={`whitespace-pre-line break-words ${event.venueName ? "" : "mt-3.5"}`}>
            {event.venueAddress}
          </p>
        )}
        {event.rsvpDeadline && (
          <p className="mt-3.5">
            Please RSVP by {formatEventDateTime(event.rsvpDeadline, event.timezone)}
          </p>
        )}
      </Card>

      {event.familyLines.length > 0 && (
        <Card>
          <div className="text-center">
            {event.familyLines.map((family, index) => (
              <div key={index}>
                {index > 0 && <p className="my-2 text-sm">and</p>}
                <p className="font-semibold break-words" style={{ color: "var(--event-ink)" }}>
                  {family.name}
                </p>
                {family.detail && <p className="text-sm italic break-words">{family.detail}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {event.colorPalette.length > 0 && (
        <Card title="Colours of the Day">
          <ColourSwatches colors={event.colorPalette} />
        </Card>
      )}

      {event.dressCode && (
        <Card title="Dress Code">
          <p className="mt-1.5 break-words">{event.dressCode}</p>
        </Card>
      )}

      {event.notes && (
        <Card title="Good to Know">
          <p className="mt-1.5 whitespace-pre-line break-words">{event.notes}</p>
        </Card>
      )}
    </section>
  );
}
