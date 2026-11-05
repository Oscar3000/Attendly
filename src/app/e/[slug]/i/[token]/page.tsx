import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { eventDisplayName, getGuestTicket } from "@/server/events/public-event";
import type { GuestTicket } from "@/server/repositories/invitation.repo";
import { copyFor } from "@/lib/event-copy";
import { themeStyle } from "@/lib/themes";
import { formatEventDate, formatEventTime } from "@/lib/timezones";
import { absoluteUrl, ticketPath } from "@/lib/utils";
import { TicketCard } from "@/components/ui/ticket-card";
import { eventFontVariables } from "../../fonts";
import { TicketFlip } from "./ticket-flip";

interface TicketPageProps {
  params: Promise<{ slug: string; token: string }>;
}

export async function generateMetadata({ params }: TicketPageProps): Promise<Metadata> {
  const { slug, token } = await params;
  const ticket = await getGuestTicket(slug, token);
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

const headingStyle = { color: "var(--event-ink)", fontFamily: "var(--event-heading-font)" };
const actionClass =
  "flex min-h-13 items-center justify-center rounded-full px-6 font-semibold transition-transform hover:-translate-y-0.5";

/**
 * A guest's ticket (T-502): the link is the credential, so no PIN or sign-in. Read-only: the
 * guest shows the QR code at the entrance, where the host or a door helper checks them in.
 * There's nothing here to confirm, decline or check in with
 */
export default async function TicketPage({ params }: TicketPageProps) {
  const { slug, token } = await params;
  const ticket = await getGuestTicket(slug, token);
  if (!ticket) notFound();
  const { event, invitation } = ticket;

  // Only valid invitations get a QR code. It encodes this page's own URL
  const valid = invitation.status !== "rescinded" && invitation.status !== "declined";
  const qrCode = valid
    ? await QRCode.toDataURL(absoluteUrl(ticketPath(slug, token)), { width: 480, margin: 1 })
    : undefined;

  return (
    <main
      className={`flex min-h-dvh flex-col ${eventFontVariables}`}
      style={{
        ...themeStyle(event.theme),
        backgroundColor: "var(--event-ink)",
        color: "var(--event-bg)",
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-6">
        <div className="text-center">
          <p className="text-sm">{copyFor(event.type).invitationSubtitle}</p>
          <h1
            className="mt-0.5 text-[clamp(1.75rem,8.5vw,2.125rem)] leading-[1.1] font-bold [overflow-wrap:anywhere]"
            style={{ fontFamily: "var(--event-heading-font)" }}
          >
            {eventDisplayName(event)}
          </h1>
        </div>

        <TicketFlip
          backLabel={valid ? "Date, venue and calendar" : "Date and venue"}
          front={
            <TicketCard
              notchColor="var(--event-ink)"
              lineColor="var(--event-border)"
              cardColor="var(--event-card)"
              className="h-full"
              stub={<TicketPass status={invitation.status} qrCode={qrCode} />}
            >
              <div className="p-6 text-center">
                <p className="text-sm" style={{ color: "var(--event-text)" }}>
                  This invitation is for
                </p>
                <h2
                  className="mt-0.5 text-[clamp(1.5rem,7.5vw,2rem)] leading-[1.15] font-bold [overflow-wrap:anywhere]"
                  style={headingStyle}
                >
                  {invitation.name}
                </h2>
                <p className="mt-1 font-semibold" style={{ color: "var(--event-accent)" }}>
                  {admitsLabel(invitation.plusOne)}
                </p>
              </div>
            </TicketCard>
          }
          back={
            <div
              className="flex h-full flex-col gap-5 rounded-3xl p-7"
              style={{ backgroundColor: "var(--event-card)", color: "var(--event-text)" }}
            >
              <div>
                <h2 className="text-3xl leading-[1.15] font-bold" style={headingStyle}>
                  {formatEventDate(event.date, event.timezone)}
                </h2>
                <p className="mt-0.5">{formatEventTime(event.date, event.timezone)}</p>
              </div>
              {(event.venueName || event.venueAddress) && (
                <div className="break-words">
                  {event.venueName && (
                    <p className="font-semibold" style={{ color: "var(--event-ink)" }}>
                      {event.venueName}
                    </p>
                  )}
                  {event.venueAddress && (
                    <p className="whitespace-pre-line">{event.venueAddress}</p>
                  )}
                </div>
              )}
              <div className="mt-auto flex flex-col gap-2">
                {valid && (
                  // A file download, not a page: a plain link, so the browser hands it to the calendar
                  <a
                    href={`${ticketPath(slug, token)}/calendar.ics`}
                    download
                    className={actionClass}
                    style={{ backgroundColor: "var(--event-accent)", color: "#FFFFFF" }}
                  >
                    Add to calendar
                  </a>
                )}
                <Link
                  href={`/e/${slug}`}
                  className={`${actionClass} border-[1.5px]`}
                  style={{ borderColor: "var(--event-accent)", color: "var(--event-accent)" }}
                >
                  See the event page
                </Link>
              </div>
            </div>
          }
        />

        <p className="text-center text-[13px]">Powered by Attendly</p>
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
      <div className="p-6">
        <p
          className="rounded-2xl p-5 text-center"
          style={{ backgroundColor: "var(--event-bg-alt)", color: "var(--event-ink)" }}
        >
          {status === "rescinded"
            ? "This invitation has been cancelled. If you think this is a mistake, please contact the host."
            : "This invitation was declined. If your plans have changed, please contact the host."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3.5 p-6">
      {/* White whatever the theme, so scanners can read it */}
      <div className="rounded-[14px] bg-white p-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL */}
        <img src={qrCode} alt="Your entry QR code" width={240} height={240} className="block" />
      </div>
      <p className="text-center text-[15px]" style={{ color: "var(--event-text)" }}>
        Show this QR code at the entrance. It&apos;s only for the people on this invitation, so
        please don&apos;t share it.
      </p>
    </div>
  );
}
