"use client";

import { usePathname } from "next/navigation";

/**
 * Leaves its children out on the host's door scanner: a full-screen page, so the camera is in
 * view on a phone and a result fills the screen. The scanner links back to the dashboard
 */
export function HideOnScanner({ children }: { children: React.ReactNode }) {
  return /^\/dashboard\/events\/[^/]+\/check-in/.test(usePathname()) ? null : children;
}
