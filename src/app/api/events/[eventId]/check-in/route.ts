/**
 * Door check-in (owner only, T-504)
 * POST /api/events/[eventId]/check-in - { code, count? }: admit people on a scanned ticket
 *
 * Every outcome has a `result` the scanner shows: admitted (200); full, too_many or not_valid
 * (409); not_found (404) for an unknown ticket or another event's
 */
import { NextResponse } from "next/server";
import { checkInRepo, type CheckInResult } from "@/server/repositories/check-in.repo";
import { handleRoute } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";
import { parseBody } from "@/server/http/validate";
import { checkInSchema } from "@/server/validation/invitation.schemas";
import { ticketTokenFrom } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

const STATUS: Record<CheckInResult["result"], number> = {
  admitted: 200,
  full: 409,
  too_many: 409,
  not_valid: 409,
  not_found: 404,
};

export const POST = handleRoute(async (request, { params }: RouteParams) => {
  const { user, event } = await requireEventOwner((await params).eventId, request.headers);
  const { code, count } = await parseBody(request, checkInSchema);

  const token = ticketTokenFrom(code);
  const outcome: CheckInResult = token
    ? await checkInRepo.checkIn(event.id, token, count, { userId: user.id })
    : { result: "not_found" };
  return NextResponse.json(outcome, { status: STATUS[outcome.result] });
});
