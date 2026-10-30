import { notFound } from "next/navigation";
import { eventRepo } from "@/server/repositories/event.repo";
import HeroSection from "@/components/home/hero-section";
import CountdownSection from "@/components/home/countdown-section";
import EventDetails from "@/components/home/event-details";
import QrScanner from "@/components/home/qr-scanner";
import HomeFooter from "@/components/home/home-footer";

/**
 * An event's public page (T-403): anyone with the link can see it, no sign-in
 */
export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await eventRepo.findBySlug((await params).slug);
  if (!event) notFound();

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF9F4" }}>
      <HeroSection event={event} />
      <CountdownSection startsAt={event.date.toISOString()} />
      <EventDetails event={event} />
      <QrScanner />
      <HomeFooter event={event} />
    </main>
  );
}
