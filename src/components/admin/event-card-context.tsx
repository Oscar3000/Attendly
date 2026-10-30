"use client";

import { createContext, useContext } from "react";
import type { InvitationCardEvent } from "@/lib/invitation-image";

/**
 * The event's details for invitation images (T-408), provided by the event dashboard layout,
 * which already loads the event. Saving settings refreshes the layout, so this stays current
 */
const EventCardContext = createContext<InvitationCardEvent | undefined>(undefined);

export function EventCardProvider({
  event,
  children,
}: {
  event: InvitationCardEvent;
  children: React.ReactNode;
}) {
  return <EventCardContext.Provider value={event}>{children}</EventCardContext.Provider>;
}

// Undefined outside an event's dashboard
export const useEventCard = () => useContext(EventCardContext);
