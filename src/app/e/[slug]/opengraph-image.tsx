import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { eventDisplayName, eventWhenAndWhere, getPublicEvent } from "@/server/events/public-event";

/**
 * The link preview image for /e/[slug] (T-404), drawn from the event so every event gets its
 * own. Next adds it to the page's og:image and twitter:image tags
 */
export const alt = "Event invitation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getPublicEvent((await params).slug);
  if (!event) notFound();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 80px",
        textAlign: "center",
        background: "linear-gradient(160deg, #FFF9F4 0%, #FDF0E6 55%, #FFF9F4 100%)",
        borderTop: "12px solid #C07A54",
        borderBottom: "12px solid #C07A54",
      }}
    >
      <div
        style={{
          fontSize: 26,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: "#9A7B6B",
          marginBottom: 28,
        }}
      >
        You&apos;re invited
      </div>
      <div style={{ fontSize: 88, fontWeight: 700, color: "#2C1810", lineHeight: 1.1 }}>
        {eventDisplayName(event)}
      </div>
      <div
        style={{
          marginTop: 44,
          padding: "16px 40px",
          borderRadius: 999,
          fontSize: 30,
          color: "#FFFFFF",
          backgroundColor: "#C07A54",
        }}
      >
        {eventWhenAndWhere(event)}
      </div>
    </div>,
    size,
  );
}
