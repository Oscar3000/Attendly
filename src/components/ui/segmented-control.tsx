import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  // Names the group for screen readers
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * A pill switch between a few options, for tabs and filters
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex gap-1 rounded-full bg-sand p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-11 flex-1 rounded-full px-4.5 font-semibold whitespace-nowrap text-ink",
            option.value === value && "bg-card",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
