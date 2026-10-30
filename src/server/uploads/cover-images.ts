/**
 * Event cover images (T-406): validate and re-encode uploads, store them, and read them back
 * Uploads are decoded and re-encoded as WebP, so what's stored is always a clean image we made:
 * no EXIF (camera GPS location included), no hidden payloads, at most MAX_WIDTH wide.
 * Images are stored in Postgres (imageRepo) and served at /uploads/<id>.webp; moving to S3/R2
 * later means changing where saveCoverImage/readCoverImage put and get the bytes
 */
import "server-only";
import sharp from "sharp";
import { imageRepo } from "@/server/repositories/image.repo";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);
const MAX_WIDTH = 2000;
// Refuse decompression bombs: a small file that decodes to a huge bitmap
const MAX_INPUT_PIXELS = 40_000_000;

// Public URLs look like /uploads/<uuid>.webp
const FILE_NAME = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.webp$/;
const urlFor = (id: string) => `/uploads/${id}.webp`;

export class InvalidImageError extends Error {}

// Check and re-encode an upload; throws InvalidImageError with a message for the host
async function reencode(file: Blob): Promise<Buffer> {
  if (file.size === 0) throw new InvalidImageError("Choose an image to upload");
  if (file.size > MAX_UPLOAD_BYTES) throw new InvalidImageError("Images must be 5 MB or smaller");

  // The declared type is only a hint; the bytes decide (an SVG renamed .png is still refused)
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });
    const { format } = await image.metadata();
    if (!format || !ACCEPTED_FORMATS.has(format)) throw new InvalidImageError();
    return await image
      .rotate() // apply the camera's orientation before the EXIF data is dropped
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new InvalidImageError("Upload a JPEG, PNG or WebP image");
  }
}

// Make an upload the event's cover, replacing any previous one; returns its public URL, or
// undefined if the event no longer exists
export async function saveCoverImage(eventId: string, file: Blob): Promise<string | undefined> {
  const bytes = await reencode(file);
  return imageRepo.replaceCover(eventId, { bytes, contentType: "image/webp" }, urlFor);
}

// Remove the event's cover; false if the event no longer exists
export async function removeCoverImage(eventId: string): Promise<boolean> {
  return imageRepo.removeCover(eventId);
}

// For GET /uploads/[file]; undefined for unknown or malformed names
export async function readCoverImage(
  name: string,
): Promise<{ bytes: Buffer; contentType: string } | undefined> {
  const id = FILE_NAME.exec(name)?.[1];
  return id ? imageRepo.findById(id) : undefined;
}
