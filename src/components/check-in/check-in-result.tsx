import type { CheckInMessage } from "@/lib/check-in";
import { cn } from "@/lib/utils";

/**
 * The door's answer, filling the screen so it can be read at arm's length: lime lets people in,
 * red stops them. Children go below the message
 */
export function CheckInResult({
  message: { tone, title, detail },
  children,
}: {
  message: CheckInMessage;
  children?: React.ReactNode;
}) {
  return (
    // Clipped: the stamp starts wider than a phone, which would leave the page zoomed out
    <main
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center overflow-hidden px-7 py-10 text-center",
        tone === "ok" ? "bg-lime text-ink" : "bg-stop text-white",
      )}
    >
      <div role="alert" className="flex w-full max-w-md flex-col items-center gap-3">
        <svg
          aria-hidden="true"
          className="size-30 animate-stamp"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={tone === "ok" ? "M4 12l5 5L20 6" : "M6 6l12 12M18 6L6 18"} />
        </svg>
        <h1 className="animate-stamp font-display text-[46px] leading-[1.02] font-extrabold tracking-tight break-words [animation-delay:60ms]">
          {title}
        </h1>
        <p className="text-lg">{detail}</p>
        {children}
      </div>
    </main>
  );
}
