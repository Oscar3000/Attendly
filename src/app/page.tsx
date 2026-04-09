import HeroSection from "@/components/home/hero-section";
import CountdownSection from "@/components/home/countdown-section";
import EventDetails from "@/components/home/event-details";
import QrScanner from "@/components/home/qr-scanner";
import HomeFooter from "@/components/home/home-footer";

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FFF9F4" }}>
      <HeroSection />
      <CountdownSection />
      <EventDetails />
      <QrScanner />
      <HomeFooter />
    </main>
  );
}
