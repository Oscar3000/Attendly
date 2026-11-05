import type { EventSettingsForm } from "@/store/eventInvitationApi";

export const SETTINGS_TABS = [
  { value: "details", label: "Details" },
  { value: "page", label: "Invitation page" },
  { value: "theme", label: "Theme" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["value"];
export type SettingsErrors = Partial<Record<keyof EventSettingsForm, string>>;

const TAB_FIELDS: Record<SettingsTab, (keyof EventSettingsForm)[]> = {
  details: ["title", "type", "date", "timezone", "venueName", "venueAddress", "rsvpDeadline"],
  page: ["hostNames", "headline", "tagline", "familyLines", "dressCode", "colorPalette", "notes"],
  theme: ["theme"],
};

export const tabHasError = (tab: SettingsTab, errors: SettingsErrors) =>
  TAB_FIELDS[tab].some((field) => errors[field]);

// The first tab with something to fix, to show after the server rejects a save
export const firstTabWithError = (errors: SettingsErrors) =>
  SETTINGS_TABS.find(({ value }) => tabHasError(value, errors))?.value;
