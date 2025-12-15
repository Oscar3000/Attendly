/**
 * Simple in-memory database for Attendly
 * In production, this would be replaced with a real database
 */
import type {
  InviteDetails,
  AdminMetrics,
  RsvpStatus,
  InvitationTableEntry,
} from "./types";
import QRCode from "qrcode";

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

// In-memory storage
const invitations: Map<string, InviteDetails> = new Map();
let nextId = 1;
let initialized = false;

// Initialize with some mock data
const initializeData = async () => {
  const mockInvitationsData = [
    {
      id: "1",
      name: "Sarah & John Smith",
      eventDate: new Date("2026-05-23T15:00:00"),
      venue: "Canary World, Lagos, Nigeria",
      status: "confirmed" as RsvpStatus,
      plusOne: 2,
      createdAt: new Date("2025-01-15T10:00:00"),
      updatedAt: new Date("2025-01-20T14:30:00"),
    },
    {
      id: "2",
      name: "Michael Johnson",
      eventDate: new Date("2026-05-23T15:00:00"),
      venue: "Canary World, Lagos, Nigeria",
      status: "pending" as RsvpStatus,
      plusOne: 1,
      createdAt: new Date("2025-01-10T09:00:00"),
      updatedAt: new Date("2025-01-10T09:00:00"),
    },
    {
      id: "3",
      name: "Emily Davis",
      eventDate: new Date("2026-05-23T15:00:00"),
      venue: "Canary World, Lagos, Nigeria",
      status: "declined" as RsvpStatus,
      plusOne: 0,
      createdAt: new Date("2025-01-12T11:00:00"),
      updatedAt: new Date("2025-01-18T16:45:00"),
    },
    {
      id: "1232",
      name: "Test User",
      eventDate: new Date("2026-05-23T15:00:00"),
      venue: "Canary World, Lagos, Nigeria",
      status: "pending" as RsvpStatus,
      plusOne: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Generate QR codes for each invitation and populate the map
  for (const invitationData of mockInvitationsData) {
    const qrCode = await generateQRCode(invitationData.id);
    const invitation: InviteDetails = {
      ...invitationData,
      qrCode
    };
    invitations.set(invitation.id, invitation);
  }
  
  nextId = mockInvitationsData.length + 1;
};

// Ensure initialization happens before any operations
const ensureInitialized = async () => {
  if (!initialized) {
    await initializeData();
    initialized = true;
  }
};

export const db = {
  // Get all invitations
  async getAllInvitations(): Promise<InviteDetails[]> {
    await ensureInitialized();
    return Array.from(invitations.values());
  },

  // Get invitation by ID
  async getInvitationById(id: string): Promise<InviteDetails | undefined> {
    await ensureInitialized();
    return invitations.get(id);
  },

  // Create new invitation
  async createInvitation(
    invitation: Omit<InviteDetails, "id" | "qrCode" | "createdAt" | "updatedAt">,
  ): Promise<InviteDetails> {
    await ensureInitialized();
    const id = nextId.toString();
    nextId++;

    // Generate QR code for the invitation URL
    const qrCode = await generateQRCode(id);

    const newInvitation: InviteDetails = {
      ...invitation,
      id,
      qrCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    invitations.set(id, newInvitation);
    return newInvitation;
  },

  // Update invitation
  async updateInvitation(
    id: string,
    updates: Partial<Omit<InviteDetails, "id" | "createdAt">>,
  ): Promise<InviteDetails | undefined> {
    await ensureInitialized();
    const existing = invitations.get(id);
    if (!existing) return undefined;

    const updated: InviteDetails = {
      ...existing,
      ...updates,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };

    invitations.set(id, updated);
    return updated;
  },

  // Delete invitation
  async deleteInvitation(id: string): Promise<boolean> {
    await ensureInitialized();
    return invitations.delete(id);
  },

  // Update RSVP status
  async updateRsvpStatus(id: string, status: RsvpStatus): Promise<InviteDetails | undefined> {
    return await this.updateInvitation(id, { status: status });
  },

  // Get admin metrics
  async getAdminMetrics(): Promise<AdminMetrics> {
    await ensureInitialized();
    const allInvitations = await this.getAllInvitations();
    const total = allInvitations.length;
    const confirmed = allInvitations.filter(
      (inv) => inv.status === "confirmed",
    ).length;
    const pending = allInvitations.filter(
      (inv) => inv.status === "pending",
    ).length;
    const declined = allInvitations.filter(
      (inv) => inv.status === "declined",
    ).length;

    return {
      totalInvitations: total,
      confirmedRsvps: confirmed,
      pendingRsvps: pending,
      declinedRsvps: declined,
      attendanceRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  },

  // Get admin invitation list
  async getAdminInvitations(): Promise<InvitationTableEntry[]> {
    const allInvitations = await this.getAllInvitations();
    return allInvitations.map((invitation) => ({
      id: invitation.id,
      name: invitation.name,
      status: invitation.status,
      createdAt: invitation.createdAt,
      qrCode: invitation.qrCode,
    }));
  },

  // Reset database (useful for testing)
  reset(): void {
    invitations.clear();
    nextId = 1;
    initializeData();
  },
};
