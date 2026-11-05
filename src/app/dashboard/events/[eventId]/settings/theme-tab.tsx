import { eventFontVariables } from "@/app/e/[slug]/fonts";
import { THEME_IDS, THEMES, type ThemeId } from "@/lib/themes";
import { formatEventDateShort, zonedTimeToUtc } from "@/lib/timezones";
import { cn } from "@/lib/utils";
import type { EventSettingsForm } from "@/store/eventInvitationApi";
import { FieldError } from "./settings-fields";
import type { SettingsErrors } from "./settings-tabs";

interface ThemeTabProps {
  form: EventSettingsForm;
  errors: SettingsErrors;
  disabled: boolean;
  onChange: (theme: ThemeId) => void;
}

/**
 * Each preset drawn with the event's own title and date, in its real colours and heading font
 */
export function ThemeTab({ form, errors, disabled, onChange }: ThemeTabProps) {
  const date = form.date
    ? formatEventDateShort(zonedTimeToUtc(form.date, form.timezone), form.timezone)
    : undefined;

  return (
    <fieldset className={eventFontVariables}>
      <legend className="mb-3 text-slate">Colours and fonts for your event page.</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEME_IDS.map((id) => {
          const { label, colors, fonts } = THEMES[id];
          return (
            <label
              key={id}
              className={cn(
                "block cursor-pointer overflow-hidden rounded-[22px] border-2 bg-card transition-transform hover:-translate-y-0.5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
                form.theme === id ? "border-ink" : "border-line",
              )}
            >
              <input
                type="radio"
                name="theme"
                value={id}
                checked={form.theme === id}
                onChange={() => onChange(id)}
                disabled={disabled}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className="flex flex-col items-center gap-2 px-4 py-8 text-center"
                style={{ backgroundColor: colors.background, color: colors.ink }}
              >
                <span
                  className="text-[26px] leading-tight font-bold wrap-anywhere"
                  style={{ fontFamily: fonts.heading }}
                >
                  {form.title || "Your event"}
                </span>
                {date && (
                  <span
                    className="rounded-full px-3.5 py-1 text-[13px] font-semibold text-white"
                    style={{ backgroundColor: colors.accent }}
                  >
                    {date}
                  </span>
                )}
              </span>
              <span className="block px-4 py-3 font-semibold">{label}</span>
            </label>
          );
        })}
      </div>
      <FieldError id="theme-error" message={errors.theme} />
    </fieldset>
  );
}
