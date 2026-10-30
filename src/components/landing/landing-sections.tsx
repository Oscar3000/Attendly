import Link from "next/link";

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
    title: "Any kind of event",
    body: "Weddings, birthdays, company events and more. The wording on pages and invitations follows the kind of event.",
  },
];

const STEPS = [
  { title: "Create your event", body: "Add the date, venue and the details guests need." },
  {
    title: "Add your guests",
    body: "One at a time or a whole list at once, with plus-ones.",
  },
  { title: "Send invitations", body: "Share each guest's invitation and QR code." },
  { title: "Track replies", body: "Watch confirmations come in on your dashboard." },
];

/**
 * Landing page below the hero: features, how it works, a closing call to action and the footer
 */
export function LandingSections({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-black">
            Everything your guests need, in one place
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-[#F0E2D8] p-6">
                <h3 className="text-lg font-semibold text-black">{feature.title}</h3>
                <p className="mt-2 leading-relaxed text-[#555555]">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-4 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-black">How it works</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C07A54] font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-black">{step.title}</h3>
                <p className="mt-1 text-[#555555]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-[#C07A54] px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to send your invitations?</h2>
          <p className="mt-3 text-white/90">
            Set up your event in a few minutes and share it with your guests.
          </p>
          <Link
            href={signedIn ? "/dashboard" : "/signup"}
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-medium text-[#C07A54] transition-opacity hover:opacity-90"
          >
            {signedIn ? "Go to your events" : "Create your event"}
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#F0E2D8] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-[#888888] sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Attendly</p>
          <nav className="flex gap-4">
            {signedIn ? (
              <Link href="/dashboard" className="hover:text-[#C07A54]">
                Your events
              </Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-[#C07A54]">
                  Log in
                </Link>
                <Link href="/signup" className="font-medium text-[#C07A54] hover:underline">
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
