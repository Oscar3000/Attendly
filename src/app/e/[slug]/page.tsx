import type { Metadata } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { getEnv } from "@/server/env";
import { eventDisplayName, eventWhenAndWhere, getPublicEvent } from "@/server/events/public-event";
import { themeStyle } from "@/lib/themes";
import HeroSection from "@/components/home/hero-section";
import CountdownSection from "@/components/home/countdown-section";
import EventDetails from "@/components/home/event-details";
import QrScanner from "@/components/home/qr-scanner";
import HomeFooter from "@/components/home/home-footer";

// Fonts the theme presets use (src/lib/themes.ts), self-hosted at build time like Inter. Not
// preloaded: the browser then downloads only the ones the event's theme actually names
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  preload: false,
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  preload: false,
});

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

// Title, description and link preview (opengraph-image.tsx) for sharing the link (T-404)
export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await getPublicEvent((await params).slug);
  if (!event) return { title: "Event not found" };

  const title = eventDisplayName(event);
  const description = event.tagline
    ? `${event.tagline} · ${eventWhenAndWhere(event)}`
    : eventWhenAndWhere(event);
  return {
    // Absolute URLs for the preview image, which crawlers fetch from outside
    metadataBase: new URL(getEnv().BETTER_AUTH_URL),
    title: { absolute: title },
    description,
    openGraph: { type: "website", title, description },
    twitter: { card: "summary_large_image", title, description },
    // Anyone with the link can open the page, but it shouldn't be findable through search
    robots: { index: false, follow: false },
  };
}

/**
 * An event's public page (T-403): anyone with the link can see it, no sign-in
 */
export default async function EventPage({ params }: EventPageProps) {
  const event = await getPublicEvent((await params).slug);
  if (!event) notFound();

  return (
    <main
      className={`min-h-screen ${playfair.variable} ${montserrat.variable}`}
      style={themeStyle(event.theme)}
    >
      <HeroSection event={event} />
      <CountdownSection startsAt={event.date.toISOString()} />
      <EventDetails event={event} />
      <QrScanner />
      <HomeFooter event={event} />
    </main>
  );
}
