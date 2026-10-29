/**
 * Invitation repository
 * All Prisma reads and writes for invitations
 * Every query is scoped to one event (T-306): an invitation in another event behaves exactly
 * like a missing one. The only exceptions are the two *ForGuest functions at the end
 * The date and venue come from the invitation's event (T-304)
 */
import "server-only";
import { Prisma, type Event } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type {
  InviteDetails,
  InvitationTableEntry,
  RsvpStatus,
  PrismaRsvpStatus,
  Invitation,
} from "@/lib/types";
import {
  generateQRCode,
  convertPrismaStatus,
  convertToPrismaStatus,
  convertToInviteDetails,
  eventVenueLabel,
} from "@/lib/utils";

// Joined on every read so callers get the event's date and venue
const withEvent = {
  event: { select: { date: true, venueName: true, venueAddress: true } },
} as const;

// Prisma's "record to update/delete does not exist" (including a match on id but not eventId)
const isNotFound = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

export interface BulkCreateResult {
  created: { row: number; name: string; id: string }[];
  failed: { row: number; name: string; error: string }[];
  summary: { total: number; createdCount: number; failedCount: number };
}

type InvitationUpdates = {
  name?: string | undefined;
  status?: RsvpStatus | undefined;
  plusOne?: number | undefined;
};

// Shared by the scoped and guest updates. The date and venue are changed on the event
async function update(
  where: Prisma.InvitationWhereUniqueInput,
  updates: InvitationUpdates,
): Promise<InviteDetails | undefined> {
  const data: Partial<{ name: string; plusOne: number; status: PrismaRsvpStatus }> = {};
  if (updates.name !== undefined) data.name = updates.name;
  if (updates.plusOne !== undefined) data.plusOne = updates.plusOne;
  if (updates.status !== undefined) data.status = convertToPrismaStatus(updates.status);

  try {
    const updated = await prisma.invitation.update({ where, data, include: withEvent });
    return convertToInviteDetails(updated as Invitation);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

export const invitationRepo = {
  // Get all invitations in an event
  async getAllInvitations(eventId: string): Promise<InviteDetails[]> {
    const invitations = await prisma.invitation.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: withEvent,
    });
    return invitations.map((invitation) => convertToInviteDetails(invitation as Invitation));
  },

  // Get an invitation by ID within an event
  async getInvitationById(eventId: string, id: string): Promise<InviteDetails | undefined> {
    const invitation = await prisma.invitation.findUnique({
      where: { id, eventId },
      include: withEvent,
    });
    return invitation ? convertToInviteDetails(invitation as Invitation) : undefined;
  },

  // Create new invitation for an event
  async createInvitation(
    event: Pick<Event, "id">,
    invitation: { name: string; status: RsvpStatus; plusOne?: number | undefined },
  ): Promise<InviteDetails> {
    // Create invitation first to get the ID
    const newInvitation = await prisma.invitation.create({
      data: {
        name: invitation.name,
        qrCode: "PLACEHOLDER", // Temporary placeholder
        eventId: event.id,
        status: convertToPrismaStatus(invitation.status),
        plusOne: invitation.plusOne ?? 0,
      },
    });

    // Generate QR code with the actual ID
    const qrCode = await generateQRCode(newInvitation.id);

    // Update invitation with the real QR code
    const updatedInvitation = await prisma.invitation.update({
      where: { id: newInvitation.id },
      data: { qrCode },
      include: withEvent,
    });

    return convertToInviteDetails(updatedInvitation as Invitation);
  },

  // Create many invitations in an event. Each row succeeds or fails on its own; rows with an
  // empty name are reported, not created
  async createInvitations(
    event: Pick<Event, "id" | "date" | "venueName" | "venueAddress">,
    status: RsvpStatus,
    rows: { name: string; plusOne?: number | undefined }[],
  ): Promise<BulkCreateResult> {
    const created: BulkCreateResult["created"] = [];
    const failed: BulkCreateResult["failed"] = [];

    for (const [index, row] of rows.entries()) {
      const rowNum = index + 1;
      const name = row.name.trim();
      if (!name) {
        failed.push({ row: rowNum, name: row.name, error: "Name is required" });
        continue;
      }
      try {
        const invite = await invitationRepo.createInvitation(event, {
          name,
          status,
          plusOne: row.plusOne,
        });
        created.push({ row: rowNum, name, id: invite.id });
      } catch (err) {
        failed.push({
          row: rowNum,
          name,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return {
      created,
      failed,
      summary: { total: rows.length, createdCount: created.length, failedCount: failed.length },
    };
  },

  // Update an invitation within an event. Missing or undefined fields are left unchanged
  async updateInvitation(
    eventId: string,
    id: string,
    updates: InvitationUpdates,
  ): Promise<InviteDetails | undefined> {
    return update({ id, eventId }, updates);
  },

  // Delete an invitation within an event
  async deleteInvitation(eventId: string, id: string): Promise<boolean> {
    try {
      await prisma.invitation.delete({ where: { id, eventId } });
      return true;
    } catch (error) {
      if (isNotFound(error)) return false;
      throw error;
    }
  },

  // Update the RSVP status of an invitation within an event
  async updateRsvpStatus(
    eventId: string,
    id: string,
    status: RsvpStatus,
  ): Promise<InviteDetails | undefined> {
    return update({ id, eventId }, { status });
  },

  // Get an event's invitation list with pagination
  async getAdminInvitations(
    eventId: string,
    page: number = 1,
    limit: number = 10,
    search: string = "",
  ): Promise<{
    invitations: InvitationTableEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;
    const where = search.trim()
      ? { eventId, name: { contains: search.trim(), mode: "insensitive" as const } }
      : { eventId };

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          qrCode: true,
          plusOne: true,
          ...withEvent,
        },
      }),
      prisma.invitation.count({ where }),
    ]);

    return {
      invitations: invitations.map((invitation) => ({
        id: invitation.id,
        name: invitation.name,
        eventDate: invitation.event.date,
        venue: eventVenueLabel(invitation.event),
        status: convertPrismaStatus(invitation.status as PrismaRsvpStatus),
        hasQrCode: Boolean(invitation.qrCode),
        qrCode: invitation.qrCode ?? undefined,
        plusOne: invitation.plusOne,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /*
   * Guest (shared PIN) access, by invitation id alone: the PIN isn't tied to an event, and the
   * id in the guest's link is what identifies their invitation. Only for the guest branch of
   * GET/PATCH /api/invitations/[id]; removed with the PIN flow in T-505
   */
  async getInvitationForGuest(id: string): Promise<InviteDetails | undefined> {
    const invitation = await prisma.invitation.findUnique({ where: { id }, include: withEvent });
    return invitation ? convertToInviteDetails(invitation as Invitation) : undefined;
  },

  async updateRsvpStatusForGuest(
    id: string,
    status: RsvpStatus,
  ): Promise<InviteDetails | undefined> {
    return update({ id }, { status });
  },
};
