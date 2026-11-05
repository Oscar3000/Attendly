import { EVENT_TYPES, selectClass } from "@/components/events/event-form";
import { TextField } from "@/components/ui/text-field";
import type { EventSettingsForm } from "@/store/eventInvitationApi";
import { FieldError, labelClass } from "./settings-fields";
import type { SettingsErrors } from "./settings-tabs";
import type { TextFieldProps } from "./settings-form";

interface DetailsTabProps {
  form: EventSettingsForm;
  errors: SettingsErrors;
  disabled: boolean;
  timeZones: string[];
  text: TextFieldProps;
  update: (changes: Partial<EventSettingsForm>) => void;
}

export function DetailsTab({ form, errors, disabled, timeZones, text, update }: DetailsTabProps) {
  return (
    <section className="rounded-3xl bg-card p-7">
      <TextField label="Title" {...text("title")} />

      <div className="mb-4">
        <label htmlFor="type" className={labelClass}>
          Type
        </label>
        <select
          id="type"
          value={form.type}
          onChange={(e) => update({ type: e.target.value as EventSettingsForm["type"] })}
          disabled={disabled}
          className={selectClass}
        >
          {EVENT_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-x-3.5 sm:grid-cols-2">
        <TextField label="Starts" type="datetime-local" {...text("date")} />
        <div className="mb-4">
          <label htmlFor="timezone" className={labelClass}>
            Time zone
          </label>
          <select
            id="timezone"
            value={form.timezone}
            onChange={(e) => update({ timezone: e.target.value })}
            disabled={disabled}
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
          <FieldError id="timezone-error" message={errors.timezone} />
        </div>
      </div>
      <p className="-mt-2 mb-4 text-sm text-slate">
        Changing the zone keeps the times above as typed, on the new zone&apos;s clock.
      </p>

      <TextField label="Venue (optional)" {...text("venueName")} />
      <TextField label="Venue address (optional)" {...text("venueAddress")} />
      <TextField label="RSVP deadline (optional)" type="datetime-local" {...text("rsvpDeadline")} />
    </section>
  );
}
