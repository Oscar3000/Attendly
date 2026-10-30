/**
 * Type definitions for the Attendly application
 * Following TypeScript best practices with proper interfaces
 */

import type { EventType } from "./event-copy";

// Form-related types
export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

export interface LoginForm {
  email: FormField;
  password: FormField;
}

// Wedding attendance types
export interface WeddingInvitation {
  readonly id: string;
  name: string;
  qrCode: string;
  eventId: string;
  // From the invitation's event (T-304), not stored per invitation
  eventDate: Date;
  // The event's IANA zone: show eventDate on this clock, not the viewer's
  eventTimezone: string;
  // Picks the default wording (src/lib/event-copy.ts)
  eventType: EventType;
  venue: string;
  status: RsvpStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type RsvpStatus = "pending" | "confirmed" | "declined" | "rescinded";

export interface QrScanResult {
  success: boolean;
  invitationId?: string;
  guestName?: string;
  error?: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "danger" | "attendly";
  size?: "sm" | "md" | "lg" | "custom";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  // Custom styling props for attendly variant
  width?: string | number;
  height?: string | number;
  fontSize?: string | number;
  fontWeight?: string | number;
  borderRadius?: string | number;
  backgroundColor?: string;
  textColor?: string;
}

// Invite page types
export interface InvitePageProps {
  params: Promise<{
    id: string;
  }>;
}

export interface InviteDetails extends WeddingInvitation {
  plusOne?: number;
}

// Admin dashboard types
export interface DashboardMetrics {
  totalInvitations: number;
  totalGuests: number;
  pendingCount: number;
  confirmedCount: number;
  rescindedCount: number;
}

export interface StatusUpdate {
  id: string;
  name: string;
  status: RsvpStatus;
  timestamp: Date;
}

export interface InvitationTableEntry {
  id: string;
  name: string;
  // From the invitation's event
  eventDate: Date;
  venue: string;
  status: RsvpStatus;
  hasQrCode: boolean;
  qrCode?: string | undefined;
  plusOne: number;
  createdAt: Date;
  updatedAt: Date;
}

// Invitation form types (date and venue belong to the event)
export interface CreateInviteForm {
  name: string;
  status: RsvpStatus;
  plusOne: number;
}

export interface EditInviteForm extends CreateInviteForm {
  id: string;
}

// Admin metrics interface
export interface AdminMetrics {
  totalInvitations: number;
  totalGuests: number;
  confirmedRsvps: number;
  pendingRsvps: number;
  declinedRsvps: number;
  attendanceRate: number;
}

// Prisma enum types
export type PrismaRsvpStatus = "PENDING" | "CONFIRMED" | "DECLINED" | "RESCINDED";

// The event fields an invitation displays
export interface InvitationEvent {
  date: Date;
  timezone: string;
  type: EventType;
  venueName: string | null;
  venueAddress: string | null;
}

// An invitation row as the repository reads it: with its event, not the legacy date/venue columns
export interface Invitation {
  id: string;
  name: string;
  status: PrismaRsvpStatus;
  qrCode: string | null;
  plusOne: number;
  eventId: string;
  event: InvitationEvent;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusUpdateSelect {
  id: string;
  name: string;
  status: string;
  updatedAt: Date;
}
