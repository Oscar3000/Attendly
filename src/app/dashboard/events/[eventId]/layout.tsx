import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { eventRepo } from "@/server/repositories/event.repo";
import { EventCardProvider } from "@/components/admin/event-card-context";
import { EventHeader } from "@/components/admin/event-header";
import { HideOnScanner } from "@/components/admin/hide-on-scanner";
import { EVENT_TYPE_LABELS } from "@/lib/event-copy";
import { daysUntil, formatEventDateTime } from "@/lib/timezones";

/**
 * Server-side gate for every page of one event's dashboard (middleware only checks a session
 * cookie exists). Owning the event is the permission: signed out -> /login, and a missing event
 * or someone else's event -> 404, so event ids can't be probed
 */
export default async function EventDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const event = await eventRepo.findById((await params).eventId);
  if (!event || event.ownerId !== user.id) notFound();

  const details = [
    EVENT_TYPE_LABELS[event.type],
    formatEventDateTime(event.date, event.timezone),
    event.venueName ?? event.venueAddress,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <HideOnScanner>
        <EventHeader
          eventId={event.id}
          slug={event.slug}
          title={event.title}
          details={details}
          countdown={countdownLabel(daysUntil(event.date, event.timezone))}
        />
      </HideOnScanner>
      <EventCardProvider
        event={{
          type: event.type,
          title: event.title,
          hostNames: event.hostNames,
          date: event.date.toISOString(),
          timezone: event.timezone,
          venueName: event.venueName,
          venueAddress: event.venueAddress,
          tagline: event.tagline,
          colorPalette: event.colorPalette,
          theme: event.theme,
        }}
      >
        {children}
      </EventCardProvider>
    </>
  );
}

// "200 days to go", "Today", "3 days ago"
function countdownLabel(days: number): string {
  if (days === 0) return "Today";
  const count = `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"}`;
  return days > 0 ? `${count} to go` : `${count} ago`;
}
