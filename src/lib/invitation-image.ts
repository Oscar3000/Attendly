/**
 * The invitation image a host downloads or shares for each guest (T-408): the event's names,
 * date, venue, colours and theme around the guest's QR code. Drawn on a canvas in the browser.
 * invitationCardContent decides what goes on the card (pure, tested); drawInvitationCanvas
 * lays it out
 */
import { splitCouple, type PaletteColor } from "./event-content";
import { copyFor, type EventType } from "./event-copy";
import { THEMES, type Theme, type ThemeId } from "./themes";
import { formatEventTime } from "./timezones";

// What the card needs from the event; the event dashboard layout provides it
// (src/components/admin/event-card-context.tsx)
export interface InvitationCardEvent {
  type: EventType;
  title: string;
  hostNames: string | null;
  // ISO string: it crosses from the server layout to client components
  date: string;
  timezone: string;
  venueName: string | null;
  venueAddress: string | null;
  tagline: string | null;
  colorPalette: PaletteColor[];
  theme: ThemeId;
}

export interface InvitationGuest {
  name: string;
  plusOne: number;
}

export interface InvitationCardContent {
  // "P & O" for a couple; otherwise the names are written out instead
  monogram: string | undefined;
  names: string | undefined;
  // "May 23, 2026 • 3:00 PM", on the event's clock
  when: string;
  admits: string;
  greeting: string | undefined;
  invitation: string;
  instructions: string;
  venue: { name: string | null; address: string | null } | undefined;
  palette: string[];
  tagline: string | undefined;
  colors: Theme["colors"];
}

export function invitationCardContent(
  event: InvitationCardEvent,
  guest: InvitationGuest,
): InvitationCardContent {
  const names = event.hostNames ?? event.title;
  const couple = splitCouple(event.type, names);
  const copy = copyFor(event.type);
  const date = new Date(event.date);
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: event.timezone,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const firstName = guest.name.trim().split(/\s+/)[0];

  return {
    monogram: couple ? `${couple[0].charAt(0)} & ${couple[1].charAt(0)}` : undefined,
    names: couple ? undefined : names,
    when: `${day}  •  ${formatEventTime(date, event.timezone)}`,
    admits: `Admits ${1 + Math.max(0, guest.plusOne)}`,
    greeting: firstName ? `Dear ${firstName}` : undefined,
    invitation: copy.imageInvitation,
    instructions: `Kindly present this QR code at the venue entrance to confirm your attendance. ${copy.imageClosing}`,
    venue:
      event.venueName || event.venueAddress
        ? { name: event.venueName, address: event.venueAddress }
        : undefined,
    palette: event.colorPalette.map(({ hex }) => hex),
    tagline: event.tagline ?? undefined,
    colors: (THEMES[event.theme] ?? THEMES.terracotta).colors,
  };
}

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

const W = 500;
const SIDE_PAD = 48;
const QR_SIZE = 240;
// Taller than any card; the drawing is cropped to what was used
const MAX_HEIGHT = 2000;
const SANS = "Inter, system-ui, sans-serif";
const SERIF = "Georgia, serif";

/**
 * Draws the invitation onto `canvas` and sizes it to fit. The content is drawn first on a
 * scratch canvas, so the card's height follows whatever the event has (no venue, a long
 * address, no colours...) instead of a hand-kept sum
 */
function drawInvitationCanvas(
  canvas: HTMLCanvasElement,
  qrImg: HTMLImageElement,
  content: InvitationCardContent,
): void {
  const { colors } = content;
  const scratch = document.createElement("canvas");
  scratch.width = W;
  scratch.height = MAX_HEIGHT;
  const c = scratch.getContext("2d")!;
  c.textAlign = "center";
  const textWidth = W - SIDE_PAD * 2;

  const separator = (y: number) => {
    c.save();
    c.globalAlpha = 0.45;
    c.strokeStyle = colors.ornament;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(SIDE_PAD + 20, y);
    c.lineTo(W - SIDE_PAD - 20, y);
    c.stroke();
    c.restore();
  };

  let y = 52;

  // ── Monogram, or the names written out ───────────────────────────────
  if (content.monogram) {
    c.fillStyle = colors.accent;
    c.font = `bold 36px ${SERIF}`;
    c.fillText(content.monogram, W / 2, y);
    y += 18;
  } else if (content.names) {
    c.fillStyle = colors.ink;
    c.font = `bold 28px ${SERIF}`;
    const lines = wrapText(c, content.names, textWidth);
    y += 10; // clear of the border
    for (const line of lines) {
      c.fillText(line, W / 2, y);
      y += 34;
    }
    y -= 12;
  }

  // ── Ornament divider ─────────────────────────────────────────────────
  c.strokeStyle = colors.ornament;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(SIDE_PAD, y);
  c.lineTo(W / 2 - 18, y);
  c.stroke();
  c.fillStyle = colors.ornament;
  c.font = `14px ${SERIF}`;
  c.fillText("❧", W / 2, y + 5);
  c.beginPath();
  c.moveTo(W / 2 + 18, y);
  c.lineTo(W - SIDE_PAD, y);
  c.stroke();
  y += 28;

  // ── Date + time pill ─────────────────────────────────────────────────
  c.font = `bold 13px ${SANS}`;
  const pillW = Math.max(290, c.measureText(content.when).width + 40);
  const pillH = 28;
  c.fillStyle = colors.accent;
  c.beginPath();
  c.roundRect((W - pillW) / 2, y, pillW, pillH, 14);
  c.fill();
  c.fillStyle = "#FFFFFF";
  c.fillText(content.when, W / 2, y + 18);
  y += pillH + 10;

  // ── Admits pill (outlined) ───────────────────────────────────────────
  c.font = `600 14px ${SANS}`;
  const admitsW = c.measureText(content.admits).width + 32;
  const admitsH = 26;
  c.strokeStyle = colors.accent;
  c.lineWidth = 1.25;
  c.beginPath();
  c.roundRect((W - admitsW) / 2, y, admitsW, admitsH, 13);
  c.stroke();
  c.fillStyle = colors.accent;
  c.fillText(content.admits, W / 2, y + 18);
  y += admitsH + 14;

  separator(y);
  y += 18;

  // ── "Dear [Name]" ────────────────────────────────────────────────────
  if (content.greeting) {
    c.fillStyle = colors.text;
    c.font = `600 20px ${SERIF}`;
    c.fillText(content.greeting, W / 2, y + 14);
    y += 40;
  }

  // ── Invitation wording for the event type ────────────────────────────
  c.fillStyle = colors.muted;
  c.font = `italic 13px ${SANS}`;
  for (const line of wrapText(c, content.invitation, textWidth)) {
    c.fillText(line, W / 2, y);
    y += 20;
  }
  y += 24;

  // ── QR code in a white rounded card ──────────────────────────────────
  const qrBg = 14;
  const qrX = (W - QR_SIZE) / 2;
  c.fillStyle = "#FFFFFF";
  c.beginPath();
  c.roundRect(qrX - qrBg, y - qrBg, QR_SIZE + qrBg * 2, QR_SIZE + qrBg * 2, 16);
  c.fill();
  c.strokeStyle = colors.border;
  c.lineWidth = 1.5;
  c.stroke();
  c.drawImage(qrImg, qrX, y, QR_SIZE, QR_SIZE);
  y += QR_SIZE + qrBg + 26;

  // ── Instructions ─────────────────────────────────────────────────────
  c.fillStyle = colors.text;
  c.font = `14px ${SANS}`;
  for (const line of wrapText(c, content.instructions, textWidth)) {
    c.fillText(line, W / 2, y);
    y += 22;
  }

  // ── Venue ────────────────────────────────────────────────────────────
  if (content.venue) {
    y += 18;
    c.fillStyle = colors.muted;
    c.font = `10px ${SANS}`;
    c.fillText("VENUE", W / 2, y);
    y += 20;
    if (content.venue.name) {
      c.fillStyle = colors.text;
      c.font = `600 16px ${SERIF}`;
      for (const line of wrapText(c, content.venue.name, textWidth)) {
        c.fillText(line, W / 2, y);
        y += 20;
      }
    }
    if (content.venue.address) {
      c.fillStyle = colors.muted;
      c.font = `13px ${SANS}`;
      for (const line of wrapText(c, content.venue.address.replace(/\s*\n\s*/g, ", "), textWidth)) {
        c.fillText(line, W / 2, y);
        y += 18;
      }
    }
  }

  // ── Colours of the day ───────────────────────────────────────────────
  if (content.palette.length > 0) {
    y += 8;
    separator(y);
    y += 18;
    c.fillStyle = colors.muted;
    c.font = `10px ${SANS}`;
    c.fillText("COLOURS OF THE DAY", W / 2, y);
    y += 16;
    const r = 11;
    const gap = 14;
    const total = content.palette.length * r * 2 + (content.palette.length - 1) * gap;
    let x = (W - total) / 2 + r;
    for (const hex of content.palette) {
      c.fillStyle = hex;
      c.beginPath();
      c.arc(x, y + r, r, 0, Math.PI * 2);
      c.fill();
      x += r * 2 + gap;
    }
    y += r * 2 + 8;
  }

  // ── Tagline ──────────────────────────────────────────────────────────
  if (content.tagline) {
    y += 16;
    c.fillStyle = colors.accent;
    c.font = `bold 15px ${SANS}`;
    for (const line of wrapText(c, content.tagline, textWidth)) {
      c.fillText(line, W / 2, y);
      y += 20;
    }
    y -= 20;
  }

  // ── Final card: background, the content, then the borders ────────────
  const H = Math.min(MAX_HEIGHT, y + 44);
  canvas.width = W;
  canvas.height = H;
  const out = canvas.getContext("2d")!;
  out.fillStyle = colors.background;
  out.fillRect(0, 0, W, H);
  out.drawImage(scratch, 0, 0, W, H, 0, 0, W, H);
  out.strokeStyle = colors.accent;
  out.lineWidth = 3;
  out.strokeRect(12, 12, W - 24, H - 24);
  out.globalAlpha = 0.35;
  out.strokeStyle = colors.ornament;
  out.lineWidth = 1;
  out.strokeRect(21, 21, W - 42, H - 42);
}

export interface InvitationImageInput {
  guest: InvitationGuest;
  event: InvitationCardEvent;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load QR image"));
    img.src = src;
  });
}

async function renderInvitation(qrCodeDataUrl: string, input: InvitationImageInput) {
  const canvas = document.createElement("canvas");
  drawInvitationCanvas(
    canvas,
    await loadImage(qrCodeDataUrl),
    invitationCardContent(input.event, input.guest),
  );
  return canvas;
}

function saveFile(href: string, fileName: string) {
  const link = document.createElement("a");
  link.download = `${fileName.replace(/\s+/g, "-")}.png`;
  link.href = href;
  link.click();
}

/**
 * Downloads the invitation image for a guest; without `input` (no event loaded), just the
 * bare QR code
 */
export async function downloadQRCode(
  qrCodeDataUrl: string,
  fileName: string,
  input?: InvitationImageInput,
): Promise<void> {
  if (!qrCodeDataUrl || !qrCodeDataUrl.startsWith("data:")) {
    console.warn("Invalid QR code data URL provided");
    return;
  }
  if (!input) {
    saveFile(qrCodeDataUrl, fileName);
    return;
  }
  const canvas = await renderInvitation(qrCodeDataUrl, input);
  saveFile(canvas.toDataURL("image/png"), fileName);
}

/**
 * Shares the invitation image via the native share sheet (needs HTTPS on mobile), falling back
 * to downloading it when sharing isn't available
 */
export async function shareQRCodeAsImage(
  qrCodeDataUrl: string,
  input: InvitationImageInput,
): Promise<void> {
  if (!qrCodeDataUrl || !qrCodeDataUrl.startsWith("data:")) return;

  const canvas = await renderInvitation(qrCodeDataUrl, input);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to create blob"))),
      "image/png",
    ),
  );
  const fileName = `invitation-${input.guest.name.replace(/\s+/g, "-")}.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  try {
    await navigator.share({ files: [file] });
  } catch {
    // Share not available (not HTTPS or user cancelled): fall back to download
    saveFile(canvas.toDataURL("image/png"), `invitation-qr-${input.guest.name}`);
  }
}
