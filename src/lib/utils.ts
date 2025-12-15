/**
 * Utility functions for the Attendly application
 * Following functional programming principles and TypeScript best practices
 */

import type { AttendanceStatus } from "./types";

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
 * Gets the display color for an attendance status
 * @param status - The attendance status
 * @returns Tailwind color class
 */
export function getAttendanceStatusColor(status: AttendanceStatus): string {
  const statusColors: Record<AttendanceStatus, string> = {
    present: "text-green-600 bg-green-50",
    absent: "text-red-600 bg-red-50",
    late: "text-yellow-600 bg-yellow-50",
    excused: "text-blue-600 bg-blue-50",
  };

  return statusColors[status];
}

/**
 * Debounce function to limit the rate of function execution
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  wait: number,
): (...args: TArgs) => void {
  let timeout: NodeJS.Timeout;

  return (...args: TArgs) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Creates a delay using Promise
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gets the display color for RSVP status
 * @param status - The RSVP status
 * @returns Tailwind color class
 */
export function getRsvpStatusColor(
  status: "pending" | "confirmed" | "declined",
): string {
  const statusColors = {
    pending: "text-yellow-600 bg-yellow-50",
    confirmed: "text-green-600 bg-green-50",
    declined: "text-red-600 bg-red-50",
  } as const;

  return statusColors[status];
}

/**
 * Formats an event date for display
 * @param date - The event date
 * @returns Formatted date string
 */
export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Downloads a QR code as a PNG file
 * @param qrCodeDataUrl - The QR code data URL (base64 encoded)
 * @param fileName - The name for the downloaded file (without extension)
 */
export function downloadQRCode(qrCodeDataUrl: string, fileName: string): void {
  if (!qrCodeDataUrl || !qrCodeDataUrl.startsWith("data:")) {
    console.warn("Invalid QR code data URL provided");
    return;
  }
  
  const link = document.createElement("a");
  link.download = `${fileName.replace(/\s+/g, "-")}.png`;
  link.href = qrCodeDataUrl;
  link.click();
}
