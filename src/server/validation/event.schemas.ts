/**
 * Request schemas for event endpoints
 * Dates arrive as datetime-local values ("2026-05-23T15:00") on the event's wall clock and are
 * converted to UTC using the event's time zone
 */
import "server-only";
import { z } from "zod";
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

export const eventTypeSchema = z.enum(["WEDDING", "BIRTHDAY", "CORPORATE", "OTHER"]);

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a title").max(200),
    type: eventTypeSchema,
    date: localDateTime,
    timezone: z.string().refine(isValidTimeZone, "Choose a time zone"),
    venueName: optionalText(200),
    venueAddress: optionalText(300),
    rsvpDeadline: z
      .union([localDateTime, z.literal("")])
      .optional()
      .transform((value) => value || undefined),
  })
  .transform(({ date, rsvpDeadline, ...fields }, ctx) => {
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
  });
