/**
 * Request schemas for invitation endpoints
 */
import "server-only";
import { z } from "zod";

export const rsvpStatusSchema = z.enum(["pending", "confirmed", "declined", "rescinded"]);

const nameSchema = z.string().trim().min(1).max(200);
const plusOneSchema = z.number().int().min(0).max(50);

// No defaults here, so partial updates never overwrite fields that weren't sent.
// The date and venue belong to the event (T-304); extra fields are ignored
const invitationFields = z.object({
  name: nameSchema,
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

// A scan at the door (T-504): what the QR code contained (the ticket URL or its token) and how
// many people are coming in; without a count, everyone left on the invitation
export const checkInSchema = z.object({
  code: z.string().trim().min(1).max(2000),
  count: z.number().int().min(1).max(51).optional(),
});
