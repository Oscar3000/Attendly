import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { eventRepo } from "@/server/repositories/event.repo";
import { listTimeZones, utcToZonedLocal } from "@/lib/timezones";
import type { EventSettingsForm } from "@/store/eventInvitationApi";
import SettingsForm from "./settings-form";

/**
 * Edit every field of an event (T-402). The layout already gates the event; the page checks
 * ownership again because it reads the event itself, and pages render alongside layouts
 */
export default async function EventSettingsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const event = await eventRepo.findById((await params).eventId);
  if (!event || event.ownerId !== user.id) notFound();

  // Dates go to the form as wall-clock values in the event's zone, like the host typed them
  const initial: EventSettingsForm = {
    title: event.title,
    type: event.type,
    date: utcToZonedLocal(event.date, event.timezone),
    timezone: event.timezone,
    venueName: event.venueName ?? "",
    venueAddress: event.venueAddress ?? "",
    rsvpDeadline: event.rsvpDeadline ? utcToZonedLocal(event.rsvpDeadline, event.timezone) : "",
    hostNames: event.hostNames ?? "",
    headline: event.headline ?? "",
    tagline: event.tagline ?? "",
    dressCode: event.dressCode ?? "",
    notes: event.notes ?? "",
    familyLines: event.familyLines,
    colorPalette: event.colorPalette,
  };

  // The zone list comes from the server so the server and browser render the same options
  return <SettingsForm eventId={event.id} initial={initial} timeZones={listTimeZones()} />;
}
