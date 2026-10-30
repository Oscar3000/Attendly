"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { CheckInFlow } from "@/components/check-in/check-in-flow";
import { useEventCard } from "@/components/admin/event-card-context";
import { eventInvitationApi, staleAfterWrite } from "@/store/eventInvitationApi";

/**
 * The host's door check-in (T-505): scan guests' tickets with this device's camera. The event
 * layout has already checked that the signed-in account owns the event
 */
export default function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const event = useEventCard();
  const dispatch = useDispatch();

  return (
    <main className="min-h-screen bg-[#FFF9F4] px-4 py-6">
      <div className="mx-auto max-w-md">
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Check in guests</h1>
        <p className="mb-6 text-sm text-gray-600">
          {event?.title ? `${event.title} · ` : ""}Scan each guest&apos;s QR code at the entrance
        </p>

        <CheckInFlow
          endpoint={`/api/events/${encodeURIComponent(eventId)}/check-in`}
          timezone={event?.timezone ?? "UTC"}
          // The dashboard's counts and list change with every admission
          onAdmitted={() =>
            dispatch(eventInvitationApi.util.invalidateTags(staleAfterWrite(eventId)))
          }
        />
      </div>
    </main>
  );
}
