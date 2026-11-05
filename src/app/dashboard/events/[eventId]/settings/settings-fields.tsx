import { buttonClasses } from "@/components/ui/button";

// Shared by the settings tabs
export const labelClass = "mb-1.5 block text-[15px] font-semibold";
export const inputClass =
  "h-13 w-full rounded-[14px] border-[1.5px] border-line bg-card px-4 text-base text-ink";
export const smallButtonClass = buttonClasses({ variant: "outline", size: "sm" });

export function FieldError({ id, message }: { id: string; message?: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-danger">
      {message}
    </p>
  );
}
