/**
 * Request schemas for invitation endpoints
 */
import "server-only";
import { z } from "zod";

export const rsvpStatusSchema = z.enum(["pending", "confirmed", "declined", "rescinded"]);

// Accepts any string Date can parse, e.g. "2026-05-23T14:00" from datetime-local inputs
const dateSchema = z.string().pipe(z.coerce.date());

const nameSchema = z.string().trim().min(1).max(200);
const venueSchema = z.string().trim().min(1).max(300);
const plusOneSchema = z.number().int().min(0).max(50);

// No defaults here, so partial updates never overwrite fields that weren't sent
const invitationFields = z.object({
  name: nameSchema,
  eventDate: dateSchema,
  venue: venueSchema,
  status: rsvpStatusSchema,
  plusOne: plusOneSchema,
});

export const createInvitationSchema = invitationFields.extend({
  status: rsvpStatusSchema.default("pending"),
  plusOne: plusOneSchema.default(0),
});

export const updateInvitationSchema = invitationFields.partial();

export const updateRsvpStatusSchema = z.object({
  status: rsvpStatusSchema,
});

export const bulkCreateInvitationsSchema = z.object({
  eventDate: dateSchema,
  venue: venueSchema,
  status: rsvpStatusSchema.default("pending"),
  rows: z
    .array(
      z.object({
        // Empty names are reported per row in the response, not rejected up front
        name: z.string().default(""),
        plusOne: plusOneSchema.default(0),
      }),
    )
    .min(1)
    .max(1000),
});

export const adminInvitationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(200).default(""),
});
