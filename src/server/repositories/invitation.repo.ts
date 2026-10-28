/**
 * Invitation repository
 * All Prisma reads and writes for invitations
 */
import 'server-only';
import { prisma } from '@/server/db/client';
import type {
  InviteDetails,
  InvitationTableEntry,
  RsvpStatus,
  PrismaRsvpStatus,
  Invitation,
  InvitationSelect,
} from "@/lib/types";
import {
  generateQRCode,
  convertPrismaStatus,
  convertToPrismaStatus,
  convertToInviteDetails
} from "@/lib/utils";

export const invitationRepo = {
  // Get all invitations
  async getAllInvitations(): Promise<InviteDetails[]> {
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return invitations.map((invitation: InvitationSelect) => convertToInviteDetails(invitation as Invitation));
  },

  // Get invitation by ID
  async getInvitationById(id: string): Promise<InviteDetails | undefined> {
    const invitation = await prisma.invitation.findUnique({
      where: { id }
    });
    return invitation ? convertToInviteDetails(invitation as Invitation) : undefined;
  },

  // Create new invitation
  async createInvitation(
    invitation: Omit<InviteDetails, "id" | "qrCode" | "createdAt" | "updatedAt">,
  ): Promise<InviteDetails> {
    // Create invitation first to get the ID
    const newInvitation = await prisma.invitation.create({
      data: {
        name: invitation.name,
        qrCode: 'PLACEHOLDER', // Temporary placeholder
        eventDate: invitation.eventDate,
        venue: invitation.venue,
        status: convertToPrismaStatus(invitation.status),
        plusOne: invitation.plusOne ?? 0,
      }
    });

    // Generate QR code with the actual ID
    const qrCode = await generateQRCode(newInvitation.id);

    // Update invitation with the real QR code
    const updatedInvitation = await prisma.invitation.update({
      where: { id: newInvitation.id },
      data: { qrCode }
    });

    return convertToInviteDetails(updatedInvitation as Invitation);
  },

  // Update invitation
  async updateInvitation(
    id: string,
    // Fields that are missing or undefined are left unchanged
    updates: { [K in keyof Omit<InviteDetails, "id" | "createdAt">]?: InviteDetails[K] | undefined },
  ): Promise<InviteDetails | undefined> {
    try {
      const updateData: Partial<{
        name: string;
        venue: string;
        eventDate: Date;
        plusOne: number;
        status: PrismaRsvpStatus;
      }> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.venue !== undefined) updateData.venue = updates.venue;
      if (updates.eventDate !== undefined) updateData.eventDate = updates.eventDate;
      if (updates.plusOne !== undefined) updateData.plusOne = updates.plusOne;
      if (updates.status !== undefined) updateData.status = convertToPrismaStatus(updates.status);

      const updatedInvitation = await prisma.invitation.update({
        where: { id },
        data: updateData
      });

      return convertToInviteDetails(updatedInvitation as Invitation);
    } catch (error) {
      console.error('Error updating invitation:', error);
      return undefined;
    }
  },

  // Delete invitation
  async deleteInvitation(id: string): Promise<boolean> {
    try {
      await prisma.invitation.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      return false;
    }
  },

  // Update RSVP status
  async updateRsvpStatus(id: string, status: RsvpStatus): Promise<InviteDetails | undefined> {
    return await invitationRepo.updateInvitation(id, { status });
  },

  // Get admin invitation list with pagination
  async getAdminInvitations(page: number = 1, limit: number = 10, search: string = ''): Promise<{
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
      ? { name: { contains: search.trim(), mode: 'insensitive' as const } }
      : {};

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          qrCode: true,
          eventDate: true,
          venue: true,
          plusOne: true,
        }
      }),
      prisma.invitation.count({ where })
    ]);

    return {
      invitations: invitations.map((invitation: InvitationSelect) => ({
        id: invitation.id,
        name: invitation.name,
        eventDate: invitation.eventDate,
        venue: invitation.venue,
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
      }
    };
  },
};
