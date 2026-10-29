"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listTimeZones } from "@/lib/timezones";
import { useCreateEventMutation, type CreateEventForm } from "@/store/eventInvitationApi";
import { FormError, SubmitButton } from "@/components/auth/auth-card";
import { TextField } from "@/components/auth/text-field";

type FieldErrors = Partial<Record<keyof CreateEventForm, string>>;

const EVENT_TYPES: { value: CreateEventForm["type"]; label: string }[] = [
  { value: "WEDDING", label: "Wedding" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "OTHER", label: "Other" },
];

const selectClass =
  "font-inter w-full rounded-lg border border-[#E0E0E0] bg-white px-4 py-2 text-sm text-[#333333] focus:ring-2 focus:outline-none";

// 400 responses carry zod's flattened errors: { details: { fieldErrors: { title: [...] } } }
function fieldErrorsFrom(error: unknown): FieldErrors | undefined {
  const details = (error as { data?: { details?: { fieldErrors?: Record<string, string[]> } } })
    ?.data?.details;
  if (!details?.fieldErrors) return undefined;
  return Object.fromEntries(
    Object.entries(details.fieldErrors).map(([field, messages]) => [field, messages[0]]),
  );
}

// Nothing to subscribe to: whether we're in the browser never changes after the first render
const subscribeNever = () => () => {};

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateEventForm>({
    title: "",
    type: "WEDDING",
    date: "",
    timezone: "",
    venueName: "",
    venueAddress: "",
    rsvpDeadline: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [createEvent, { isLoading }] = useCreateEventMutation();

  // The browser's zone and zone list only exist in the browser. The server renders "not yet"
  // (false), the browser true, so the server HTML and the first browser render agree
  const inBrowser = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const timeZones = useMemo(() => (inBrowser ? listTimeZones() : []), [inBrowser]);
  // Until the host picks one, default to the browser's zone
  const timezone =
    form.timezone || (inBrowser ? Intl.DateTimeFormat().resolvedOptions().timeZone : "");

  const set = (field: keyof CreateEventForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(undefined);
    try {
      const { event } = await createEvent({ ...form, timezone }).unwrap();
      router.push(`/dashboard/events/${event.id}`);
    } catch (error) {
      const fieldErrors = fieldErrorsFrom(error);
      if (fieldErrors) setErrors(fieldErrors);
      else setFormError("Couldn't create the event. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF9F4] px-4 py-6 sm:p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-inter text-2xl font-bold text-gray-900 sm:text-3xl">New event</h1>
          <Link href="/dashboard" className="font-inter text-sm text-gray-600 hover:text-gray-900">
            ← Your events
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
        >
          <TextField
            id="title"
            label="Title"
            placeholder="e.g. Pamela & Oscar"
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            disabled={isLoading}
            error={errors.title}
          />

          <div className="mb-4">
            <label
              htmlFor="type"
              className="font-inter mb-2 block text-sm font-medium text-[#333333]"
            >
              Type
            </label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => set("type")(e.target.value)}
              disabled={isLoading}
              className={selectClass}
            >
              {EVENT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <TextField
            id="date"
            label="Starts"
            type="datetime-local"
            value={form.date}
            onChange={(e) => set("date")(e.target.value)}
            disabled={isLoading}
            error={errors.date}
          />

          <div className="mb-4">
            <label
              htmlFor="timezone"
              className="font-inter mb-2 block text-sm font-medium text-[#333333]"
            >
              Time zone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => set("timezone")(e.target.value)}
              disabled={isLoading || timeZones.length === 0}
              aria-invalid={errors.timezone ? true : undefined}
              aria-describedby={errors.timezone ? "timezone-error" : undefined}
              className={selectClass}
            >
              {timeZones.length === 0 ? (
                <option value="">Loading time zones…</option>
              ) : (
                timeZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replaceAll("_", " ")}
                  </option>
                ))
              )}
            </select>
            <p className="font-inter mt-1 text-xs text-[#666666]">
              Dates and times are in this zone, wherever your guests are.
            </p>
            {errors.timezone && (
              <p id="timezone-error" className="font-inter mt-1 text-sm text-[#D32F2F]">
                {errors.timezone}
              </p>
            )}
          </div>

          <TextField
            id="venueName"
            label="Venue (optional)"
            placeholder="e.g. Canary World"
            value={form.venueName}
            onChange={(e) => set("venueName")(e.target.value)}
            disabled={isLoading}
            error={errors.venueName}
          />
          <TextField
            id="venueAddress"
            label="Venue address (optional)"
            value={form.venueAddress}
            onChange={(e) => set("venueAddress")(e.target.value)}
            disabled={isLoading}
            error={errors.venueAddress}
          />
          <TextField
            id="rsvpDeadline"
            label="RSVP deadline (optional)"
            type="datetime-local"
            value={form.rsvpDeadline}
            onChange={(e) => set("rsvpDeadline")(e.target.value)}
            disabled={isLoading}
            error={errors.rsvpDeadline}
          />

          <FormError message={formError} />
          <SubmitButton loading={isLoading}>Create event</SubmitButton>
        </form>
      </div>
    </main>
  );
}
