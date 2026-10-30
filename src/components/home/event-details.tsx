import type { Event } from "@/server/repositories/event.repo";
import { formatEventDate, formatEventDateTime, formatEventTime } from "@/lib/timezones";

const cardClass = "rounded-2xl p-6 border";
const cardStyle = { borderColor: "#E8D5C4", backgroundColor: "#FFFCF9" };
const headingStyle = { color: "#2C1810", fontFamily: "Georgia, serif" };
const labelClass = "text-xs uppercase tracking-[0.35em] mb-4";

// "Gold, Brown & Orange"
function listNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names.at(-1)}` : names.join("");
}

export default function EventDetails({ event }: { event: Event }) {
  const hasVenue = Boolean(event.venueName || event.venueAddress);
  const hasDressCode = Boolean(event.dressCode) || event.colorPalette.length > 0;

  return (
    <section className="px-4 py-14 max-w-2xl mx-auto">
      <p className={`text-center ${labelClass} mb-8`} style={{ color: "#9A7B6B" }}>
        Event Details
      </p>

      <div className={`grid gap-4 ${hasVenue ? "sm:grid-cols-2" : ""}`}>
        <div className={cardClass} style={cardStyle}>
          <div className="text-3xl mb-3">🗓️</div>
          <h3 className="font-bold text-lg mb-1" style={headingStyle}>
            {formatEventDate(event.date, event.timezone)}
          </h3>
          <p className="text-sm font-bold mb-4 tracking-wide" style={{ color: "#C07A54" }}>
            {formatEventTime(event.date, event.timezone)}
          </p>
          {event.rsvpDeadline && (
            <p className="text-sm leading-6" style={{ color: "#6B4A3A" }}>
              Please RSVP by {formatEventDateTime(event.rsvpDeadline, event.timezone)}
            </p>
          )}
        </div>

        {hasVenue && (
          <div className={cardClass} style={cardStyle}>
            <div className="text-3xl mb-3">📍</div>
            {event.venueName && (
              <h3 className="font-bold text-lg mb-3" style={headingStyle}>
                {event.venueName}
              </h3>
            )}
            {event.venueAddress && (
              <p className="text-sm leading-6 whitespace-pre-line" style={{ color: "#6B4A3A" }}>
                {event.venueAddress}
              </p>
            )}
          </div>
        )}
      </div>

      {hasDressCode && (
        <div className={`mt-5 ${cardClass} p-5 text-center`} style={cardStyle}>
          <p className={labelClass} style={{ color: "#9A7B6B" }}>
            {event.colorPalette.length > 0 ? "Colours of the Day" : "Dress Code"}
          </p>
          {event.colorPalette.length > 0 && (
            <>
              <div className="flex flex-wrap justify-center gap-4 mb-3">
                {event.colorPalette.map(({ hex, name }, index) => (
                  <div key={index} className="flex flex-col items-center gap-1">
                    <div
                      className="w-9 h-9 rounded-full shadow-md border-2 border-white"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="text-xs" style={{ color: "#9A7B6B" }}>
                      {name}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-sm font-semibold" style={{ color: "#2C1810" }}>
                {listNames(event.colorPalette.map(({ name }) => name))}
              </p>
            </>
          )}
          {event.dressCode && (
            <p
              className={`text-sm ${event.colorPalette.length > 0 ? "mt-3" : "font-semibold"}`}
              style={{ color: event.colorPalette.length > 0 ? "#6B4A3A" : "#2C1810" }}
            >
              {event.dressCode}
            </p>
          )}
        </div>
      )}

      {event.notes && (
        <div className={`mt-5 ${cardClass}`} style={cardStyle}>
          <p className={labelClass} style={{ color: "#9A7B6B" }}>
            Good to Know
          </p>
          <p className="text-sm leading-6 whitespace-pre-line" style={{ color: "#6B4A3A" }}>
            {event.notes}
          </p>
        </div>
      )}
    </section>
  );
}
