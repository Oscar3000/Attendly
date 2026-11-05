import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  // Names the group for screen readers
  label: string;
  options: readonly { value: T; label: string; invalid?: boolean }[];
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
      className={cn("inline-flex max-w-full gap-1 rounded-full bg-sand p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-11 min-w-0 flex-1 rounded-full px-3 leading-tight font-semibold text-ink sm:px-4.5",
            option.value === value && "bg-card",
          )}
        >
          {option.label}
          {option.invalid && (
            <>
              <span
                aria-hidden="true"
                className="ml-1.5 inline-block size-2 rounded-full bg-danger align-middle"
              />
              <span className="sr-only"> (has errors)</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}
