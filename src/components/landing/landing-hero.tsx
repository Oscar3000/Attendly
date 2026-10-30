import Link from "next/link";

/**
 * Landing page header and hero: what Attendly is, the main call to action, and a sample
 * invitation. Signed-in hosts get a link to their events instead of log in / sign up
 */
export function LandingHero({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="text-xl font-semibold text-black">
          Attendly
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {signedIn ? (
            <PrimaryLink href="/dashboard">Your events</PrimaryLink>
          ) : (
            <>
              <Link href="/login" className="text-[#333333] hover:text-[#C07A54]">
                Log in
              </Link>
              <PrimaryLink href="/signup">Sign up</PrimaryLink>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <div>
          <h1 className="text-4xl leading-tight font-bold text-black sm:text-5xl">
            Invitations and RSVPs, without the spreadsheet
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#555555]">
            Give your wedding, birthday or company event its own page, send every guest a personal
            invitation with a QR code, and watch the replies come in as they happen.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <PrimaryLink href={signedIn ? "/dashboard" : "/signup"} large>
              {signedIn ? "Go to your events" : "Create your event"}
            </PrimaryLink>
            <a href="#how-it-works" className="font-medium text-[#C07A54] hover:underline">
              See how it works
            </a>
          </div>
        </div>

        <SampleInvitation />
      </section>
    </>
  );
}

function PrimaryLink({
  href,
  large = false,
  children,
}: {
  href: string;
  large?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-block rounded-lg bg-[#C07A54] font-medium text-white transition-opacity hover:opacity-90 ${
        large ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"
      }`}
    >
      {children}
    </Link>
  );
}

// A made-up invitation in the style of the ones guests download, drawn with HTML so it stays
// sharp and needs no image; hidden from screen readers since it only illustrates the copy
function SampleInvitation() {
  return (
    <div aria-hidden="true" className="mx-auto w-full max-w-sm">
      <div className="rounded-2xl border-2 border-[#C07A54] bg-white p-2 shadow-[0_12px_40px_rgba(192,122,84,0.18)]">
        <div className="rounded-xl border border-[#E8C9B5] px-8 py-10 text-center">
          <p className="text-5xl font-semibold text-[#C07A54]">A &amp; C</p>
          <p className="mt-4 text-sm font-medium tracking-wide text-[#333333]">
            May 24, 2027 • 4:00 PM
          </p>
          <p className="mt-1 text-xs tracking-[0.2em] text-[#888888] uppercase">Admits 2</p>
          <p className="mt-6 text-sm text-[#555555]">Dear Zelda,</p>
          <p className="mt-2 text-sm leading-relaxed text-[#555555]">
            You have been specially invited to witness and celebrate this beautiful union.
          </p>
          <QrPattern />
          <p className="text-sm font-semibold text-black">The Glasshouse</p>
          <p className="text-xs text-[#888888]">12 Garden Row</p>
          <div className="mt-4 flex justify-center gap-2">
            {["#D4AF37", "#8B4513", "#F5E6D3"].map((color) => (
              <span
                key={color}
                className="h-4 w-4 rounded-full border border-[#E0E0E0]"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Looks like a QR code without being one, so nobody scans the sample
const QR_CELLS = ["1110101", "1010010", "1110111", "0011010", "1101001", "0100111", "1011101"];

function QrPattern() {
  return (
    <div className="mx-auto my-6 grid w-28 grid-cols-7 gap-0.5 rounded-md border border-[#E0E0E0] p-2">
      {QR_CELLS.join("")
        .split("")
        .map((cell, i) => (
          <span key={i} className={`aspect-square ${cell === "1" ? "bg-black" : "bg-white"}`} />
        ))}
    </div>
  );
}
