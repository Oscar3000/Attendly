/**
 * Database service using Prisma ORM for PostgreSQL
 * Replaces the in-memory database with persistent storage
 */
import { PrismaClient } from '@prisma/client';
import type {
  InviteDetails,
  AdminMetrics,
  InvitationTableEntry,
  RsvpStatus,
  StatusUpdate,
  PrismaRsvpStatus,
  Invitation,
  InvitationSelect,
  StatusUpdateSelect,
} from "./types";
import QRCode from "qrcode";

// Global type for Prisma singleton
declare global {
  var prisma: PrismaClient | undefined;
}

// Singleton pattern for Prisma client
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances during development
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// Utility function to generate QR code data URL
async function generateQRCode(invitationId: string): Promise<string> {
  try {
    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${invitationId}`;
    const qrCodeDataURL = await QRCode.toDataURL(inviteUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return `QR_CODE_PLACEHOLDER_${invitationId}`;
  }
}



// Convert Prisma enum to our app enum
function convertPrismaStatus(status: PrismaRsvpStatus): RsvpStatus {
  const statusMap: Record<PrismaRsvpStatus, RsvpStatus> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    DECLINED: 'declined',
    RESCINDED: 'rescinded'
  };
  return statusMap[status];
}

// Convert our app enum to Prisma enum
function convertToToPrismaStatus(status: RsvpStatus): PrismaRsvpStatus {
  const statusMap: Record<RsvpStatus, PrismaRsvpStatus> = {
    'pending': 'PENDING',
    'confirmed': 'CONFIRMED',
    'declined': 'DECLINED',
    'rescinded': 'RESCINDED'
  };
  return statusMap[status];
}

// Convert Prisma model to our app type
function convertToInviteDetails(invitation: Invitation): InviteDetails {
  return {
    id: invitation.id,
    name: invitation.name,
    qrCode: invitation.qrCode || "",
    eventDate: invitation.eventDate,
    venue: invitation.venue,
    status: convertPrismaStatus(invitation.status),
    plusOne: invitation.plusOne,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
  };
}

export const db = {
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
        status: convertToToPrismaStatus(invitation.status),
        plusOne: invitation.plusOne,
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
    updates: Partial<Omit<InviteDetails, "id" | "createdAt">>,
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
      if (updates.status !== undefined) updateData.status = convertToToPrismaStatus(updates.status);

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
    return await this.updateInvitation(id, { status });
  },

  // Get admin metrics
  async getAdminMetrics(): Promise<AdminMetrics> {
    const [total, confirmed, pending, declined] = await Promise.all([
      prisma.invitation.count(),
      prisma.invitation.count({ where: { status: 'CONFIRMED' } }),
      prisma.invitation.count({ where: { status: 'PENDING' } }),
      prisma.invitation.count({ where: { status: 'DECLINED' } })
    ]);

    return {
      totalInvitations: total,
      confirmedRsvps: confirmed,
      pendingRsvps: pending,
      declinedRsvps: declined,
      attendanceRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  },

  // Get recent status updates (last 5 invitations with recent updates)
  async getRecentStatusUpdates(): Promise<StatusUpdate[]> {
    const recentUpdates = await prisma.invitation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
      }
    });

    return recentUpdates.map((invitation: StatusUpdateSelect) => ({
      id: invitation.id,
      name: invitation.name,
      status: convertPrismaStatus(invitation.status as PrismaRsvpStatus),
      timestamp: invitation.updatedAt,
    }));
  },

  // Get admin invitation list
  async getAdminInvitations(): Promise<InvitationTableEntry[]> {
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
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
    });

    return invitations.map((invitation: InvitationSelect) => ({
      id: invitation.id,
      name: invitation.name,
      eventDate: invitation.eventDate,
      venue: invitation.venue,
      status: convertPrismaStatus(invitation.status as PrismaRsvpStatus),
      hasQrCode: Boolean(invitation.qrCode),
      qrCode: invitation.qrCode || undefined,
      plusOne: invitation.plusOne,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    }));
  },

  // Reset database (useful for testing)
  async reset(): Promise<void> {
    await prisma.invitation.deleteMany();
  },

  // Disconnect from database
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
};

export { prisma };