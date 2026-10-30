"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FamilyLine, PaletteColor } from "@/lib/event-content";
import { copyFor } from "@/lib/event-copy";
import { THEME_IDS, THEMES } from "@/lib/themes";
import {
  useRemoveEventCoverMutation,
  useUpdateEventMutation,
  useUploadEventCoverMutation,
  type EventSettingsForm,
} from "@/store/eventInvitationApi";
import { FormError, SubmitButton } from "@/components/auth/auth-card";
import { TextField } from "@/components/auth/text-field";
import { EVENT_TYPES, fieldErrorsFrom, selectClass } from "@/components/events/event-form";

type FieldErrors = Partial<Record<keyof EventSettingsForm, string>>;
type TextFieldName = Exclude<keyof EventSettingsForm, "familyLines" | "colorPalette" | "type">;

interface SettingsFormProps {
  eventId: string;
  initial: EventSettingsForm;
  coverImageUrl: string | null;
  timeZones: string[];
}

const sectionClass = "mb-6 rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.1)]";
const sectionTitleClass = "font-inter mb-4 text-lg font-semibold text-gray-900";
const labelClass = "font-inter mb-2 block text-sm font-medium text-[#333333]";
const inputClass =
  "font-inter w-full rounded-lg border border-[#E0E0E0] px-4 py-2 text-sm text-[#333333] focus:ring-2 focus:outline-none";
const smallButtonClass =
  "font-inter rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50";

function ListError({ id, message }: { id: string; message?: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="font-inter mt-1 text-sm text-[#D32F2F]">
      {message}
    </p>
  );
}

// Uploads or removes the cover straight away, separately from the Save button (T-406)
function CoverImageField({ eventId, initialUrl }: { eventId: string; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string>();
  const [uploadCover, { isLoading: uploading }] = useUploadEventCoverMutation();
  const [removeCover, { isLoading: removing }] = useRemoveEventCoverMutation();
  const busy = uploading || removing;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(undefined);
    try {
      setUrl((await uploadCover({ eventId, file }).unwrap()).coverImageUrl);
    } catch (err) {
      setError(
        fieldErrorsFrom<"file">(err)?.file ?? "Couldn't upload the image. Please try again.",
      );
    }
  };

  const handleRemove = async () => {
    setError(undefined);
    try {
      await removeCover({ eventId }).unwrap();
      setUrl(null);
    } catch {
      setError("Couldn't remove the image. Please try again.");
    }
  };

  return (
    <div className="mb-4">
      <span className={labelClass}>Cover image</span>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- already resized server-side
        <img
          src={url}
          alt="Current cover"
          className="mb-3 max-h-56 w-full rounded-lg object-cover"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label className={`${smallButtonClass} cursor-pointer has-focus-visible:ring-2`}>
          {uploading ? "Uploading…" : url ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            disabled={busy}
            aria-describedby="cover-help cover-error"
            className="sr-only"
          />
        </label>
        {url && (
          <button type="button" onClick={handleRemove} disabled={busy} className={smallButtonClass}>
            {removing ? "Removing…" : "Remove"}
          </button>
        )}
      </div>
      <p id="cover-help" className="font-inter mt-1 text-xs text-[#666666]">
        JPEG, PNG or WebP, up to 5 MB. Saved right away.
      </p>
      <ListError id="cover-error" message={error} />
    </div>
  );
}

export default function SettingsForm({
  eventId,
  initial,
  coverImageUrl,
  timeZones,
}: SettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<EventSettingsForm>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [updateEvent, { isLoading }] = useUpdateEventMutation();

  const update = (changes: Partial<EventSettingsForm>) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, ...changes }));
  };
  const text = (field: TextFieldName) => ({
    id: field,
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => update({ [field]: e.target.value }),
    disabled: isLoading,
    error: errors[field],
  });

  const setFamilyLine = (index: number, changes: Partial<FamilyLine>) =>
    update({
      familyLines: form.familyLines.map((line, i) =>
        i === index ? { ...line, ...changes } : line,
      ),
    });
  const setColor = (index: number, changes: Partial<PaletteColor>) =>
    update({
      colorPalette: form.colorPalette.map((color, i) =>
        i === index ? { ...color, ...changes } : color,
      ),
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(undefined);
    setSaved(false);
    // Rows left empty are dropped rather than rejected
    const settings: EventSettingsForm = {
      ...form,
      familyLines: form.familyLines.filter((line) => line.name.trim() || line.detail?.trim()),
      colorPalette: form.colorPalette.filter((color) => color.name.trim()),
    };
    try {
      await updateEvent({ eventId, settings }).unwrap();
      setForm(settings);
      setSaved(true);
      router.refresh();
    } catch (error) {
      const fieldErrors = fieldErrorsFrom<keyof EventSettingsForm>(error);
      if (fieldErrors) setErrors(fieldErrors);
      else setFormError("Couldn't save the settings. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF9F4] px-4 py-6 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-inter text-2xl font-bold text-gray-900 sm:text-3xl">
            Event settings
          </h1>
          <Link
            href={`/dashboard/events/${eventId}`}
            className="font-inter text-sm text-gray-600 hover:text-gray-900"
          >
            ← Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Details</h2>
            <TextField label="Title" {...text("title")} />

            <div className="mb-4">
              <label htmlFor="type" className={labelClass}>
                Type
              </label>
              <select
                id="type"
                value={form.type}
                onChange={(e) => update({ type: e.target.value as EventSettingsForm["type"] })}
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

            <TextField label="Starts" type="datetime-local" {...text("date")} />

            <div className="mb-4">
              <label htmlFor="timezone" className={labelClass}>
                Time zone
              </label>
              <select
                id="timezone"
                value={form.timezone}
                onChange={(e) => update({ timezone: e.target.value })}
                disabled={isLoading}
                aria-invalid={errors.timezone ? true : undefined}
                aria-describedby={errors.timezone ? "timezone-error" : undefined}
                className={selectClass}
              >
                {timeZones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              <p className="font-inter mt-1 text-xs text-[#666666]">
                Changing the zone keeps the times above as typed, on the new zone&apos;s clock.
              </p>
              <ListError id="timezone-error" message={errors.timezone} />
            </div>

            <TextField label="Venue (optional)" {...text("venueName")} />
            <TextField label="Venue address (optional)" {...text("venueAddress")} />
            <TextField
              label="RSVP deadline (optional)"
              type="datetime-local"
              {...text("rsvpDeadline")}
            />
          </section>

          <section className={sectionClass}>
            <h2 className={sectionTitleClass}>Invitation page</h2>
            <p className="font-inter mb-4 text-sm text-[#666666]">
              What guests see on your event page. Everything here is optional.
            </p>
            <CoverImageField eventId={eventId} initialUrl={coverImageUrl} />
            <TextField
              label="Host names"
              placeholder={`Leave empty to show "${form.title || "the title"}"`}
              {...text("hostNames")}
            />
            <TextField
              label="Headline"
              // What the page shows while it's empty: the event type's wording
              placeholder={copyFor(form.type).headline}
              {...text("headline")}
            />
            <TextField label="Tagline" {...text("tagline")} />

            <fieldset className="mb-4" aria-describedby="familyLines-error">
              <legend className={labelClass}>Families</legend>
              {form.familyLines.map((line, index) => (
                <div key={index} className="mb-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    aria-label={`Family ${index + 1} name`}
                    placeholder="e.g. Chief & Lolo Livinus Umeh"
                    value={line.name}
                    onChange={(e) => setFamilyLine(index, { name: e.target.value })}
                    disabled={isLoading}
                    className={inputClass}
                  />
                  <input
                    aria-label={`Family ${index + 1} title (optional)`}
                    placeholder="Title (optional)"
                    value={line.detail ?? ""}
                    onChange={(e) => setFamilyLine(index, { detail: e.target.value })}
                    disabled={isLoading}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update({ familyLines: form.familyLines.filter((_, i) => i !== index) })
                    }
                    disabled={isLoading}
                    className={smallButtonClass}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update({ familyLines: [...form.familyLines, { name: "" }] })}
                disabled={isLoading}
                className={smallButtonClass}
              >
                Add family
              </button>
              <ListError id="familyLines-error" message={errors.familyLines} />
            </fieldset>

            <TextField
              label="Dress code"
              placeholder="e.g. Traditional attire"
              {...text("dressCode")}
            />

            <fieldset className="mb-4" aria-describedby="colorPalette-error">
              <legend className={labelClass}>Colours of the day</legend>
              {form.colorPalette.map((color, index) => (
                <div key={index} className="mb-2 flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`Colour ${index + 1}`}
                    value={color.hex}
                    onChange={(e) => setColor(index, { hex: e.target.value })}
                    disabled={isLoading}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded border border-[#E0E0E0]"
                  />
                  <input
                    aria-label={`Colour ${index + 1} name`}
                    placeholder="e.g. Gold"
                    value={color.name}
                    onChange={(e) => setColor(index, { name: e.target.value })}
                    disabled={isLoading}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      update({ colorPalette: form.colorPalette.filter((_, i) => i !== index) })
                    }
                    disabled={isLoading}
                    className={smallButtonClass}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  update({ colorPalette: [...form.colorPalette, { name: "", hex: "#C07A54" }] })
                }
                disabled={isLoading}
                className={smallButtonClass}
              >
                Add colour
              </button>
              <ListError id="colorPalette-error" message={errors.colorPalette} />
            </fieldset>

            <div className="mb-4">
              <label htmlFor="notes" className={labelClass}>
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                placeholder="Anything else guests should know, e.g. a church service before the reception"
                value={form.notes}
                onChange={(e) => update({ notes: e.target.value })}
                disabled={isLoading}
                aria-invalid={errors.notes ? true : undefined}
                aria-describedby={errors.notes ? "notes-error" : undefined}
                className={inputClass}
              />
              <ListError id="notes-error" message={errors.notes} />
            </div>
          </section>

          <section className={sectionClass}>
            <fieldset>
              <legend className={sectionTitleClass}>Theme</legend>
              <p className="font-inter mb-4 text-sm text-[#666666]">
                Colours and fonts for your event page.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {THEME_IDS.map((id) => {
                  const { label, colors, fonts } = THEMES[id];
                  return (
                    <label
                      key={id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 has-focus-visible:ring-2 has-focus-visible:ring-[#C07A54] ${
                        form.theme === id ? "border-[#C07A54]" : "border-[#E0E0E0]"
                      }`}
                      style={{ backgroundColor: colors.background }}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={id}
                        checked={form.theme === id}
                        onChange={() => update({ theme: id })}
                        disabled={isLoading}
                        className="sr-only"
                      />
                      <span className="flex shrink-0 gap-1" aria-hidden>
                        {[colors.accent, colors.ornament, colors.ink].map((color) => (
                          <span
                            key={color}
                            className="h-6 w-6 rounded-full border border-white shadow"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      <span
                        className="text-base"
                        style={{ color: colors.ink, fontFamily: fonts.heading }}
                      >
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </section>

          <FormError message={formError} />
          {saved && (
            <div
              role="status"
              className="font-inter mb-4 rounded-lg bg-[#E8F5E9] p-3 text-sm text-[#2E7D32]"
            >
              Settings saved.
            </div>
          )}
          <SubmitButton loading={isLoading}>Save settings</SubmitButton>
        </form>
      </div>
    </main>
  );
}
