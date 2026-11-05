/**
 * Create an event with a slug generated from its title (the public URL segment, /e/[slug])
 * "Pamela & Oscar" -> pamela-and-oscar; a taken slug gets -2, -3, ...
 */
import "server-only";
import { Prisma } from "@prisma/client";
import { slugify } from "@/lib/slug";
import { eventRepo, type Event, type EventInput } from "@/server/repositories/event.repo";

const NUMBERED_ATTEMPTS = 20;

// Another event already has this slug (the unique index on events.slug)
const isSlugTaken = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002" &&
  JSON.stringify(error.meta?.target ?? "").includes("slug");

// Retrying on the unique index (instead of checking first) is safe when two hosts create
// events with the same title at the same moment
export async function createEvent(
  ownerId: string,
  input: Omit<EventInput, "slug">,
): Promise<Event> {
  const base = slugify(input.title);
  for (let attempt = 1; attempt <= NUMBERED_ATTEMPTS; attempt++) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    try {
      return await eventRepo.create(ownerId, { ...input, slug });
    } catch (error) {
      if (!isSlugTaken(error)) throw error;
    }
  }
  // Very common title: fall back to a random suffix
  const suffix = crypto.randomUUID().slice(0, 8);
  return eventRepo.create(ownerId, { ...input, slug: `${base}-${suffix}` });
}
