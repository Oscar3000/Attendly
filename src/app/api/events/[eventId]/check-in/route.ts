/**
 * Door check-in (owner only, T-504)
 * POST /api/events/[eventId]/check-in - { code, count?, preview? }: admit people on a scanned
 * ticket, or with preview only look it up
 *
 * Every outcome has a `result` (src/lib/check-in.ts): ready (preview) or admitted (200); full,
 * too_many or not_valid (409); not_found (404) for an unknown ticket or another event's
 */
import { handleRoute } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";
import { scan } from "@/server/check-in/scan";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export const POST = handleRoute(async (request, { params }: RouteParams) => {
  const { user, event } = await requireEventOwner((await params).eventId, request.headers);
  return scan(request, event.id, { userId: user.id });
});
