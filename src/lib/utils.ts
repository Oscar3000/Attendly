/**
 * Utility functions for the Attendly application
 * Following functional programming principles and TypeScript best practices
 */

import QRCode from "qrcode";
import type {
  RsvpStatus,
  PrismaRsvpStatus,
  Invitation,
  InvitationEvent,
  InviteDetails,
} from "./types";

/**
 * Formats a date to a human-readable string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

/**
 * Formats a date to a time string
 * @param date - The date to format
 * @returns Formatted time string (HH:MM AM/PM)
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Combines class names, filtering out falsy values
 * @param classes - Array of class names or conditional classes
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Validates an email address using a standard regex pattern
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats a date to show relative time (e.g., "2 minutes ago", "Yesterday")
 * @param date - The date to format (Date object or string)
 * @returns Human-readable relative time string
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
}

/**
 * Gets the appropriate CSS color class for an RSVP status
 * @param status - The RSVP status string
 * @returns CSS class name for the status color
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "text-green-600";
    case "rescinded":
      return "text-red-600";
    case "pending":
      return "text-yellow-600";
    case "declined":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Gets status color classes with background for table badges
 * @param status - The RSVP status string
 * @returns CSS classes for text and background colors
 */
export function getTableStatusColor(status: string): string {
  const baseColor = getStatusColor(status);
  // Map text colors to background variants for table badges
  switch (status.toLowerCase()) {
    case "confirmed":
      return `${baseColor} bg-green-50`;
    case "rescinded":
      return `${baseColor} bg-red-50`;
    case "pending":
      return `${baseColor} bg-yellow-50`;
    case "declined":
      return `${baseColor} bg-gray-50`;
    default:
      return `${baseColor} bg-gray-50`;
  }
}

/**
 * An absolute URL on this app, for links that leave the site (QR codes, shared links)
 * @param path - Starts with "/"
 */
export function absoluteUrl(path: string): string {
  const rawBase = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const baseUrl = /^https?:\/\//i.test(rawBase) ? rawBase : `https://${rawBase}`;
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

/**
 * Generates QR code data URL for invitation links
 * @param invitationId - The invitation ID to generate QR code for
 * @returns Promise resolving to QR code data URL or placeholder
 */
export async function generateQRCode(invitationId: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(absoluteUrl(`/invite/${invitationId}`), {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return `QR_CODE_PLACEHOLDER_${invitationId}`;
  }
}

/**
 * Convert Prisma enum to our app enum
 * @param status - Prisma RSVP status
 * @returns Application RSVP status
 */
export function convertPrismaStatus(status: PrismaRsvpStatus): RsvpStatus {
  const statusMap: Record<PrismaRsvpStatus, RsvpStatus> = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    DECLINED: "declined",
    RESCINDED: "rescinded",
  };
  return statusMap[status];
}

/**
 * Convert our app enum to Prisma enum
 * @param status - Application RSVP status
 * @returns Prisma RSVP status
 */
export function convertToPrismaStatus(status: RsvpStatus): PrismaRsvpStatus {
  const statusMap: Record<RsvpStatus, PrismaRsvpStatus> = {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    declined: "DECLINED",
    rescinded: "RESCINDED",
  };
  return statusMap[status];
}

/**
 * The one-line venue shown on invitations: the venue's name, else its address
 */
export function eventVenueLabel(event: InvitationEvent): string {
  return event.venueName ?? event.venueAddress ?? "";
}

/**
 * Convert Prisma model to our app type
 * @param invitation - Prisma invitation object
 * @returns Application invitation details
 */
export function convertToInviteDetails(invitation: Invitation): InviteDetails {
  return {
    id: invitation.id,
    name: invitation.name,
    qrCode: invitation.qrCode || "",
    eventId: invitation.eventId,
    eventDate: invitation.event.date,
    eventTimezone: invitation.event.timezone,
    eventType: invitation.event.type,
    venue: eventVenueLabel(invitation.event),
    status: convertPrismaStatus(invitation.status),
    plusOne: invitation.plusOne,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
  };
}
