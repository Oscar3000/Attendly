/**
 * What the public event page (/e/[slug]) shows about an event, shared by the page, its
 * metadata and its link preview image (T-404)
 */
import "server-only";
import { cache } from "react";
import { formatEventDateTime } from "@/lib/timezones";
import { eventRepo, type Event } from "@/server/repositories/event.repo";
import { invitationRepo } from "@/server/repositories/invitation.repo";

// The page and generateMetadata both load the event in one request: query once
export const getPublicEvent = cache((slug: string) => eventRepo.findBySlug(slug));

// What newAccessToken() makes (T-501); anything else is unknown without a database query
const TICKET_TOKEN = /^[A-Za-z0-9_-]{43}$/;

// A guest's ticket (T-502): the event by slug, then the invitation by token within it. Shared
// by the ticket page, its metadata and its calendar file (T-510); queries once per request
export const getGuestTicket = cache(async (slug: string, token: string) => {
  if (!TICKET_TOKEN.test(token)) return undefined;
  const event = await getPublicEvent(slug);
  if (!event) return undefined;
  const invitation = await invitationRepo.getTicket(event.id, token);
  return invitation && { event, invitation };
});

// The names in the hero, else the title
export const eventDisplayName = (event: Event) => event.hostNames ?? event.title;

// "Saturday, May 23, 2026 at 3:00 PM · Canary World", on the event's clock
export function eventWhenAndWhere(event: Event): string {
  const venue = event.venueName ?? event.venueAddress;
  const when = formatEventDateTime(event.date, event.timezone);
  return venue ? `${when} · ${venue}` : when;
}
