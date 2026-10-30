/**
 * An event's door helper links (owner only, T-506)
 * GET  /api/events/[eventId]/door-links - Every link, newest first, with its check-in count
 * POST /api/events/[eventId]/door-links - { name }: create a link; the response has its URL,
 *      which can't be read back later (only a hash of its token is stored)
 */
import { NextResponse } from "next/server";
import { doorLinkRepo } from "@/server/repositories/door-link.repo";
import { handleRoute } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";
import { parseBody } from "@/server/http/validate";
import { createDoorLinkSchema } from "@/server/validation/event.schemas";
import { absoluteUrl } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export const GET = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);
  return NextResponse.json({ doorLinks: await doorLinkRepo.listForEvent(event.id) });
});

export const POST = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);
  const { name } = await parseBody(request, createDoorLinkSchema);

  const { link, token } = await doorLinkRepo.create(event, name);
  // The helper's scanner page (T-507)
  return NextResponse.json({ doorLink: link, url: absoluteUrl(`/door/${token}`) }, { status: 201 });
});
