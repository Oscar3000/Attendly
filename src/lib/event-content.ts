/**
 * Shapes of an event's JSON content fields (familyLines, colorPalette)
 * Shared by the repository (parsing stored rows), the settings form (T-402) and the event page (T-403)
 */
import { z } from "zod";

// One family on the invitation, e.g. "Chief & Lolo Livinus Umeh" with a title line under it
export const familyLineSchema = z.object({
  name: z.string().trim().min(1).max(200),
  detail: z
    .string()
    .trim()
    .max(200)
    .transform((value) => value || undefined)
    .optional(),
});

// One of the colours of the day, e.g. { name: "Gold", hex: "#D4AF37" }
export const paletteColorSchema = z.object({
  name: z.string().trim().min(1).max(50),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a colour like #C07A54"),
});

export const familyLinesSchema = z.array(familyLineSchema).max(10);
export const colorPaletteSchema = z.array(paletteColorSchema).max(8);

export type FamilyLine = z.infer<typeof familyLineSchema>;
export type PaletteColor = z.infer<typeof paletteColorSchema>;
