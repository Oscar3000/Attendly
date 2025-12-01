/**
 * Button component following Attendly design system
 * Implements accessibility best practices and consistent styling
 */

import type { ButtonProps } from "@/lib/types";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  attendly: "text-white hover:opacity-90 focus:ring-offset-2",
} as const;

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base", 
  lg: "px-6 py-3 text-lg",
  custom: "",
} as const;

/**
 * Reusable Button component with consistent styling and behavior
 */
export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  width,
  height,
  fontSize,
  fontWeight,
  borderRadius,
  backgroundColor,
  textColor,
  ...props
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isDisabled = disabled || loading;
  const isAttendlyVariant = variant === "attendly";
  
  // Custom styles for attendly variant
  const customStyles = isAttendlyVariant ? {
    width: typeof width === 'number' ? `${width}px` : width || '300px',
    height: typeof height === 'number' ? `${height}px` : height || '70px',
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius || '18px',
    backgroundColor: backgroundColor || '#C07A54',
    color: textColor || 'white',
    fontFamily: 'Inter',
    fontWeight: typeof fontWeight === 'number' ? fontWeight : fontWeight || '500',
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize || '22px',
    border: 'none',
  } : {};

  return (
    <button
      className={cn(
        // Base styles (conditional for attendly variant)
        isAttendlyVariant 
          ? "transition-colors focus:outline-none focus:ring-2"
          : "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        // Variant styles
        buttonVariants[variant],
        // Size styles  
        buttonSizes[size],
        // Custom className
        className
      )}
      style={isAttendlyVariant ? customStyles : undefined}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}