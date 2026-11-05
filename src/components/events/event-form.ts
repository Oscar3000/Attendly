/**
 * Pieces shared by the new event form and the event settings form
 */
import type { CreateEventForm } from "@/store/eventInvitationApi";

export const EVENT_TYPES: { value: CreateEventForm["type"]; label: string }[] = [
  { value: "WEDDING", label: "Wedding" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "OTHER", label: "Other" },
];

export const selectClass =
  "h-13 w-full rounded-[14px] border-[1.5px] border-line bg-card px-3 text-base text-ink";

export const WIZARD_STEPS = ["Kind", "Details", "Look"];

// The new event wizard's step for a field the server rejected: the first with an error
export function firstStepWithError(errors: Partial<Record<keyof CreateEventForm, string>>): number {
  if (errors.type) return 0;
  const details = ["title", "date", "timezone", "venueName", "venueAddress", "rsvpDeadline"];
  if (Object.keys(errors).some((field) => details.includes(field))) return 1;
  return errors.theme ? 2 : 1;
}

// 400 responses carry zod's flattened errors: { details: { fieldErrors: { title: [...] } } }
export function fieldErrorsFrom<Field extends string>(
  error: unknown,
): Partial<Record<Field, string>> | undefined {
  const details = (error as { data?: { details?: { fieldErrors?: Record<string, string[]> } } })
    ?.data?.details;
  if (!details?.fieldErrors) return undefined;
  return Object.fromEntries(
    Object.entries(details.fieldErrors).map(([field, messages]) => [field, messages[0]]),
  ) as Partial<Record<Field, string>>;
}
