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
  title: "Attendly - Attendance Management System",
  description:
    "A modern attendance management system built with Next.js. Track, manage, and analyze attendance records with ease.",
  keywords: ["attendance", "management", "tracking", "nextjs", "react"],
  authors: [{ name: "Attendly Team" }],
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
      <body
        className="min-h-screen font-sans antialiased"
        style={{ backgroundColor: "#FFF9F4" }}
      >
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
