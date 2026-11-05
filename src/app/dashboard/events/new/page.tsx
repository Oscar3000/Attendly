"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import { THEME_IDS, THEMES } from "@/lib/themes";
import { listTimeZones } from "@/lib/timezones";
import { cn } from "@/lib/utils";
import { useCreateEventMutation, type CreateEventForm } from "@/store/eventInvitationApi";
import { FormError } from "@/components/auth/auth-card";
import {
  fieldErrorsFrom,
  firstStepWithError,
  selectClass,
  WIZARD_STEPS,
} from "@/components/events/event-form";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { EventPreview } from "./event-preview";

type Field = keyof CreateEventForm;
type FieldErrors = Partial<Record<Field, string>>;

const KINDS: { value: CreateEventForm["type"]; label: string; hint: string }[] = [
  { value: "WEDDING", label: "Wedding", hint: "Names, families, colours of the day" },
  { value: "BIRTHDAY", label: "Birthday", hint: "A party with a guest list" },
  { value: "CORPORATE", label: "Corporate", hint: "Company events and launches" },
  { value: "OTHER", label: "Something else", hint: "Any other gathering" },
];

const HEADINGS = ["What are you hosting?", "The details", "Pick a look"];
const LAST_STEP = WIZARD_STEPS.length - 1;

// Nothing to subscribe to: whether we're in the browser never changes after the first render
const subscribeNever = () => () => {};

/**
 * Creating an event in three steps, beside a phone showing what guests will see
 */
export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateEventForm>({
    title: "",
    type: "WEDDING",
    date: "",
    timezone: "",
    venueName: "",
    venueAddress: "",
    rsvpDeadline: "",
    theme: "terracotta",
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

  // Each step replaces the last, so move focus to its heading; not on first load
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) firstRender.current = false;
    else heading.current?.focus();
  }, [step]);

  // Editing a field clears its error, so it doesn't complain about something already fixed
  const set = <F extends Field>(field: F, value: CreateEventForm[F]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const goTo = (next: number) => {
    setFormError(undefined);
    setStep(next);
  };

  const create = async () => {
    setErrors({});
    setFormError(undefined);
    try {
      const { event } = await createEvent({ ...form, timezone }).unwrap();
      // The event page shares this layout, so Next would keep the scroll position
      window.scrollTo({ top: 0, behavior: "instant" });
      router.push(`/dashboard/events/${event.id}`);
    } catch (error) {
      const fieldErrors = fieldErrorsFrom<Field>(error);
      if (fieldErrors) {
        setErrors(fieldErrors);
        setStep(firstStepWithError(fieldErrors));
      } else setFormError("Couldn't create the event. Please try again.");
    }
  };

  // Continue is the submit button too, so Enter in a field moves on rather than creating
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === LAST_STEP) {
      void create();
      return;
    }
    if (step === 1 && (!form.title.trim() || !form.date)) {
      setErrors({
        ...(form.title.trim() ? {} : { title: "Enter a title" }),
        ...(form.date ? {} : { date: "Enter a date and time" }),
      });
      return;
    }
    setErrors({});
    goTo(step + 1);
  };

  return (
    <div className="flex flex-col lg:min-h-[calc(100vh-68px)] lg:flex-row">
      <main className="min-w-0 flex-[1.4] px-6 pt-7 pb-12">
        <div className="mx-auto max-w-[600px]">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center font-medium">
            Back to your events
          </Link>

          <ol className="mt-4 grid grid-cols-3 gap-2">
            {WIZARD_STEPS.map((label, i) => (
              <li key={label} aria-current={i === step ? "step" : undefined}>
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-colors duration-200",
                    i <= step ? "bg-ember" : "bg-line",
                  )}
                />
                <span className="mt-2 block font-mono text-[13px] text-slate">{label}</span>
              </li>
            ))}
          </ol>

          <form onSubmit={handleSubmit} noValidate>
            <div key={step} className="animate-pop">
              <h1
                ref={heading}
                tabIndex={-1}
                className="mt-9 mb-6 font-display text-[clamp(2.25rem,5vw,3.125rem)] leading-[1.02] font-extrabold tracking-tight outline-none"
              >
                {HEADINGS[step]}
              </h1>

              {step === 0 && (
                <div role="group" aria-label="Kind of event" className="grid gap-3 sm:grid-cols-2">
                  {KINDS.map(({ value, label, hint }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={form.type === value}
                      onClick={() => set("type", value)}
                      className={cn(
                        "flex min-h-30 flex-col justify-end rounded-[22px] border-2 p-5 text-left transition-transform hover:-translate-y-0.5",
                        form.type === value
                          ? "border-ink bg-ink text-paper"
                          : "border-line bg-card text-ink",
                      )}
                    >
                      <span className="font-display text-[26px] font-extrabold tracking-tight">
                        {label}
                      </span>
                      <span className="text-[15px]">{hint}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 1 && (
                <>
                  <TextField
                    id="title"
                    label="Title"
                    placeholder="e.g. Amara & Chike"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    error={errors.title}
                    hint={
                      form.title.trim() && (
                        <p className="mt-1.5 font-mono text-[13px] text-slate">
                          Your page: /e/{slugify(form.title)}
                        </p>
                      )
                    }
                  />
                  <div className="grid gap-x-3.5 sm:grid-cols-2">
                    <TextField
                      id="date"
                      label="Starts"
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      error={errors.date}
                    />
                    <div className="mb-4">
                      <label htmlFor="timezone" className="mb-1.5 block text-[15px] font-semibold">
                        Time zone
                      </label>
                      <select
                        id="timezone"
                        value={timezone}
                        onChange={(e) => set("timezone", e.target.value)}
                        disabled={timeZones.length === 0}
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
                      {errors.timezone && (
                        <p id="timezone-error" className="mt-1 text-sm text-danger">
                          {errors.timezone}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="-mt-2 mb-4 text-sm text-slate">
                    Dates and times are in this zone, wherever your guests are.
                  </p>
                  <TextField
                    id="venueName"
                    label="Venue (optional)"
                    placeholder="e.g. The Glasshouse"
                    value={form.venueName}
                    onChange={(e) => set("venueName", e.target.value)}
                    error={errors.venueName}
                  />
                  <TextField
                    id="venueAddress"
                    label="Venue address (optional)"
                    value={form.venueAddress}
                    onChange={(e) => set("venueAddress", e.target.value)}
                    error={errors.venueAddress}
                  />
                  <TextField
                    id="rsvpDeadline"
                    label="RSVP deadline (optional)"
                    type="datetime-local"
                    value={form.rsvpDeadline}
                    onChange={(e) => set("rsvpDeadline", e.target.value)}
                    error={errors.rsvpDeadline}
                  />
                </>
              )}

              {step === LAST_STEP && (
                <div role="group" aria-label="Theme" className="grid gap-3 sm:grid-cols-2">
                  {THEME_IDS.map((id) => {
                    const { label, colors } = THEMES[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={form.theme === id}
                        onClick={() => set("theme", id)}
                        className={cn(
                          "flex flex-col gap-3 rounded-[22px] border-2 bg-card p-4 text-left transition-transform hover:-translate-y-0.5",
                          form.theme === id ? "border-ink" : "border-line",
                        )}
                      >
                        <span className="flex gap-1.5">
                          {[colors.accent, colors.ornament, colors.backgroundAlt].map((color) => (
                            <span
                              key={color}
                              className="size-8.5 rounded-full shadow-[inset_0_0_0_1px_var(--color-line)]"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </span>
                        <span className="font-semibold">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6">
              <FormError
                message={formError ?? (step !== 1 ? (errors.type ?? errors.theme) : undefined)}
              />
            </div>
            <div className="flex justify-between gap-3">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => goTo(step - 1)}
                >
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" loading={isLoading}>
                {step === LAST_STEP ? "Create event" : "Continue"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <EventPreview
        type={form.type}
        title={form.title}
        date={form.date}
        timezone={timezone}
        venueName={form.venueName}
        theme={form.theme}
      />
    </div>
  );
}
