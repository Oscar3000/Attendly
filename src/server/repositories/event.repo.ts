/**
 * Event repository
 * All Prisma reads and writes for events. Ownership checks live in the callers (T-305)
 */
import "server-only";
import { Prisma, type Event as EventRow, type EventType } from "@prisma/client";
import { prisma } from "@/server/db/client";
import {
  colorPaletteSchema,
  familyLinesSchema,
  type FamilyLine,
  type PaletteColor,
} from "@/lib/event-content";

export type { EventType };

// A row with its JSON content fields typed
export type Event = Omit<EventRow, "familyLines" | "colorPalette"> & {
  familyLines: FamilyLine[];
  colorPalette: PaletteColor[];
};

// Fields a host sets; id, ownerId and timestamps are managed here
export interface EventInput {
  slug: string;
  type: EventType;
  title: string;
  date: Date;
  timezone: string;
  venueName?: string | null | undefined;
  venueAddress?: string | null | undefined;
  rsvpDeadline?: Date | null | undefined;
  // Event page content (T-401); an empty list clears familyLines / colorPalette
  hostNames?: string | null | undefined;
  headline?: string | null | undefined;
  tagline?: string | null | undefined;
  familyLines?: FamilyLine[] | undefined;
  dressCode?: string | null | undefined;
  colorPalette?: PaletteColor[] | undefined;
  coverImageUrl?: string | null | undefined;
  notes?: string | null | undefined;
}

// Any subset of the fields; undefined (or missing) leaves a field unchanged
export type EventUpdate = { [K in keyof EventInput]?: EventInput[K] | undefined };

// Prisma rejects explicit undefined fields, but parsed request bodies often contain them
type Defined<T> = { [K in keyof T]: Exclude<T[K], undefined> };
const withoutUndefined = <T extends object>(fields: T) =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Defined<T>;

// Prisma's "record to update/delete does not exist"; other errors are real failures
const isNotFound = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

// Rows are only written through this repository, but a hand-edited value (Prisma Studio, SQL)
// shouldn't take the event page down, so content that doesn't parse reads as empty
const toEvent = (row: EventRow): Event => ({
  ...row,
  familyLines: familyLinesSchema.catch([]).parse(row.familyLines),
  colorPalette: colorPaletteSchema.catch([]).parse(row.colorPalette),
});

export const eventRepo = {
  async create(ownerId: string, input: EventInput): Promise<Event> {
    return toEvent(await prisma.event.create({ data: { ...withoutUndefined(input), ownerId } }));
  },

  async findById(id: string): Promise<Event | undefined> {
    const row = await prisma.event.findUnique({ where: { id } });
    return row ? toEvent(row) : undefined;
  },

  async findBySlug(slug: string): Promise<Event | undefined> {
    const row = await prisma.event.findUnique({ where: { slug } });
    return row ? toEvent(row) : undefined;
  },

  // Soonest first
  async listByOwner(ownerId: string): Promise<Event[]> {
    const rows = await prisma.event.findMany({ where: { ownerId }, orderBy: { date: "asc" } });
    return rows.map(toEvent);
  },

  // Fields that are missing or undefined are left unchanged; null clears an optional field
  async update(id: string, updates: EventUpdate): Promise<Event | undefined> {
    try {
      return toEvent(await prisma.event.update({ where: { id }, data: withoutUndefined(updates) }));
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.event.delete({ where: { id } });
      return true;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  },
};
