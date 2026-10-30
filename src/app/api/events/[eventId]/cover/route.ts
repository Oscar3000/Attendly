/**
 * An event's cover image (owner only, T-406)
 * POST /api/events/[eventId]/cover - multipart form with a `file` field (JPEG, PNG or WebP,
 *   up to 5 MB); stored re-encoded as WebP, replacing any previous cover
 * DELETE /api/events/[eventId]/cover - remove the cover
 */
import { NextResponse } from "next/server";
import { BadRequestError, handleRoute, NotFoundError } from "@/server/http/errors";
import { requireEventOwner } from "@/server/events/require-event-owner";
import {
  InvalidImageError,
  MAX_UPLOAD_BYTES,
  removeCoverImage,
  saveCoverImage,
} from "@/server/uploads/cover-images";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

// Room for the multipart boundaries and headers around the file itself
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

const fieldError = (message: string) =>
  new BadRequestError(message, { formErrors: [], fieldErrors: { file: [message] } });

export const POST = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);

  // Refuse an oversized body before reading it
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) {
    throw fieldError("Images must be 5 MB or smaller");
  }
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    throw new BadRequestError("Send the image as multipart/form-data");
  }
  if (!(file instanceof Blob)) throw fieldError("Choose an image to upload");

  let coverImageUrl: string | undefined;
  try {
    coverImageUrl = await saveCoverImage(event.id, file);
  } catch (error) {
    if (error instanceof InvalidImageError) throw fieldError(error.message);
    throw error;
  }
  // Deleted between the ownership check and the save
  if (!coverImageUrl) throw new NotFoundError("Event not found");
  return NextResponse.json({ coverImageUrl }, { status: 200 });
});

export const DELETE = handleRoute(async (request, { params }: RouteParams) => {
  const { event } = await requireEventOwner((await params).eventId, request.headers);

  if (!(await removeCoverImage(event.id))) throw new NotFoundError("Event not found");
  return NextResponse.json({ coverImageUrl: null }, { status: 200 });
});
