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
    <CheckInFlow
      endpoint={`/api/events/${encodeURIComponent(eventId)}/check-in`}
      timezone={event?.timezone ?? "UTC"}
      label="Check in guests"
      title={event?.title ?? "Check in guests"}
      back={
        <Link
          href={`/dashboard/events/${eventId}`}
          className="inline-flex min-h-11 items-center self-start text-sm text-mist hover:text-paper"
        >
          ← Dashboard
        </Link>
      }
      footer={
        <p className="text-center text-sm text-mist">
          Someone else scanning?{" "}
          <Link
            href={`/dashboard/events/${eventId}/door-helpers`}
            className="inline-flex min-h-11 items-center font-medium text-paper underline"
          >
            Give them a door helper link
          </Link>
        </p>
      }
      // The dashboard's counts and list change with every admission
      onAdmitted={() => dispatch(eventInvitationApi.util.invalidateTags(staleAfterWrite(eventId)))}
    />
  );
}
