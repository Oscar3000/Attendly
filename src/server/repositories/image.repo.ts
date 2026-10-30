/**
 * Image repository (T-406)
 * Event images live in the database; an event's cover is the image its coverImageUrl points at.
 * Ownership checks live in the callers
 */
import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

// The event is gone: its row (P2025) or the image's foreign key to it (P2003)
const isMissingEvent = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  (error.code === "P2025" || error.code === "P2003");

export const imageRepo = {
  /**
   * Store an image and make it the event's cover, deleting the event's other images, in one
   * transaction. `toUrl` turns the new image's id into the URL stored on the event.
   * Undefined if the event doesn't exist
   */
  async replaceCover(
    eventId: string,
    image: { bytes: Buffer; contentType: string },
    toUrl: (id: string) => string,
  ): Promise<string | undefined> {
    try {
      return await prisma.$transaction(async (tx) => {
        const { id } = await tx.eventImage.create({
          data: { eventId, ...image },
          select: { id: true },
        });
        const url = toUrl(id);
        await tx.event.update({ where: { id: eventId }, data: { coverImageUrl: url } });
        await tx.eventImage.deleteMany({ where: { eventId, id: { not: id } } });
        return url;
      });
    } catch (error) {
      if (isMissingEvent(error)) return undefined;
      throw error;
    }
  },

  // Clear the event's cover and delete its images; false if the event doesn't exist
  async removeCover(eventId: string): Promise<boolean> {
    try {
      await prisma.$transaction([
        prisma.event.update({ where: { id: eventId }, data: { coverImageUrl: null } }),
        prisma.eventImage.deleteMany({ where: { eventId } }),
      ]);
      return true;
    } catch (error) {
      if (isMissingEvent(error)) return false;
      throw error;
    }
  },

  async findById(id: string): Promise<{ bytes: Buffer; contentType: string } | undefined> {
    const image = await prisma.eventImage.findUnique({
      where: { id },
      select: { bytes: true, contentType: true },
    });
    return image ?? undefined;
  },
};
