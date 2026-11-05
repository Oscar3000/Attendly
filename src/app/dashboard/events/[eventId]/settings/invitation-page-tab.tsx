import { TextField } from "@/components/ui/text-field";
import type { FamilyLine, PaletteColor } from "@/lib/event-content";
import { copyFor } from "@/lib/event-copy";
import type { EventSettingsForm } from "@/store/eventInvitationApi";
import { CoverImageField } from "./cover-image-field";
import { FieldError, inputClass, labelClass, smallButtonClass } from "./settings-fields";
import type { TextFieldProps } from "./settings-form";
import type { SettingsErrors } from "./settings-tabs";

interface InvitationPageTabProps {
  eventId: string;
  coverImageUrl: string | null;
  form: EventSettingsForm;
  errors: SettingsErrors;
  disabled: boolean;
  text: TextFieldProps;
  update: (changes: Partial<EventSettingsForm>) => void;
}

export function InvitationPageTab({
  eventId,
  coverImageUrl,
  form,
  errors,
  disabled,
  text,
  update,
}: InvitationPageTabProps) {
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

  return (
    <section className="rounded-3xl bg-card p-7">
      <p className="mb-4 text-slate">
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
              placeholder="e.g. Chief & Mrs Okafor"
              value={line.name}
              onChange={(e) => setFamilyLine(index, { name: e.target.value })}
              disabled={disabled}
              className={inputClass}
            />
            <input
              aria-label={`Family ${index + 1} title (optional)`}
              placeholder="Title (optional)"
              value={line.detail ?? ""}
              onChange={(e) => setFamilyLine(index, { detail: e.target.value })}
              disabled={disabled}
              className={inputClass}
            />
            <button
              type="button"
              aria-label={`Remove family ${index + 1}`}
              onClick={() =>
                update({ familyLines: form.familyLines.filter((_, i) => i !== index) })
              }
              disabled={disabled}
              className={smallButtonClass}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update({ familyLines: [...form.familyLines, { name: "" }] })}
          disabled={disabled}
          className={smallButtonClass}
        >
          Add family
        </button>
        <FieldError id="familyLines-error" message={errors.familyLines} />
      </fieldset>

      <TextField label="Dress code" placeholder="e.g. Traditional attire" {...text("dressCode")} />

      <fieldset className="mb-4" aria-describedby="colorPalette-error">
        <legend className={labelClass}>Colours of the day</legend>
        {form.colorPalette.map((color, index) => (
          <div key={index} className="mb-2 flex items-center gap-2">
            <input
              type="color"
              aria-label={`Colour ${index + 1}`}
              value={color.hex}
              onChange={(e) => setColor(index, { hex: e.target.value })}
              disabled={disabled}
              className="h-13 w-14 shrink-0 cursor-pointer rounded-[14px] border-[1.5px] border-line bg-card p-1"
            />
            <input
              aria-label={`Colour ${index + 1} name`}
              placeholder="e.g. Gold"
              value={color.name}
              onChange={(e) => setColor(index, { name: e.target.value })}
              disabled={disabled}
              className={`${inputClass} min-w-0`}
            />
            <button
              type="button"
              aria-label={`Remove colour ${index + 1}`}
              onClick={() =>
                update({ colorPalette: form.colorPalette.filter((_, i) => i !== index) })
              }
              disabled={disabled}
              className={smallButtonClass}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            update({ colorPalette: [...form.colorPalette, { name: "", hex: "#A5613D" }] })
          }
          disabled={disabled}
          className={smallButtonClass}
        >
          Add colour
        </button>
        <FieldError id="colorPalette-error" message={errors.colorPalette} />
      </fieldset>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          placeholder="Anything else guests should know, e.g. a church service before the reception"
          value={form.notes}
          onChange={(e) => update({ notes: e.target.value })}
          disabled={disabled}
          aria-invalid={errors.notes ? true : undefined}
          aria-describedby={errors.notes ? "notes-error" : undefined}
          className="w-full resize-y rounded-[14px] border-[1.5px] border-line bg-card px-4 py-3 text-base text-ink"
        />
        <FieldError id="notes-error" message={errors.notes} />
      </div>
    </section>
  );
}
