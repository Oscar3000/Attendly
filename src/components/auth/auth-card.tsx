import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/ui/ticket-card";
import { THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  // Log in and sign up link to each other with a switch above the form
  switcher?: "login" | "signup";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Page shell for the sign-in and sign-up forms: the form on one side, the tickets on the other
 */
export function AuthCard({ title, subtitle, switcher, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <main className="flex min-w-0 flex-1 flex-col px-6 py-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center self-start font-display text-[26px] font-extrabold tracking-tight"
        >
          attendly
        </Link>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 animate-pop flex-col justify-center gap-6 py-10">
          <div>
            <h1 className="font-display text-[46px] leading-[1.02] font-extrabold tracking-tight">
              {title}
            </h1>
            {subtitle && <p className="mt-2.5 text-slate">{subtitle}</p>}
          </div>
          {switcher && <AuthSwitch current={switcher} />}
          <div>{children}</div>
          {footer && <div className="space-y-2 text-slate">{footer}</div>}
        </div>
      </main>
      <TicketArt />
    </div>
  );
}

function AuthSwitch({ current }: { current: "login" | "signup" }) {
  const links = [
    { id: "login", href: "/login", label: "Log in" },
    { id: "signup", href: "/signup", label: "Sign up" },
  ];

  return (
    <nav aria-label="Log in or sign up" className="grid grid-cols-2 gap-1 rounded-full bg-sand p-1">
      {links.map(({ id, href, label }) => (
        <Link
          key={id}
          href={href}
          aria-current={id === current ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center justify-center rounded-full font-semibold",
            id === current && "bg-card",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

// Three stacked tickets; decoration, so it's hidden from screen readers
function TicketArt() {
  return (
    <aside
      aria-hidden="true"
      className="flex min-h-[420px] min-w-0 flex-1 items-center justify-center overflow-hidden bg-ink px-6 py-12"
    >
      <div className="relative h-[460px] w-full max-w-[380px]">
        <div
          className="absolute inset-[40px_0_0_-46px] -rotate-9 rounded-[28px]"
          style={{ backgroundColor: THEMES.blush.colors.accent }}
        />
        <div
          className="absolute inset-[20px_-46px_20px_0] rotate-8 rounded-[28px]"
          style={{ backgroundColor: THEMES.navy.colors.accent }}
        />
        <div className="absolute inset-0 animate-float">
          <TicketCard
            notchColor="var(--color-ink)"
            className="h-full rounded-[28px] text-ink shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
            stub={
              <p className="px-7 py-6 text-slate">
                Event pages, personal invitations, RSVPs and door check-in in one place.
              </p>
            }
          >
            <div className="flex h-full flex-col justify-end bg-ember p-7">
              <p className="font-mono text-[13px]">Admit one</p>
              <p className="mt-2 font-display text-[50px] leading-none font-extrabold tracking-tight">
                Your guest list, sorted.
              </p>
            </div>
          </TicketCard>
        </div>
      </div>
    </aside>
  );
}

// Form-level error (wrong credentials, rate limits, server errors)
export function FormError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 rounded-[14px] bg-danger/10 p-3 text-sm text-danger">
      {message}
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return (
    <Button type="submit" size="lg" loading={loading} className="w-full">
      {loading ? "Please wait..." : children}
    </Button>
  );
}
