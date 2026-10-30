/**
 * One scan at the door, for both check-in routes: the host's (T-504) and a door helper's
 * (T-507). Parses the body, finds the ticket and previews or admits, scoped to one event
 */
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import {
  checkInRepo,
  type CheckInBy,
  type CheckInResult,
} from "@/server/repositories/check-in.repo";
import { parseBody } from "@/server/http/validate";
import { checkInSchema } from "@/server/validation/invitation.schemas";
import { ticketTokenFrom } from "@/lib/utils";

export const CHECK_IN_STATUS: Record<CheckInResult["result"], number> = {
  ready: 200,
  admitted: 200,
  full: 409,
  too_many: 409,
  not_valid: 409,
  not_found: 404,
  link_inactive: 403,
};

export async function scan(
  request: NextRequest,
  eventId: string,
  by: CheckInBy,
): Promise<NextResponse> {
  const { code, count, preview } = await parseBody(request, checkInSchema);

  const token = ticketTokenFrom(code);
  const outcome: CheckInResult = !token
    ? { result: "not_found" }
    : preview
      ? await checkInRepo.preview(eventId, token)
      : await checkInRepo.checkIn(eventId, token, count, by);
  return NextResponse.json(outcome, { status: CHECK_IN_STATUS[outcome.result] });
}
