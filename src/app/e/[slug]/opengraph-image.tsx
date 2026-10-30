import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { THEMES } from "@/lib/themes";
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
  // The image is drawn outside the page, so it takes the theme's colours directly
  const { colors } = THEMES[event.theme];

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
        background: `linear-gradient(160deg, ${colors.background} 0%, ${colors.backgroundAlt} 55%, ${colors.background} 100%)`,
        borderTop: `12px solid ${colors.accent}`,
        borderBottom: `12px solid ${colors.accent}`,
      }}
    >
      <div
        style={{
          fontSize: 26,
          letterSpacing: 8,
          textTransform: "uppercase",
          color: colors.muted,
          marginBottom: 28,
        }}
      >
        You&apos;re invited
      </div>
      <div style={{ fontSize: 88, fontWeight: 700, color: colors.ink, lineHeight: 1.1 }}>
        {eventDisplayName(event)}
      </div>
      <div
        style={{
          marginTop: 44,
          padding: "16px 40px",
          borderRadius: 999,
          fontSize: 30,
          color: "#FFFFFF",
          backgroundColor: colors.accent,
        }}
      >
        {eventWhenAndWhere(event)}
      </div>
    </div>,
    size,
  );
}
