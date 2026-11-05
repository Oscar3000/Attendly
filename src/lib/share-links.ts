import { copyFor } from "./event-copy";

/**
 * Links that open a message to a guest, in the event type's wording, with their ticket link
 */
export function shareLinks(eventType: string, guestName: string, ticketUrl: string) {
  const copy = copyFor(eventType);
  const message = `${copy.shareMessage}\n\nView your invitation: ${ticketUrl}`;
  const subject = `${copy.shareSubject} - ${guestName}`;

  return {
    email: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
    whatsApp: `https://wa.me/?text=${encodeURIComponent(message)}`,
  };
}
