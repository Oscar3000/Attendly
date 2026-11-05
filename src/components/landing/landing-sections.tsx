import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HowItWorks } from "./how-it-works";

// Only what the product does today; keep in step with the app as features ship
const FEATURES = [
  {
    title: "A page for your event",
    body: "Names, date, venue, dress code, colours of the day and a cover photo, with a countdown. Pick a theme and share one link.",
  },
  {
    title: "Personal invitations",
    body: "Each guest gets their own invitation and QR code. Download it as an image or share it straight to email or WhatsApp.",
  },
  {
    title: "RSVPs in one place",
    body: "See who has confirmed, declined or not answered yet, and how many guests that adds up to, without chasing anyone.",
  },
  {
    title: "Check-in at the door",
    body: "Scan tickets with any phone. Send helpers a link: they need no account, and you can revoke it whenever you like.",
    highlight: true,
  },
];

/**
 * Landing page below the hero: features, how it works, a closing call to action and the footer
 */
export function LandingSections({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="max-w-[760px] font-display text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.02] font-extrabold tracking-tight text-balance">
            Everything your guests need, in one place.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {FEATURES.map(({ title, body, highlight }) => (
              <div
                key={title}
                className={cn(
                  "rounded-3xl border-[1.5px] p-7 transition-transform duration-200 hover:-translate-y-1",
                  highlight ? "border-lime bg-lime" : "border-line bg-card",
                )}
              >
                <h3 className="font-display text-[26px] font-bold tracking-tight">{title}</h3>
                <p className={cn("mt-2.5 leading-relaxed", !highlight && "text-slate")}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="px-6 pb-24">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-8 rounded-[32px] bg-ember px-[clamp(1.5rem,5vw,4rem)] py-[clamp(2.5rem,7vw,5.5rem)]">
          <div className="max-w-[680px]">
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-none font-extrabold tracking-tight">
              Ready to send your invitations?
            </h2>
            <p className="mt-4.5 text-[19px]">
              Set up your event in a few minutes and share it with your guests.
            </p>
          </div>
          <Link
            href={signedIn ? "/dashboard" : "/signup"}
            className={buttonClasses({ variant: "secondary", size: "lg" })}
          >
            {signedIn ? "Go to your events" : "Create your event"}
          </Link>
        </div>
      </section>

      <footer className="px-6 pb-10">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 text-[15px] text-slate">
          <p>© {new Date().getFullYear()} Attendly</p>
          <nav aria-label="Footer" className="flex gap-2">
            {signedIn ? (
              <Link href="/dashboard" className="inline-flex min-h-11 items-center px-2">
                Your events
              </Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex min-h-11 items-center px-2">
                  Log in
                </Link>
                <Link href="/signup" className="inline-flex min-h-11 items-center px-2">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </footer>
    </>
  );
}
