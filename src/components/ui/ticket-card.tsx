import { cn } from "@/lib/utils";

interface TicketCardProps {
  children: React.ReactNode;
  // The part past the tear line
  stub: React.ReactNode;
  // "vertical" puts the stub beside the main part, "horizontal" below it
  tear?: "vertical" | "horizontal";
  // Must match what's behind the card, so the notches look cut out
  notchColor: string;
  lineColor?: string;
  // Instead of the app's card colour
  cardColor?: string;
  className?: string;
}

/**
 * A card with a dashed tear line and a notch at each end of it, the design's main visual idea.
 * Takes CSS colours, so guest pages can pass var(--event-*). Sections bring their own padding
 */
export function TicketCard({
  children,
  stub,
  tear = "horizontal",
  notchColor,
  lineColor = "var(--color-line)",
  cardColor = "var(--color-card)",
  className,
}: TicketCardProps) {
  const vertical = tear === "vertical";
  const notch = "absolute size-7 rounded-full";

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-3xl",
        vertical ? "flex-row" : "flex-col",
        className,
      )}
      style={{ backgroundColor: cardColor }}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <div aria-hidden="true" className={cn("relative shrink-0", vertical ? "w-0" : "h-0")}>
        <span
          className={cn(
            "absolute border-dashed",
            vertical
              ? "inset-y-5 left-0 -translate-x-px border-l-2"
              : "inset-x-5 top-0 -translate-y-px border-t-2",
          )}
          style={{ borderColor: lineColor }}
        />
        <span className={cn(notch, "-top-3.5 -left-3.5")} style={{ backgroundColor: notchColor }} />
        <span
          className={cn(notch, vertical ? "-bottom-3.5 -left-3.5" : "-top-3.5 -right-3.5")}
          style={{ backgroundColor: notchColor }}
        />
      </div>
      <div className={vertical ? "shrink-0" : undefined}>{stub}</div>
    </div>
  );
}
