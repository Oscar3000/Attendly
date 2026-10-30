/**
 * Door check-in (T-504, T-505): what the check-in API answers, and the wording the scanner shows
 * for each answer. Shared by the host's scanner and the door helper's (T-507)
 */
import { formatEventTime } from "./timezones";

export interface CheckInGuest {
  name: string;
  // How many people the invitation lets in, and how many it has let in so far
  admits: number;
  admitted: number;
}

// The JSON the check-in API returns (dates as ISO strings)
export type CheckInResponse =
  // From a preview: the ticket is valid and has places left; nobody is admitted yet
  | { result: "ready"; guest: CheckInGuest }
  | { result: "admitted"; guest: CheckInGuest; count: number }
  // Everyone on the invitation is already in; the last check-in says when and by whom
  | { result: "full"; guest: CheckInGuest; lastCheckIn: { at: string; by: string | null } | null }
  // Fewer places left than people asked to come in
  | { result: "too_many"; guest: CheckInGuest; requested: number }
  | { result: "not_valid"; guest: { name: string }; status: "declined" | "rescinded" }
  | { result: "not_found" }
  // A door helper's link was revoked or has expired (T-507)
  | { result: "link_inactive" };

export interface CheckInMessage {
  // Green lets people in; red stops them
  tone: "ok" | "stop";
  title: string;
  detail: string;
}

const people = (count: number) => `${count} ${count === 1 ? "person" : "people"}`;

// What the full-screen result says; times on the event's clock. Not for "ready", which asks
// how many are coming in instead
export function checkInMessage(
  response: Exclude<CheckInResponse, { result: "ready" }>,
  timezone: string,
): CheckInMessage {
  switch (response.result) {
    case "admitted": {
      const { guest, count } = response;
      return {
        tone: "ok",
        title: `Admit ${people(count)}`,
        detail: `${guest.name} · ${guest.admitted} of ${guest.admits} now in`,
      };
    }
    case "full": {
      const { guest, lastCheckIn } = response;
      const when = lastCheckIn
        ? ` Last check-in at ${formatEventTime(new Date(lastCheckIn.at), timezone)}${
            lastCheckIn.by ? ` by ${lastCheckIn.by}` : ""
          }.`
        : "";
      return {
        tone: "stop",
        title: "Already checked in",
        detail: `${guest.name}: all ${people(guest.admits)} on this invitation are in.${when}`,
      };
    }
    case "too_many": {
      const left = response.guest.admits - response.guest.admitted;
      return {
        tone: "stop",
        title: left === 1 ? "Only 1 place left" : `Only ${left} places left`,
        detail: `${response.guest.name}: ${response.guest.admitted} of ${response.guest.admits} already in`,
      };
    }
    case "not_valid":
      return {
        tone: "stop",
        title: response.status === "rescinded" ? "Invitation cancelled" : "Invitation declined",
        detail: `${response.guest.name} can't be checked in with this invitation`,
      };
    case "link_inactive":
      return {
        tone: "stop",
        title: "This check-in link no longer works",
        detail: "Ask the host for a new one",
      };
    case "not_found":
      return {
        tone: "stop",
        title: "Not a ticket for this event",
        detail: "This QR code isn't an invitation to this event",
      };
  }
}

// When the request itself fails (offline, server error)
export const CHECK_IN_FAILED: CheckInMessage = {
  tone: "stop",
  title: "Couldn't check in",
  detail: "Check your connection and scan again",
};
