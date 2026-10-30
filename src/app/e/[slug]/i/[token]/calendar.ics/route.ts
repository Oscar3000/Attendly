/**
 * "Add to calendar" for a guest's ticket (T-510)
 * GET /e/[slug]/i/[token]/calendar.ics - The event as an iCalendar file, with the ticket's link,
 *     so the guest can find their QR code from the calendar entry. 404 like the ticket page,
 *     and for a declined or cancelled invitation
 */
import { NextResponse } from "next/server";
import { eventDisplayName, getGuestTicket } from "@/server/events/public-event";
import { copyFor } from "@/lib/event-copy";
import { toIcs } from "@/lib/ics";
import { absoluteUrl, ticketPath } from "@/lib/utils";

// Events have a start time but no end time yet; calendars need one
const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

interface RouteParams {
  params: Promise<{ slug: string; token: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug, token } = await params;
  const ticket = await getGuestTicket(slug, token);
  if (
    !ticket ||
    ticket.invitation.status === "declined" ||
    ticket.invitation.status === "rescinded"
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { event, invitation } = ticket;
  const url = absoluteUrl(ticketPath(slug, token));
  const location = [event.venueName, event.venueAddress].filter(Boolean).join(", ");
  const ics = toIcs({
    uid: `${invitation.id}@attendly`,
    title: eventDisplayName(event),
    start: event.date,
    end: new Date(event.date.getTime() + DEFAULT_DURATION_MS),
    location: location || undefined,
    description: `${copyFor(event.type).invitationSubtitle}. Your ticket, with the QR code to show at the entrance: ${url}`,
    url,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      // It carries the guest's ticket link: don't keep it in shared caches
      "Cache-Control": "private, no-store",
    },
  });
}
