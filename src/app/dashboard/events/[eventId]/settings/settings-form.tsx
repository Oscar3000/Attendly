"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/auth/auth-card";
import { fieldErrorsFrom } from "@/components/events/event-form";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useUpdateEventMutation, type EventSettingsForm } from "@/store/eventInvitationApi";
import { DetailsTab } from "./details-tab";
import { InvitationPageTab } from "./invitation-page-tab";
import {
  firstTabWithError,
  SETTINGS_TABS,
  tabHasError,
  type SettingsErrors,
  type SettingsTab,
} from "./settings-tabs";
import { ThemeTab } from "./theme-tab";

type TextFieldName = Exclude<
  keyof EventSettingsForm,
  "familyLines" | "colorPalette" | "type" | "theme"
>;

// What a text field in any tab needs, by field name
export type TextFieldProps = (field: TextFieldName) => {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  error: string | undefined;
};

interface SettingsFormProps {
  eventId: string;
  initial: EventSettingsForm;
  coverImageUrl: string | null;
  timeZones: string[];
}

/**
 * Every field of an event in three tabs with one Save. Hidden tabs stay mounted, so nothing is
 * lost switching between them, including the cover image, which keeps its own state
 */
export default function SettingsForm({
  eventId,
  initial,
  coverImageUrl,
  timeZones,
}: SettingsFormProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>("details");
  const [form, setForm] = useState<EventSettingsForm>(initial);
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [formError, setFormError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [updateEvent, { isLoading }] = useUpdateEventMutation();
  const formElement = useRef<HTMLFormElement>(null);

  // Editing a field clears its error, so it doesn't complain about something already fixed
  const update = (changes: Partial<EventSettingsForm>) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, ...changes }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const field of Object.keys(changes)) delete next[field as keyof EventSettingsForm];
      return next;
    });
  };
  const text: TextFieldProps = (field) => ({
    id: field,
    value: form[field],
    onChange: (e) => update({ [field]: e.target.value }),
    disabled: isLoading,
    error: errors[field],
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
      if (fieldErrors) {
        setErrors(fieldErrors);
        setTab(firstTabWithError(fieldErrors) ?? tab);
        // Once that tab shows: the field may be below the fold, out of sight
        requestAnimationFrame(() =>
          formElement.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        );
      } else setFormError("Couldn't save the settings. Please try again.");
    }
  };

  return (
    <main className="px-6 pt-6 pb-18">
      <form
        ref={formElement}
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        // The scroll margin keeps a focused field clear of the sticky Save bar
        className="mx-auto flex max-w-[760px] flex-col gap-4 [&_input]:scroll-mb-28 [&_select]:scroll-mb-28"
      >
        <SegmentedControl
          label="Settings section"
          options={SETTINGS_TABS.map((option) => ({
            ...option,
            invalid: tabHasError(option.value, errors),
          }))}
          value={tab}
          onChange={setTab}
          className="flex"
        />

        <div hidden={tab !== "details"}>
          <DetailsTab
            form={form}
            errors={errors}
            disabled={isLoading}
            timeZones={timeZones}
            text={text}
            update={update}
          />
        </div>
        <div hidden={tab !== "page"}>
          <InvitationPageTab
            eventId={eventId}
            coverImageUrl={coverImageUrl}
            form={form}
            errors={errors}
            disabled={isLoading}
            text={text}
            update={update}
          />
        </div>
        <div hidden={tab !== "theme"}>
          <ThemeTab
            form={form}
            errors={errors}
            disabled={isLoading}
            onChange={(theme) => update({ theme })}
          />
        </div>

        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-end gap-3 bg-paper px-1 py-3">
          <div className="min-w-0 flex-1 [&>div]:mb-0">
            <FormError message={formError} />
          </div>
          <span role="status" className="font-medium">
            {saved && "Settings saved."}
          </span>
          <Button type="submit" loading={isLoading}>
            Save settings
          </Button>
        </div>
      </form>
    </main>
  );
}
