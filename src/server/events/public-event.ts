/**
 * What the public event page (/e/[slug]) shows about an event, shared by the page, its
 * metadata and its link preview image (T-404)
 */
import "server-only";
import { cache } from "react";
import { formatEventDateTime } from "@/lib/timezones";
import { eventRepo, type Event } from "@/server/repositories/event.repo";

// The page and generateMetadata both load the event in one request: query once
export const getPublicEvent = cache((slug: string) => eventRepo.findBySlug(slug));

// The names in the hero, else the title
export const eventDisplayName = (event: Event) => event.hostNames ?? event.title;

// "Saturday, May 23, 2026 at 3:00 PM · Canary World", on the event's clock
export function eventWhenAndWhere(event: Event): string {
  const venue = event.venueName ?? event.venueAddress;
  const when = formatEventDateTime(event.date, event.timezone);
  return venue ? `${when} · ${venue}` : when;
}
