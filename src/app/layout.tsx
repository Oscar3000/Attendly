import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/store/ReduxProvider";

// The app's fonts, self-hosted at build time. Only the body font is preloaded: guest pages use
// their theme's heading font, so they shouldn't download these two
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  preload: false,
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  // Pages without their own title get "Attendly"; event pages set theirs in full (T-404)
  title: { default: "Attendly", template: "%s · Attendly" },
  description:
    "Invitations, RSVPs and guest lists for your events, with a QR code for every guest.",
  applicationName: "Attendly",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon-16x16.svg",
        sizes: "16x16",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/android-chrome-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Root layout component for the Attendly application
 * Provides global styles, fonts, and structure for all pages
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${instrument.variable} ${bricolage.variable} ${dmMono.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
