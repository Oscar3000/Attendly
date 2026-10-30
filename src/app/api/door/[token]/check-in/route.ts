/**
 * A door helper's check-in (T-507): no sign-in, the link's token is the credential
 * POST /api/door/[token]/check-in - { code, count?, preview? }: the same check-in as the host's
 * (src/server/check-in/scan.ts), limited to the link's event and recorded as the link's.
 * A revoked, expired or unknown link answers { result: "link_inactive" } (403)
 */
import { NextResponse } from "next/server";
import { handleRoute } from "@/server/http/errors";
import { doorLinkRepo } from "@/server/repositories/door-link.repo";
import { CHECK_IN_STATUS, scan } from "@/server/check-in/scan";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export const POST = handleRoute(async (request, { params }: RouteParams) => {
  const found = await doorLinkRepo.findByToken((await params).token ?? "");
  if (found?.status !== "active") {
    return NextResponse.json(
      { result: "link_inactive" },
      { status: CHECK_IN_STATUS.link_inactive },
    );
  }
  return scan(request, found.link.event.id, { doorLinkId: found.link.id });
});
