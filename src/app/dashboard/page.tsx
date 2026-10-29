import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth/auth";
import { getCurrentUser } from "@/server/auth/current-user";
import { canSendEmail } from "@/server/email/send-email";
import { eventRepo } from "@/server/repositories/event.repo";
import { formatEventDateTime } from "@/lib/timezones";
import { VerifyEmailBanner } from "@/components/admin/verify-email-banner";

const TYPE_LABELS = {
  WEDDING: "Wedding",
  BIRTHDAY: "Birthday",
  CORPORATE: "Corporate",
  OTHER: "Event",
} as const;

/**
 * The signed-in user's events, soonest first. Where sign-in and email links land
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const events = await eventRepo.listByOwner(user.id);

  return (
    <>
      {!user.emailVerified && canSendEmail() && <VerifyEmailBanner email={user.email} />}
      <main className="min-h-screen bg-[#FFF9F4] px-4 py-6 sm:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-inter text-2xl font-bold text-gray-900 sm:text-4xl">Your events</h1>
            <div className="flex gap-3">
              <Link
                href="/dashboard/events/new"
                className="font-inter flex-1 rounded-lg bg-[#C07A54] px-4 py-2 text-center text-sm font-medium text-white hover:opacity-90 sm:flex-none sm:text-base"
              >
                New event
              </Link>
              <Link
                href="/account"
                className="font-inter flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-none sm:text-base"
              >
                Account
              </Link>
              <form action={signOut} className="flex flex-1 sm:flex-none">
                <button
                  type="submit"
                  className="font-inter w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:text-base"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              <h2 className="font-inter mb-2 text-lg font-bold text-black">No events yet</h2>
              <p className="font-inter mb-6 text-sm text-[#666666]">
                Create your first event, then add guests and send their invitations.
              </p>
              <Link
                href="/dashboard/events/new"
                className="font-inter inline-block rounded-lg bg-[#C07A54] px-6 py-2 font-medium text-white hover:opacity-90"
              >
                Create an event
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="block rounded-lg bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                  >
                    <p className="font-inter mb-1 text-xs font-medium tracking-wide text-[#C07A54] uppercase">
                      {TYPE_LABELS[event.type]}
                    </p>
                    <h2 className="font-inter text-lg font-bold text-black">{event.title}</h2>
                    <p className="font-inter mt-1 text-sm text-[#666666]">
                      {formatEventDateTime(event.date, event.timezone)}
                      {(event.venueName ?? event.venueAddress) &&
                        ` · ${event.venueName ?? event.venueAddress}`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

async function signOut() {
  "use server";
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/login");
}
