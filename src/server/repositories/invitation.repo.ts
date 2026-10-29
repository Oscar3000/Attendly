/**
 * Invitation repository
 * All Prisma reads and writes for invitations
 * The date and venue come from the invitation's event (T-304)
 */
import "server-only";
import type { Event } from "@prisma/client";
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

export const invitationRepo = {
  // Get all invitations
  async getAllInvitations(): Promise<InviteDetails[]> {
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: withEvent,
    });
    return invitations.map((invitation) => convertToInviteDetails(invitation as Invitation));
  },

  // Get invitation by ID
  async getInvitationById(id: string): Promise<InviteDetails | undefined> {
    const invitation = await prisma.invitation.findUnique({
      where: { id },
      include: withEvent,
    });
    return invitation ? convertToInviteDetails(invitation as Invitation) : undefined;
  },

  // Create new invitation for an event
  async createInvitation(
    event: Pick<Event, "id" | "date" | "venueName" | "venueAddress">,
    invitation: { name: string; status: RsvpStatus; plusOne?: number | undefined },
  ): Promise<InviteDetails> {
    // Create invitation first to get the ID
    const newInvitation = await prisma.invitation.create({
      data: {
        name: invitation.name,
        qrCode: "PLACEHOLDER", // Temporary placeholder
        eventId: event.id,
        // Legacy columns, still NOT NULL until T-312; copied from the event so a rollback works
        eventDate: event.date,
        venue: eventVenueLabel(event),
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

  // Update invitation (the date and venue are changed on the event)
  async updateInvitation(
    id: string,
    // Fields that are missing or undefined are left unchanged
    updates: {
      name?: string | undefined;
      status?: RsvpStatus | undefined;
      plusOne?: number | undefined;
    },
  ): Promise<InviteDetails | undefined> {
    try {
      const updateData: Partial<{
        name: string;
        plusOne: number;
        status: PrismaRsvpStatus;
      }> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.plusOne !== undefined) updateData.plusOne = updates.plusOne;
      if (updates.status !== undefined) updateData.status = convertToPrismaStatus(updates.status);

      const updatedInvitation = await prisma.invitation.update({
        where: { id },
        data: updateData,
        include: withEvent,
      });

      return convertToInviteDetails(updatedInvitation as Invitation);
    } catch (error) {
      console.error("Error updating invitation:", error);
      return undefined;
    }
  },

  // Delete invitation
  async deleteInvitation(id: string): Promise<boolean> {
    try {
      await prisma.invitation.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting invitation:", error);
      return false;
    }
  },

  // Update RSVP status
  async updateRsvpStatus(id: string, status: RsvpStatus): Promise<InviteDetails | undefined> {
    return await invitationRepo.updateInvitation(id, { status });
  },

  // Get admin invitation list with pagination
  async getAdminInvitations(
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
      ? { name: { contains: search.trim(), mode: "insensitive" as const } }
      : {};

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
};
