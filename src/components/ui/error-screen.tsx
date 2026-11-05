import { TicketCard } from "./ticket-card";

interface ErrorScreenProps {
  // "404"
  label: string;
  title: string;
  detail: string;
  // The way out, past the tear line
  children: React.ReactNode;
}

/**
 * The whole page when something can't be shown. It names no event or account, so a 404 reads the
 * same for a missing event and someone else's
 */
export function ErrorScreen({ label, title, detail, children }: ErrorScreenProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink p-5">
      <TicketCard
        notchColor="var(--color-ink)"
        className="w-full max-w-md"
        stub={<div className="flex flex-col gap-2 p-6">{children}</div>}
      >
        <div className="p-7 text-center">
          <p className="font-mono text-[13px] text-slate">{label}</p>
          <h1 className="mt-1 font-display text-[40px] leading-[1.05] font-extrabold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-3 text-slate">{detail}</p>
        </div>
      </TicketCard>
    </main>
  );
}
