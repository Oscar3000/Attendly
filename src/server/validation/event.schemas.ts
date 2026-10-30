/**
 * Request schemas for event endpoints
 * Dates arrive as datetime-local values ("2026-05-23T15:00") on the event's wall clock and are
 * converted to UTC using the event's time zone
 */
import "server-only";
import { z } from "zod";
import { colorPaletteSchema, familyLinesSchema } from "@/lib/event-content";
import { isValidTimeZone, zonedTimeToUtc } from "@/lib/timezones";

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Enter a date and time");

// Blank inputs count as "not given"
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

// For a full update: blank or missing inputs clear the field
const clearableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

const optionalLocalDateTime = z
  .union([localDateTime, z.literal("")])
  .optional()
  .transform((value) => value || undefined);

export const eventTypeSchema = z.enum(["WEDDING", "BIRTHDAY", "CORPORATE", "OTHER"]);

const scheduleFields = {
  title: z.string().trim().min(1, "Enter a title").max(200),
  type: eventTypeSchema,
  date: localDateTime,
  timezone: z.string().refine(isValidTimeZone, "Choose a time zone"),
  rsvpDeadline: optionalLocalDateTime,
};

// Wall-clock date and deadline -> UTC in the event's zone; the deadline must come first
function toUtcTimes<
  Fields extends { date: string; timezone: string; rsvpDeadline?: string | undefined },
>({ date, rsvpDeadline, ...fields }: Fields, ctx: z.RefinementCtx) {
  const start = zonedTimeToUtc(date, fields.timezone);
  const deadline = rsvpDeadline ? zonedTimeToUtc(rsvpDeadline, fields.timezone) : undefined;
  if (deadline && deadline > start) {
    ctx.addIssue({
      code: "custom",
      path: ["rsvpDeadline"],
      message: "The RSVP deadline must be before the event starts",
    });
    return z.NEVER;
  }
  return { ...fields, date: start, rsvpDeadline: deadline };
}

export const createEventSchema = z
  .object({
    ...scheduleFields,
    venueName: optionalText(200),
    venueAddress: optionalText(300),
  })
  .transform(toUtcTimes);

// PUT /api/events/[eventId] (T-402): the settings form sends every field, so anything blank or
// missing is cleared. The slug isn't editable: shared links and QR codes point at it
export const updateEventSchema = z
  .object({
    ...scheduleFields,
    venueName: clearableText(200),
    venueAddress: clearableText(300),
    hostNames: clearableText(200),
    headline: clearableText(300),
    tagline: clearableText(300),
    dressCode: clearableText(200),
    notes: clearableText(2000),
    familyLines: familyLinesSchema.default([]),
    colorPalette: colorPaletteSchema.default([]),
  })
  .transform((fields, ctx) => {
    const times = toUtcTimes(fields, ctx);
    return times === z.NEVER ? z.NEVER : { ...times, rsvpDeadline: times.rsvpDeadline ?? null };
  });
