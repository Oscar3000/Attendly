/**
 * Simple in-memory database for Attendly
 * In production, this would be replaced with a real database
 */
import type { InviteDetails, AdminMetrics, AdminInvitation, RsvpStatus } from "./types";

// In-memory storage
let invitations: Map<string, InviteDetails> = new Map();
let nextId = 1;

// Initialize with some mock data
const initializeData = () => {
  const mockInvitations: InviteDetails[] = [
    {
      id: "1",
      guestName: "Sarah & John Smith",
      guestEmail: "sarah.smith@example.com",
      qrCode: "QR_CODE_DATA_1",
      eventDate: new Date("2026-05-23T15:00:00"),
      venue: "Canary World, Lagos, Nigeria",
      rsvpStatus: "confirmed",
      plusOne: 2,
      dietaryRestrictions: "Vegetarian",
      message: "We are so excited to celebrate with you!",
      createdAt: new Date("2025-01-15T10:00:00"),
      updatedAt: new Date("2025-01-20T14:30:00"),
    },
    {
      id: "2",
      guestName: "Michael Johnson",
      guestEmail: "michael.johnson@example.com",
      qrCode: "QR_CODE_DATA_2",
      eventDate: new Date("2026-05-23T15:00:00"),
      venue: "Canary World, Lagos, Nigeria",
      rsvpStatus: "pending",
      plusOne: 1,
      dietaryRestrictions: "",
      message: "Looking forward to celebrating!",
      createdAt: new Date("2025-01-10T09:00:00"),
      updatedAt: new Date("2025-01-10T09:00:00"),
    },
    {
      id: "3",
      guestName: "Emily Davis",
      guestEmail: "emily.davis@example.com",
      qrCode: "QR_CODE_DATA_3",
      eventDate: new Date("2026-05-23T15:00:00"),
      venue: "Canary World, Lagos, Nigeria",
      rsvpStatus: "declined",
      plusOne: 0,
      dietaryRestrictions: "",
      message: "Thank you for the invitation!",
      createdAt: new Date("2025-01-12T11:00:00"),
      updatedAt: new Date("2025-01-18T16:45:00"),
    },
    {
      id: "1232",
      guestName: "Test User",
      guestEmail: "test@example.com",
      qrCode: "QR_CODE_DATA_TEST",
      eventDate: new Date("2026-05-23T15:00:00"),
      venue: "Canary World, Lagos, Nigeria",
      rsvpStatus: "pending",
      plusOne: 2,
      dietaryRestrictions: "",
      message: "We are so excited to celebrate with you!",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Populate the map
  mockInvitations.forEach((invitation) => {
    invitations.set(invitation.id, invitation);
  });
  nextId = mockInvitations.length + 1;
};

// Initialize data on module load
initializeData();

export const db = {
  // Get all invitations
  getAllInvitations(): InviteDetails[] {
    return Array.from(invitations.values());
  },

  // Get invitation by ID
  getInvitationById(id: string): InviteDetails | undefined {
    return invitations.get(id);
  },

  // Create new invitation
  createInvitation(
    invitation: Omit<InviteDetails, "id" | "createdAt" | "updatedAt">
  ): InviteDetails {
    const id = nextId.toString();
    nextId++;

    const newInvitation: InviteDetails = {
      ...invitation,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    invitations.set(id, newInvitation);
    return newInvitation;
  },

  // Update invitation
  updateInvitation(
    id: string,
    updates: Partial<Omit<InviteDetails, "id" | "createdAt">>
  ): InviteDetails | undefined {
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
  deleteInvitation(id: string): boolean {
    return invitations.delete(id);
  },

  // Update RSVP status
  updateRsvpStatus(id: string, status: RsvpStatus): InviteDetails | undefined {
    return this.updateInvitation(id, { rsvpStatus: status });
  },

  // Get admin metrics
  getAdminMetrics(): AdminMetrics {
    const allInvitations = this.getAllInvitations();
    const total = allInvitations.length;
    const confirmed = allInvitations.filter((inv) => inv.rsvpStatus === "confirmed").length;
    const pending = allInvitations.filter((inv) => inv.rsvpStatus === "pending").length;
    const declined = allInvitations.filter((inv) => inv.rsvpStatus === "declined").length;

    return {
      totalInvitations: total,
      confirmedRsvps: confirmed,
      pendingRsvps: pending,
      declinedRsvps: declined,
      attendanceRate: total > 0 ? Math.round((confirmed / total) * 100) : 0,
    };
  },

  // Get admin invitation list
  getAdminInvitations(): AdminInvitation[] {
    return this.getAllInvitations().map((invitation) => ({
      id: invitation.id,
      guestName: invitation.guestName,
      email: invitation.guestEmail,
      status: invitation.rsvpStatus,
      plusOne: invitation.plusOne,
      createdAt: invitation.createdAt,
    }));
  },

  // Reset database (useful for testing)
  reset(): void {
    invitations.clear();
    nextId = 1;
    initializeData();
  },
};