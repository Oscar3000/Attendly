/**
 * Ownership guard for event-scoped pages and routes (T-307, T-309)
 * Owning the event is the permission
 */
import "server-only";
import { requireUser, type CurrentUser } from "@/server/auth/current-user";
import { NotFoundError } from "@/server/http/errors";
import { eventRepo, type Event } from "@/server/repositories/event.repo";

// Signed out -> 401. A missing event and someone else's event both get the same 404,
// so the response never reveals which event ids exist
export async function requireEventOwner(
  eventId: string,
  requestHeaders?: Headers,
): Promise<{ user: CurrentUser; event: Event }> {
  const user = await requireUser(requestHeaders);
  const event = await eventRepo.findById(eventId);
  if (!event || event.ownerId !== user.id) throw new NotFoundError("Event not found");
  return { user, event };
}
