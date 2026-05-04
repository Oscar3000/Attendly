/**
 * Utility functions for the Attendly application
 * Following functional programming principles and TypeScript best practices
 */

import QRCode from "qrcode";
import type { 
  RsvpStatus,
  PrismaRsvpStatus,
  Invitation,
  InviteDetails
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
 * Wraps text into lines that fit within a given width
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Draws the full decorated invitation onto a canvas.
 * The canvas dimensions are set inside this function.
 */
function drawInvitationCanvas(
  canvas: HTMLCanvasElement,
  qrImg: HTMLImageElement,
): void {
  const W = 500;
  const qrSize = 240;
  const sidePad = 48;
  const ctx = canvas.getContext("2d")!;

  // Measure wrapped message text before setting canvas size
  ctx.font = "14px Inter, system-ui, sans-serif";
  const msgLines = wrapText(
    ctx,
    "Kindly present this QR code at the venue entrance to confirm your attendance. We look forward to celebrating with you!",
    W - sidePad * 2,
  );
  const msgHeight = msgLines.length * 22;

  // Compute total canvas height
  const H =
    60 +   // top breathing room + monogram
    30 +   // ornament line
    38 +   // couple names
    44 +   // date pill + gap
    20 +   // "You are specially invited"
    34 +   // "Dear [Name]"
    20 +   // gap before QR
    qrSize + 24 + // QR + padding inside white box
    msgHeight + 16 + // message
    28 +   // divider
    20 +   // "Colours of the Day" label
    42 +   // swatches
    36 +   // hashtag
    28;    // bottom breathing room

  canvas.width = W;
  canvas.height = H;

  // Re-acquire context after resize
  const c = canvas.getContext("2d")!;

  // ── Background ──────────────────────────────────────────────────────────
  c.fillStyle = "#FFF9F4";
  c.fillRect(0, 0, W, H);

  // ── Outer border ────────────────────────────────────────────────────────
  c.strokeStyle = "#C07A54";
  c.lineWidth = 3;
  c.strokeRect(12, 12, W - 24, H - 24);

  // ── Inner accent border ─────────────────────────────────────────────────
  c.strokeStyle = "rgba(212,175,55,0.35)";
  c.lineWidth = 1;
  c.strokeRect(21, 21, W - 42, H - 42);

  let y = 52;

  // ── "P & O" Monogram ───────────────────────────────────────────────────
  c.fillStyle = "#C07A54";
  c.font = "bold 36px Georgia, serif";
  c.textAlign = "center";
  c.fillText("P & O", W / 2, y);
  y += 18;

  // ── Gold ornament divider ──────────────────────────────────────────────
  c.strokeStyle = "#D4AF37";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(sidePad, y);
  c.lineTo(W / 2 - 18, y);
  c.stroke();
  c.fillStyle = "#D4AF37";
  c.font = "14px Georgia, serif";
  c.fillText("❧", W / 2, y + 5);
  c.beginPath();
  c.moveTo(W / 2 + 18, y);
  c.lineTo(W - sidePad, y);
  c.stroke();
  y += 28;

  // ── Date pill ──────────────────────────────────────────────────────────
  const pillW = 210;
  const pillH = 28;
  const pillX = (W - pillW) / 2;
  c.fillStyle = "#C07A54";
  c.beginPath();
  c.roundRect(pillX, y, pillW, pillH, 14);
  c.fill();
  c.fillStyle = "#FFFFFF";
  c.font = "bold 13px Inter, system-ui, sans-serif";
  c.textAlign = "center";
  c.fillText("May 23rd, 2026", W / 2, y + 18);
  y += pillH + 20;

  // ── Thin gold separator ────────────────────────────────────────────────
  c.strokeStyle = "rgba(212,175,55,0.45)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(sidePad + 20, y);
  c.lineTo(W - sidePad - 20, y);
  c.stroke();
  y += 18;

  // ── "You have been specially invited..." ──────────────────────────────
  c.fillStyle = "#9A7B6B";
  c.font = "italic 13px Inter, system-ui, sans-serif";
  c.textAlign = "center";
  const inviteLines = wrapText(
    c,
    "You have been specially invited to witness and celebrate this beautiful union. This is your personal invitation.",
    W - sidePad * 2,
  );
  for (const line of inviteLines) {
    c.fillText(line, W / 2, y);
    y += 20;
  }
  y += 10;

  // ── QR Code in white rounded card ─────────────────────────────────────
  const qrBg = 14;
  const qrX = (W - qrSize) / 2;
  c.fillStyle = "#FFFFFF";
  c.beginPath();
  c.roundRect(qrX - qrBg, y - qrBg, qrSize + qrBg * 2, qrSize + qrBg * 2, 16);
  c.fill();
  c.strokeStyle = "#E8D5C4";
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(qrX - qrBg, y - qrBg, qrSize + qrBg * 2, qrSize + qrBg * 2, 16);
  c.stroke();
  c.drawImage(qrImg, qrX, y, qrSize, qrSize);
  y += qrSize + qrBg + 16;

  // ── Venue message ─────────────────────────────────────────────────────
  c.fillStyle = "#6B4A3A";
  c.font = "14px Inter, system-ui, sans-serif";
  c.textAlign = "center";
  for (const line of msgLines) {
    c.fillText(line, W / 2, y);
    y += 22;
  }
  y += 16;

  // ── Thin gold separator ────────────────────────────────────────────────
  c.strokeStyle = "rgba(212,175,55,0.45)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(sidePad + 20, y);
  c.lineTo(W - sidePad - 20, y);
  c.stroke();
  y += 18;

  // ── "Colours of the Day" ──────────────────────────────────────────────
  c.fillStyle = "#9A7B6B";
  c.font = "10px Inter, system-ui, sans-serif";
  c.textAlign = "center";
  c.fillText("COLOURS OF THE DAY", W / 2, y);
  y += 16;

  // Swatches
  const swatchR = 11;
  const swatchGap = 14;
  const swatchColors = ["#D4AF37", "#8B4513", "#E8750A"];
  const swatchTotalW = swatchColors.length * swatchR * 2 + (swatchColors.length - 1) * swatchGap;
  let swatchX = (W - swatchTotalW) / 2 + swatchR;
  for (const color of swatchColors) {
    c.fillStyle = color;
    c.beginPath();
    c.arc(swatchX, y + swatchR, swatchR, 0, Math.PI * 2);
    c.fill();
    swatchX += swatchR * 2 + swatchGap;
  }
  y += swatchR * 2 + 14;

  // ── Hashtag ────────────────────────────────────────────────────────────
  c.fillStyle = "#C07A54";
  c.font = "bold 15px Inter, system-ui, sans-serif";
  c.textAlign = "center";
  c.fillText("#OscarPam2026", W / 2, y);
}

/**
 * Downloads a QR code as a decorated PNG with invitation text and guest name
 * @param qrCodeDataUrl - The QR code data URL (base64 encoded)
 * @param fileName - The name for the downloaded file (without extension)
 * @param guestName - The guest's name to display on the image
 */
export function downloadQRCode(qrCodeDataUrl: string, fileName: string, guestName?: string): void {
  if (!qrCodeDataUrl || !qrCodeDataUrl.startsWith("data:")) {
    console.warn("Invalid QR code data URL provided");
    return;
  }

  if (!guestName) {
    const link = document.createElement("a");
    link.download = `${fileName.replace(/\s+/g, "-")}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    return;
  }

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    drawInvitationCanvas(canvas, img);
    const link = document.createElement("a");
    link.download = `${fileName.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = qrCodeDataUrl;
}

/**
 * Generates the decorated invitation canvas as a Blob
 */
function generateInvitationBlob(qrCodeDataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      drawInvitationCanvas(canvas, img);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to create blob"));
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Failed to load QR image"));
    img.src = qrCodeDataUrl;
  });
}

/**
 * Shares the decorated QR code invitation as an image via the native share sheet.
 * Requires HTTPS (secure context) to work on mobile.
 * Falls back to downloading the image if sharing is not supported.
 */
export async function shareQRCodeAsImage(qrCodeDataUrl: string, guestName: string): Promise<void> {
  if (!qrCodeDataUrl || !qrCodeDataUrl.startsWith("data:")) return;

  const blob = await generateInvitationBlob(qrCodeDataUrl);
  const fileName = `invitation-${guestName.replace(/\s+/g, "-")}.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  try {
    await navigator.share({ files: [file] });
  } catch {
    // Share not available (not HTTPS or user cancelled) — fall back to download
    downloadQRCode(qrCodeDataUrl, `invitation-qr-${guestName}`, guestName);
  }
}

/**
 * Formats a date to show relative time (e.g., "2 minutes ago", "Yesterday")
 * @param date - The date to format (Date object or string)
 * @returns Human-readable relative time string
 */
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
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
 * Generates QR code data URL for invitation links
 * @param invitationId - The invitation ID to generate QR code for
 * @returns Promise resolving to QR code data URL or placeholder
 */
export async function generateQRCode(invitationId: string): Promise<string> {
  try {
    const rawBase = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const baseUrl = /^https?:\/\//i.test(rawBase) ? rawBase : `https://${rawBase}`;
    const inviteUrl = `${baseUrl.replace(/\/$/, '')}/invite/${invitationId}`;
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

/**
 * Convert Prisma enum to our app enum
 * @param status - Prisma RSVP status
 * @returns Application RSVP status
 */
export function convertPrismaStatus(status: PrismaRsvpStatus): RsvpStatus {
  const statusMap: Record<PrismaRsvpStatus, RsvpStatus> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    DECLINED: 'declined',
    RESCINDED: 'rescinded'
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
    'pending': 'PENDING',
    'confirmed': 'CONFIRMED',
    'declined': 'DECLINED',
    'rescinded': 'RESCINDED'
  };
  return statusMap[status];
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
    eventDate: invitation.eventDate,
    venue: invitation.venue,
    status: convertPrismaStatus(invitation.status),
    plusOne: invitation.plusOne,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
  };
}
