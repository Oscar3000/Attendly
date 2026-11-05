import { cn } from "@/lib/utils";

/**
 * Labelled input with an inline error, linked for screen readers via aria-describedby
 */

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string | undefined;
  // Sits inside the input at its right edge, like a show/hide button
  trailing?: React.ReactNode;
  // Sits below the input and is linked to it for screen readers
  hint?: React.ReactNode;
}

export function TextField({ id, label, error, trailing, hint, ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ");

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            "h-13 w-full rounded-[14px] border-[1.5px] bg-card px-4 text-base text-ink",
            error ? "border-danger" : "border-line",
            trailing ? "pr-20" : undefined,
          )}
          {...inputProps}
        />
        {trailing && <div className="absolute top-1 right-1">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
      {hint && (
        <div id={hintId} className="text-sm">
          {hint}
        </div>
      )}
    </div>
  );
}
