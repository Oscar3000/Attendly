import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSessionCookie } from "better-auth/cookies";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingSections } from "@/components/landing/landing-sections";

export const metadata: Metadata = {
  title: { absolute: "Attendly · Invitations, RSVPs and guest lists for your events" },
};

/**
 * Product landing page (T-409). Each event's own page is /e/[slug]. Signed-in hosts are offered
 * their events instead of sign-up; like middleware this only checks the session cookie is
 * present, and /dashboard sends a stale one to /login
 */
export default async function HomePage() {
  const signedIn = getSessionCookie(await headers()) !== null;

  return (
    <main className="font-inter bg-[#FFF9F4] text-[#333333]">
      <LandingHero signedIn={signedIn} />
      <LandingSections signedIn={signedIn} />
    </main>
  );
}
