"use client";

import { useState } from "react";
import type { DashboardMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ReplyGroup = "confirmed" | "pending" | "declined";

interface RepliesCardProps {
  metrics: DashboardMetrics;
  // With a handler, the bar and legend become buttons for filtering the guest list
  selected?: ReplyGroup | null;
  onSelect?: (group: ReplyGroup) => void;
}

/**
 * How the guests have answered: the replied count and a bar of confirmed, pending and declined
 */
export default function RepliesCard({ metrics, selected, onSelect }: RepliesCardProps) {
  const [hovered, setHovered] = useState<ReplyGroup | null>(null);
  const total = metrics.totalInvitations;

  const groups: { id: ReplyGroup; label: string; count: number; color: string }[] = [
    { id: "confirmed", label: "Confirmed", count: metrics.confirmedCount, color: "#CDF25C" },
    { id: "pending", label: "Pending", count: metrics.pendingCount, color: "#8E8A9A" },
    { id: "declined", label: "Declined", count: metrics.rescindedCount, color: "#FF6A3D" },
  ];

  const detail = groups.find((group) => group.id === hovered);
  const Item = onSelect ? "button" : "span";
  const itemProps = (id: ReplyGroup) => ({
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered(null),
    ...(onSelect && {
      type: "button" as const,
      onClick: () => onSelect(id),
      onFocus: () => setHovered(id),
      onBlur: () => setHovered(null),
    }),
  });

  return (
    <section className="rounded-3xl bg-ink p-7 text-paper">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h2 className="font-mono text-[13px] text-mist">Replies</h2>
          <p className="mt-1 font-display text-[64px] leading-none font-extrabold tracking-tight">
            {total - metrics.pendingCount}
            <span className="text-2xl text-mist"> of {total}</span>
          </p>
        </div>
        <dl className="flex gap-7">
          <Stat label="Invitations" value={total} />
          <Stat label="Guests" value={metrics.totalGuests} />
        </dl>
      </div>

      {total === 0 ? (
        <p className="mt-6 text-mist">No invitations yet. Add your first guests to get started.</p>
      ) : (
        <>
          {/* The legend below says the same in words, so the plain bar is hidden from readers */}
          <div aria-hidden={onSelect ? undefined : true} className="mt-6 flex h-6 gap-0.5">
            {groups
              .filter(({ count }) => count > 0)
              .map(({ id, label, count, color }) => (
                <Item
                  key={id}
                  {...itemProps(id)}
                  aria-label={onSelect ? `${label}: ${count}. Filter guests` : undefined}
                  // The bar is 24px tall; the pseudo-element makes a 44px target without changing its look
                  className="relative min-w-1 rounded transition-[filter] before:absolute before:inset-x-0 before:-inset-y-2.5 hover:brightness-110"
                  style={{ flexGrow: count, flexBasis: 0, backgroundColor: color }}
                />
              ))}
          </div>
          <p className="mt-2.5 min-h-6 text-[15px] text-mist">
            {detail &&
              `${detail.label}: ${detail.count} of ${total} (${Math.round((detail.count / total) * 100)}%)`}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {groups.map(({ id, label, count, color }) => (
              <Item
                key={id}
                {...itemProps(id)}
                aria-pressed={onSelect ? selected === id : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-3.5 text-[15px] font-semibold",
                  selected === id ? "border-paper bg-graphite" : "border-slate",
                )}
              >
                <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
                {label}
                <span className="font-mono font-normal">{count}</span>
              </Item>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="font-mono text-[13px] text-mist">{label}</dt>
      <dd className="mt-1 font-display text-[34px] leading-none font-extrabold">{value}</dd>
    </div>
  );
}
