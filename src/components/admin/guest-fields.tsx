import type { RsvpStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_PLUS_ONES = 50;

const STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  rescinded: "Rescinded",
};

/**
 * The fields shared by adding a guest and editing one
 */
export function PlusOnesField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <span id="plus-ones" className="text-[15px] font-semibold">
        Plus-ones
      </span>
      <div role="group" aria-labelledby="plus-ones" className="flex items-center gap-2">
        <Stepper label="Fewer plus-ones" disabled={value <= 0} onClick={() => onChange(value - 1)}>
          −
        </Stepper>
        <span className="min-w-7 text-center font-mono text-lg">{value}</span>
        <Stepper
          label="More plus-ones"
          disabled={value >= MAX_PLUS_ONES}
          onClick={() => onChange(value + 1)}
        >
          +
        </Stepper>
      </div>
    </div>
  );
}

function Stepper({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="size-11 rounded-full border-[1.5px] border-ink text-xl text-ink disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function StatusField({
  legend = "Status",
  options,
  value,
  onChange,
}: {
  legend?: string;
  options: readonly RsvpStatus[];
  value: RsvpStatus;
  onChange: (value: RsvpStatus) => void;
}) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-2 text-[15px] font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={value === status}
            onClick={() => onChange(status)}
            className={cn(
              "min-h-11 rounded-full border-[1.5px] border-ink px-3.5 text-[15px] font-semibold",
              value === status ? "bg-ink text-paper" : "text-ink",
            )}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
