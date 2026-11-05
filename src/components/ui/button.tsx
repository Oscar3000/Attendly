import { cn } from "@/lib/utils";

const buttonVariants = {
  primary: "bg-ember text-ink",
  secondary: "bg-ink text-paper",
  outline: "border-[1.5px] border-ink bg-transparent text-ink",
  danger: "border-[1.5px] border-danger bg-transparent text-danger",
} as const;

const buttonSizes = {
  sm: "min-h-11 px-4 text-[15px]",
  md: "min-h-13 px-6 text-base",
  lg: "min-h-14 px-8 text-[17px]",
} as const;

interface ButtonStyle {
  variant?: keyof typeof buttonVariants | undefined;
  size?: keyof typeof buttonSizes | undefined;
  className?: string | undefined;
}

/**
 * The button's classes on their own, for a link that should look like a button
 */
export function buttonClasses({ variant = "primary", size = "md", className }: ButtonStyle = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

interface ButtonProps extends ButtonStyle, React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({
  children,
  className,
  variant,
  size,
  disabled = false,
  loading = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
