import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/store/ReduxProvider";

// Font optimization with Inter font family
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased" style={{ backgroundColor: "#FFF9F4" }}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
