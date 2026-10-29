import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth/auth";
import { getCurrentUser } from "@/server/auth/current-user";
import { eventRepo } from "@/server/repositories/event.repo";

/**
 * Where sign-in, sign-up and email links land: sends the user to their event's dashboard
 * Until the events list exists (T-310) that's the soonest event; T-310 replaces this with /dashboard
 */
export default async function AdminRedirectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [event] = await eventRepo.listByOwner(user.id);
  if (event) redirect(`/dashboard/events/${event.id}`);

  return <NoEvents email={user.email} />;
}

async function signOut() {
  "use server";
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/login");
}

function NoEvents({ email }: { email: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9F4] px-4 py-8">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        <h1 className="font-inter mb-3 text-xl font-bold text-black">No events yet</h1>
        <p className="font-inter mb-6 text-sm text-[#666666]">
          You&apos;re signed in as <span className="font-medium text-[#333333]">{email}</span>.
          Creating your own events is coming soon.
        </p>
        <Link
          href="/account"
          className="font-inter mb-3 block text-sm font-medium text-[#C07A54] hover:underline"
        >
          Account settings
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="font-inter w-full rounded-lg bg-[#C07A54] px-4 py-2 text-base font-medium text-white transition-all hover:opacity-90"
          >
            Log out
          </button>
        </form>
      </div>
    </main>
  );
}
