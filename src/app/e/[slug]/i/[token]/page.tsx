import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { eventDisplayName, getPublicEvent } from "@/server/events/public-event";
import { invitationRepo, type GuestTicket } from "@/server/repositories/invitation.repo";
import { copyFor } from "@/lib/event-copy";
import { themeStyle } from "@/lib/themes";
import { formatEventDate, formatEventTime } from "@/lib/timezones";
import { absoluteUrl } from "@/lib/utils";
import { eventFontVariables } from "../../fonts";

// What newAccessToken() makes (T-501); anything else is a 404 without a database query
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

interface TicketPageProps {
  params: Promise<{ slug: string; token: string }>;
}

// The page and generateMetadata both load the ticket in one request: query once
const getTicket = cache(async (slug: string, token: string) => {
  if (!TOKEN.test(token)) return undefined;
  const event = await getPublicEvent(slug);
  if (!event) return undefined;
  const invitation = await invitationRepo.getTicket(event.id, token);
  return invitation && { event, invitation };
});

export async function generateMetadata({ params }: TicketPageProps): Promise<Metadata> {
  const { slug, token } = await params;
  const ticket = await getTicket(slug, token);
  return {
    title: ticket
      ? { absolute: `Your invitation · ${eventDisplayName(ticket.event)}` }
      : "Invitation not found",
    // The link is the guest's credential: keep it out of search engines and Referer headers
    // (next.config.ts also sends Referrer-Policy: no-referrer for these URLs)
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

const cardStyle = { borderColor: "var(--event-border)", backgroundColor: "var(--event-card)" };
const headingStyle = { color: "var(--event-ink)", fontFamily: "var(--event-heading-font)" };

/**
 * A guest's ticket (T-502): the link is the credential, so no PIN or sign-in. Read-only: the
 * guest shows the QR code at the entrance, where the host or a door helper checks them in.
 * There's nothing here to confirm, decline or check in with
 */
export default async function TicketPage({ params }: TicketPageProps) {
  const { slug, token } = await params;
  const ticket = await getTicket(slug, token);
  if (!ticket) notFound();
  const { event, invitation } = ticket;

  const venue = event.venueName ?? event.venueAddress;
  // Only valid invitations get a QR code. It encodes this page's own URL
  const valid = invitation.status !== "rescinded" && invitation.status !== "declined";
  const qrCode = valid
    ? await QRCode.toDataURL(absoluteUrl(`/e/${slug}/i/${token}`), { width: 240, margin: 1 })
    : undefined;

  return (
    <main
      className={`min-h-screen px-4 py-10 ${eventFontVariables}`}
      style={themeStyle(event.theme)}
    >
      <div className="mx-auto max-w-md text-center">
        <p
          className="mb-2 text-xs tracking-[0.35em] uppercase"
          style={{ color: "var(--event-muted)" }}
        >
          {copyFor(event.type).invitationSubtitle}
        </p>
        <h1 className="mb-8 text-3xl font-bold sm:text-4xl" style={headingStyle}>
          {eventDisplayName(event)}
        </h1>

        <div className="rounded-2xl border p-6 shadow-sm" style={cardStyle}>
          <p className="text-sm" style={{ color: "var(--event-muted)" }}>
            This invitation is for
          </p>
          <h2 className="mt-1 text-2xl font-semibold" style={headingStyle}>
            {invitation.name}
          </h2>
          <p
            className="mt-1 text-sm font-semibold tracking-wide"
            style={{ color: "var(--event-accent)" }}
          >
            {admitsLabel(invitation.plusOne)}
          </p>

          <TicketPass status={invitation.status} qrCode={qrCode} />

          <div
            className="mt-6 border-t pt-5 text-sm"
            style={{ borderColor: "var(--event-border)" }}
          >
            <p className="font-semibold" style={{ color: "var(--event-ink)" }}>
              {formatEventDate(event.date, event.timezone)}
            </p>
            <p style={{ color: "var(--event-text)" }}>
              {formatEventTime(event.date, event.timezone)}
            </p>
            {venue && (
              <>
                <p className="mt-3 font-semibold" style={{ color: "var(--event-ink)" }}>
                  {venue}
                </p>
                {event.venueName && event.venueAddress && (
                  <p className="whitespace-pre-line" style={{ color: "var(--event-text)" }}>
                    {event.venueAddress}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <Link
          href={`/e/${slug}`}
          className="mt-6 inline-block text-sm font-medium underline-offset-2 hover:underline"
          style={{ color: "var(--event-accent)" }}
        >
          See the event page
        </Link>
        <p className="mt-8 text-xs" style={{ color: "var(--event-muted)" }}>
          Powered by Attendly
        </p>
      </div>
    </main>
  );
}

// "Admits 1" / "Admits 3 (you and 2 guests)"
function admitsLabel(plusOne: number): string {
  if (plusOne === 0) return "Admits 1";
  return `Admits ${plusOne + 1} (you and ${plusOne} ${plusOne === 1 ? "guest" : "guests"})`;
}

// The QR code to show at the door, or why there isn't one
function TicketPass({
  status,
  qrCode,
}: {
  status: GuestTicket["status"];
  qrCode: string | undefined;
}) {
  if (!qrCode) {
    return (
      <div className="mt-6 rounded-xl bg-black/5 p-4 text-sm" style={{ color: "var(--event-ink)" }}>
        {status === "rescinded"
          ? "This invitation has been cancelled. If you think this is a mistake, please contact the host."
          : "This invitation was declined. If your plans have changed, please contact the host."}
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL */}
      <img
        src={qrCode}
        alt="Your entry QR code"
        width={240}
        height={240}
        className="mx-auto mt-6 rounded-lg bg-white p-2"
      />
      <p className="mt-4 text-sm leading-6" style={{ color: "var(--event-text)" }}>
        Show this QR code at the entrance. It&apos;s only for the people on this invitation, so
        please don&apos;t share it.
      </p>
    </>
  );
}
