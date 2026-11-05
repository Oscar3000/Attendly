"use client";

import Link from "next/link";
import { useState } from "react";
import { useEventCard } from "@/components/admin/event-card-context";
import { Toast } from "@/components/ui/toast";
import { formatEventTime } from "@/lib/timezones";
import { useGetCheckInsQuery, useUndoCheckInMutation } from "@/store/eventInvitationApi";

// Door helpers check people in from their own phones; refresh while the dashboard is open
const POLL_MS = 30_000;

/**
 * Check-ins on the event dashboard (T-509): people in vs expected, invitations checked in, the
 * latest check-ins with who admitted them, and undo for one made by mistake (host only)
 */
export default function CheckInPanel({ eventId }: { eventId: string }) {
  const timezone = useEventCard()?.timezone ?? "UTC";
  const { data, isError } = useGetCheckInsQuery(eventId, { pollingInterval: POLL_MS });
  const [undoCheckIn, { isLoading: undoing }] = useUndoCheckInMutation();
  const [toast, setToast] = useState<string | null>(null);

  if (isError) {
    return (
      <div role="alert" className="rounded-3xl bg-card p-7 text-danger">
        Couldn&apos;t load check-ins. Please reload.
      </div>
    );
  }
  if (!data) return null;

  const { summary, recent } = data;
  const percent =
    summary.expected > 0 ? Math.round((summary.admitted / summary.expected) * 100) : 0;

  // Undoing is quick to reverse, by scanning the ticket again, so it doesn't ask first
  const undo = async (id: string, guestName: string) => {
    try {
      await undoCheckIn({ eventId, id }).unwrap();
      setToast(`${guestName} can be checked in again`);
    } catch {
      setToast("Couldn't undo that check-in. Please try again.");
    }
  };

  return (
    <section className="flex min-w-0 flex-col rounded-3xl bg-card p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-[13px] text-slate">Check-ins</h2>
        <Link
          href={`/dashboard/events/${eventId}/check-in`}
          className="inline-flex min-h-11 items-center text-[15px] font-semibold underline"
        >
          Open scanner
        </Link>
      </div>

      <p className="font-display text-[44px] leading-none font-extrabold tracking-tight">
        {summary.admitted}
        <span className="text-xl text-slate"> of {summary.expected} people in</span>
      </p>
      <div
        className="mt-3.5 h-3 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-label="People checked in"
        aria-valuenow={summary.admitted}
        aria-valuemin={0}
        aria-valuemax={summary.expected}
      >
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-500"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <p className="mt-2.5 text-[15px] text-slate">
        {summary.invitationsCheckedIn} of {summary.invitations} invitations checked in
      </p>

      {recent.length === 0 ? (
        <p className="mt-3.5 text-slate">Nobody has checked in yet.</p>
      ) : (
        <ul className="mt-3 max-h-60 overflow-y-auto">
          {recent.map((checkIn) => (
            <li
              key={checkIn.id}
              className="flex items-center justify-between gap-3 border-t border-sand py-1"
            >
              <span className="min-w-0">
                <span className="font-semibold">{checkIn.guestName}</span>
                <span className="text-slate">
                  {checkIn.count > 1 && ` · ${checkIn.count} people`}
                  {` · ${formatEventTime(new Date(checkIn.at), timezone)}`}
                  {checkIn.by && ` by ${checkIn.by}`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void undo(checkIn.id, checkIn.guestName)}
                disabled={undoing}
                aria-label={`Undo check-in for ${checkIn.guestName}`}
                className="min-h-11 shrink-0 px-3 text-[15px] font-semibold underline disabled:opacity-50"
              >
                Undo
              </button>
            </li>
          ))}
        </ul>
      )}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
