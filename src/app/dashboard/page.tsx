import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { eventRepo } from "@/server/repositories/event.repo";
import { EventsList } from "@/components/admin/events-list";
import { buttonClasses } from "@/components/ui/button";
import { EVENT_TYPE_LABELS } from "@/lib/event-copy";
import { THEMES } from "@/lib/themes";
import { daysUntil, formatEventDateTime } from "@/lib/timezones";

/**
 * The signed-in user's events, soonest first. Where sign-in and email links land
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const events = await eventRepo.listByOwnerWithReplies(user.id);

  return (
    <main className="px-6 pt-12 pb-18">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <h1 className="font-display text-[clamp(2.75rem,6vw,4.5rem)] leading-none font-extrabold tracking-tight">
            Your events
          </h1>
          <Link href="/dashboard/events/new" className={buttonClasses()}>
            New event
          </Link>
        </div>
        <EventsList
          events={events.map((event) => ({
            id: event.id,
            type: EVENT_TYPE_LABELS[event.type],
            title: event.title,
            when: formatEventDateTime(event.date, event.timezone),
            venue: event.venueName ?? event.venueAddress,
            color: THEMES[event.theme].colors.accent,
            invited: event.invited,
            replied: event.replied,
            days: daysUntil(event.date, event.timezone),
          }))}
        />
      </div>
    </main>
  );
}
