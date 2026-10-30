"use client";

import Link from "next/link";
import { useEventCard } from "@/components/admin/event-card-context";
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

  if (isError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 text-[#D32F2F]">
        Couldn&apos;t load check-ins. Please reload.
      </div>
    );
  }
  if (!data) return null;

  const { summary, recent } = data;
  const percent =
    summary.expected > 0 ? Math.round((summary.admitted / summary.expected) * 100) : 0;

  const undo = (id: string, guestName: string, count: number) => {
    const people = `${count} ${count === 1 ? "person" : "people"}`;
    if (
      window.confirm(`Undo checking in ${people} for ${guestName}? Their ticket admits them again.`)
    ) {
      void undoCheckIn({ eventId, id });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-medium text-gray-900">Check-ins</h2>
        <Link
          href={`/dashboard/events/${eventId}/check-in`}
          className="text-sm font-medium text-[#C07A54] hover:underline"
        >
          Open scanner
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-gray-900">
            <span className="text-4xl sm:text-5xl font-bold">{summary.admitted}</span>
            <span className="text-gray-600"> of {summary.expected} people in</span>
          </p>
          <div
            className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-label="People checked in"
            aria-valuenow={summary.admitted}
            aria-valuemin={0}
            aria-valuemax={summary.expected}
          >
            <div
              className="h-full rounded-full bg-[#C07A54]"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {summary.invitationsCheckedIn} of {summary.invitations} invitations checked in
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">Latest</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500">Nobody has checked in yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((checkIn) => (
                <li key={checkIn.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {checkIn.guestName}
                      {checkIn.count > 1 && (
                        <span className="text-gray-600"> · {checkIn.count} people</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatEventTime(new Date(checkIn.at), timezone)}
                      {checkIn.by && ` · by ${checkIn.by}`}
                    </p>
                  </div>
                  <button
                    onClick={() => undo(checkIn.id, checkIn.guestName, checkIn.count)}
                    disabled={undoing}
                    className="shrink-0 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Undo
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
