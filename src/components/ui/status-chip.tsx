import type { RsvpStatus } from "@/lib/types";

const STATUS_CHIPS: Record<RsvpStatus, { label: string; classes: string; icon: string }> = {
  confirmed: {
    label: "Confirmed",
    classes: "border-lime bg-lime text-ink",
    icon: "M4 12l5 5L20 6",
  },
  pending: {
    label: "Pending",
    classes: "border-sand bg-sand text-ink",
    icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M12 8v4l2.5 1.5",
  },
  declined: {
    label: "Declined",
    classes: "border-ink bg-ink text-paper",
    icon: "M6 6l12 12M18 6L6 18",
  },
  rescinded: {
    label: "Rescinded",
    classes: "border-danger bg-transparent text-danger",
    icon: "M5 12h14",
  },
};

/**
 * An RSVP status as a colour, an icon and a label, so it never relies on colour alone
 */
export function StatusChip({ status }: { status: RsvpStatus }) {
  const { label, classes, icon } = STATUS_CHIPS[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1 text-sm font-semibold ${classes}`}
    >
      <svg
        aria-hidden="true"
        className="size-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <path d={icon} />
      </svg>
      {label}
    </span>
  );
}
