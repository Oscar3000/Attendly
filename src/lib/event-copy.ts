/**
 * Default wording by event type (T-407): a wedding "solemnly requests your presence", a birthday
 * or a company event just invites you. Hosts can override the headline per event; the rest
 * follows the type
 */

export type EventType = "WEDDING" | "BIRTHDAY" | "CORPORATE" | "OTHER";

export interface EventCopy {
  // The line above the host names on the event page, when the event has no headline
  headline: string;
  // Above the countdown on the event page
  countdown: string;
  // Under "You're invited!" on a guest's invitation
  invitationSubtitle: string;
  // The email subject and message a host sends with an invitation link
  shareSubject: string;
  shareMessage: string;
}

export const EVENT_COPY: Record<EventType, EventCopy> = {
  WEDDING: {
    headline: "Solemnly request your presence at their wedding celebration",
    countdown: "Counting down to the big day",
    invitationSubtitle: "Wedding celebration",
    shareSubject: "Wedding invitation",
    shareMessage: "You're invited to our wedding! We can't wait to celebrate with you.",
  },
  BIRTHDAY: {
    headline: "You're invited to celebrate the birthday of",
    countdown: "Counting down to the party",
    invitationSubtitle: "Birthday celebration",
    shareSubject: "Birthday invitation",
    shareMessage:
      "You're invited to the birthday celebration! We can't wait to celebrate with you.",
  },
  CORPORATE: {
    headline: "You're invited to join us at",
    countdown: "Counting down to the event",
    invitationSubtitle: "Event invitation",
    shareSubject: "Event invitation",
    shareMessage: "You're invited to our event. We look forward to seeing you there.",
  },
  OTHER: {
    headline: "You're invited to",
    countdown: "Counting down",
    invitationSubtitle: "Event invitation",
    shareSubject: "Invitation",
    shareMessage: "You're invited! We look forward to seeing you there.",
  },
};

// Unknown types (an older client, a future enum value) read as OTHER
export const copyFor = (type: string): EventCopy =>
  EVENT_COPY[type as EventType] ?? EVENT_COPY.OTHER;
