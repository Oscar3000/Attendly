import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { doorLinkRepo } from "@/server/repositories/door-link.repo";
import { CheckInFlow } from "@/components/check-in/check-in-flow";

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

  return (
    <main className="min-h-screen bg-[#FFF9F4] px-4 py-6">
      <div className="mx-auto max-w-md">
        {found.status === "inactive" ? (
          <div className="mt-16 rounded-2xl bg-white p-6 text-center shadow-sm">
            <h1 className="text-xl font-bold text-gray-900">This check-in link no longer works</h1>
            <p className="mt-2 text-gray-600">Ask the host for a new one.</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">
              {found.link.event.hostNames ?? found.link.event.title}
            </h1>
            <p className="mb-6 text-sm text-gray-600">
              Checking in as {found.link.name} · scan each guest&apos;s QR code at the entrance
            </p>
            <CheckInFlow
              endpoint={`/api/door/${encodeURIComponent(token)}/check-in`}
              timezone={found.link.event.timezone}
            />
          </>
        )}
      </div>
    </main>
  );
}
