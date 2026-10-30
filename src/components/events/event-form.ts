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
  "font-inter w-full rounded-lg border border-[#E0E0E0] bg-white px-4 py-2 text-sm text-[#333333] focus:ring-2 focus:outline-none";

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
