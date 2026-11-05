import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { doorLinkRepo } from "@/server/repositories/door-link.repo";
import { CheckInFlow } from "@/components/check-in/check-in-flow";
import { CheckInResult } from "@/components/check-in/check-in-result";
import { checkInMessage } from "@/lib/check-in";

interface DoorPageProps {
  params: Promise<{ token: string }>;
}

// The URL is the helper's credential: keep it out of search engines and Referer headers
// (next.config.ts also sends Referrer-Policy: no-referrer for these URLs)
export const metadata: Metadata = {
  title: "Check in guests",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * A door helper's scanner (T-507): no sign-in, the link is the credential. It shows only the
 * event's name and the scanner, and can only check guests in to the link's event
 */
export default async function DoorPage({ params }: DoorPageProps) {
  const { token } = await params;
  const found = await doorLinkRepo.findByToken(token);
  if (!found) notFound();

  if (found.status === "inactive") {
    return <CheckInResult message={checkInMessage({ result: "link_inactive" }, "UTC")} />;
  }

  const { event, name } = found.link;
  return (
    <CheckInFlow
      endpoint={`/api/door/${encodeURIComponent(token)}/check-in`}
      timezone={event.timezone}
      label={`Checking in as ${name}`}
      title={event.hostNames ?? event.title}
    />
  );
}
