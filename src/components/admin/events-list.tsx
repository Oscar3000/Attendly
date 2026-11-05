"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { TicketCard } from "@/components/ui/ticket-card";

// What a card shows, prepared on the server
export interface EventListItem {
  id: string;
  type: string;
  title: string;
  when: string;
  venue: string | null;
  // The event's theme accent
  color: string;
  invited: number;
  replied: number;
  // Whole days until the event on its own calendar; negative once it's past
  days: number;
}

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
] as const;

type Tab = (typeof TABS)[number]["value"];

/**
 * The host's events, soonest first, with most recent first for past ones. A host's events are
 * all loaded already, so the switch and search run in the browser
 */
export function EventsList({ events }: { events: EventListItem[] }) {
  const upcoming = events.filter((event) => event.days >= 0);
  const past = events.filter((event) => event.days < 0).reverse();
  const [tab, setTab] = useState<Tab>(upcoming.length > 0 ? "upcoming" : "past");
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const inTab = tab === "upcoming" ? upcoming : past;
  const shown = inTab.filter((event) => event.title.toLowerCase().includes(query));

  if (events.length === 0) {
    return (
      <EmptyState title="No events yet">
        <p className="mt-2 mb-5 text-slate">
          Create your first event, then add guests and send their invitations.
        </p>
        <Link href="/dashboard/events/new" className={buttonClasses()}>
          Create an event
        </Link>
      </EmptyState>
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl label="Show events" options={TABS} value={tab} onChange={setTab} />
        <label className="block flex-[1_1_100%] sm:flex-[0_1_300px]">
          <span className="sr-only">Search events</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events"
            className="h-13 w-full rounded-full border-[1.5px] border-line bg-card px-4.5"
          />
        </label>
      </div>

      {shown.length > 0 ? (
        <ul className="mt-6 flex flex-col gap-4">
          {shown.map((event) => (
            <li key={event.id}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      ) : query ? (
        <EmptyState title="No events match">
          <p className="mt-2 mb-5 text-slate">Try another name, or clear your search.</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className={buttonClasses({ variant: "outline" })}
          >
            Clear search
          </button>
        </EmptyState>
      ) : (
        <EmptyState title={tab === "upcoming" ? "Nothing coming up" : "No past events"}>
          {tab === "upcoming" && (
            <Link href="/dashboard/events/new" className={`${buttonClasses()} mt-5`}>
              Create an event
            </Link>
          )}
        </EmptyState>
      )}
    </>
  );
}

function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-3xl border-2 border-dashed border-line bg-card px-6 py-14 text-center">
      <h2 className="font-display text-3xl font-extrabold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function EventCard({ event }: { event: EventListItem }) {
  const { id, type, title, when, venue, color, invited, replied, days } = event;

  return (
    <Link
      href={`/dashboard/events/${id}`}
      className="block animate-pop rounded-3xl transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(22,20,29,0.14)]"
    >
      <TicketCard tear="vertical" notchColor="var(--color-paper)" stub={<DaysStub days={days} />}>
        <div className="flex h-full">
          <span className="w-3.5 shrink-0" style={{ backgroundColor: color }} />
          <div className="min-w-0 flex-1 px-5 py-6 sm:px-7">
            <p className="font-mono text-[13px] text-slate">{type}</p>
            <h2 className="mt-1 font-display text-[clamp(1.5rem,4vw,2.125rem)] leading-tight font-extrabold tracking-tight break-words">
              {title}
            </h2>
            <p className="mt-1.5 text-slate">
              {when}
              {venue && ` · ${venue}`}
            </p>
            {invited > 0 && (
              <div className="mt-4 flex max-w-[460px] flex-wrap items-center gap-x-3 gap-y-1">
                <div className="h-2.5 min-w-20 flex-1 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-ink"
                    style={{ width: `${(replied / invited) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[13px] whitespace-nowrap text-slate">
                  {replied} of {invited} replied
                </span>
              </div>
            )}
          </div>
        </div>
      </TicketCard>
    </Link>
  );
}

function DaysStub({ days }: { days: number }) {
  const count = Math.abs(days);
  const unit = count === 1 ? "day" : "days";

  return (
    <div className="flex h-full w-24 flex-col items-center justify-center px-2 py-5 text-center sm:w-40">
      {days === 0 ? (
        <p className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Today</p>
      ) : (
        <>
          <p className="font-display text-4xl leading-none font-extrabold tracking-tight sm:text-5xl">
            {count}
          </p>
          <p className="mt-1 font-mono text-[13px] text-slate">
            {unit} {days > 0 ? "to go" : "ago"}
          </p>
        </>
      )}
    </div>
  );
}
