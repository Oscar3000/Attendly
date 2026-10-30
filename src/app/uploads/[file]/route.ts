/**
 * Serve an uploaded image (T-406): GET /uploads/<uuid>.webp, read from the database
 * Public, like the event pages that show them. Ids are random and images never change (a new
 * cover gets a new id), so browsers may cache them for good
 */
import { readCoverImage } from "@/server/uploads/cover-images";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const image = await readCoverImage((await params).file);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
