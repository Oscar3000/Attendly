/**
 * The event the /admin dashboard works on, until routes are scoped by event id (T-307 – T-309)
 * The admin has exactly one event today (the wedding from T-303), so it's unambiguous
 */
import "server-only";
import { ApiError } from "@/server/http/errors";
import { eventRepo, type Event } from "@/server/repositories/event.repo";

export async function requireCurrentEvent(ownerId: string): Promise<Event> {
  const events = await eventRepo.listByOwner(ownerId);
  if (events.length === 1) return events[0]!;

  // 409: the request is fine, the account's events aren't in a state the dashboard handles yet
  throw new ApiError(
    409,
    events.length === 0
      ? "Your account has no event yet. Run `npm run db:backfill-wedding` (see DEPLOYMENT.md)."
      : "Your account has more than one event; pick one once event pages exist (T-309).",
  );
}
