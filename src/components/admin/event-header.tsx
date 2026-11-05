"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventHeaderProps {
  eventId: string;
  slug: string;
  title: string;
  // "Wedding · Monday, May 24, 2027 at 4:00 PM · The Glasshouse"
  details: string;
  // "200 days to go"
  countdown: string;
}

/**
 * Above every page of an event's dashboard: what the event is, its public page, and its tabs
 */
export function EventHeader({ eventId, slug, title, details, countdown }: EventHeaderProps) {
  const pathname = usePathname();
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const base = `/dashboard/events/${eventId}`;
  const eventPage = `/e/${slug}`;

  const tabs = [
    { href: `${base}/check-in`, label: "Scanner" },
    { href: `${base}/door-helpers`, label: "Door helpers" },
    { href: `${base}/settings`, label: "Settings" },
  ];
  // Pages without a tab of their own, like adding a guest, belong to Overview
  const current = tabs.find((tab) => pathname.startsWith(tab.href))?.href ?? base;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${eventPage}`);
      setCopy("copied");
    } catch {
      // Clipboard access can be refused (permissions, an insecure origin)
      setCopy("failed");
    }
  };

  return (
    <div className="bg-ink px-6 text-paper">
      <div className="mx-auto max-w-[1200px] pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center font-medium">
            Your events
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span role="status" className="text-sm text-mist">
              {copy === "copied" && "Link copied"}
              {copy === "failed" && "Couldn't copy; open the page and copy its address"}
            </span>
            <a
              href={eventPage}
              target="_blank"
              rel="noopener"
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              View page
            </a>
            <button
              type="button"
              onClick={copyLink}
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              Copy event link
            </button>
            {/* Opens the panel on Overview, from any tab */}
            <Link
              href={`${base}?add=guests`}
              scroll={false}
              className={buttonClasses({ size: "sm" })}
            >
              Add guests
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 pt-7 pb-5">
          <div className="min-w-0">
            <p className="font-mono text-[13px] text-mist">{details}</p>
            <h1 className="mt-1.5 font-display text-[clamp(2.75rem,6vw,4.5rem)] leading-none font-extrabold tracking-tight break-words">
              {title}
            </h1>
          </div>
          <p className="font-mono text-[15px] text-lime">{countdown}</p>
        </div>

        <nav aria-label="Event" className="flex gap-1 overflow-x-auto text-[15px] font-semibold">
          {[{ href: base, label: "Overview" }, ...tabs].map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={tab.href === current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-t-[14px] px-4 whitespace-nowrap",
                tab.href === current && "bg-paper text-ink",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
