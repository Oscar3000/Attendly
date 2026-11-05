import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth/auth";

/**
 * The dark bar across the top of every signed-in page
 */
export function AppHeader() {
  return (
    <header className="bg-ink px-6 text-paper">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 py-3">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center font-display text-2xl font-extrabold tracking-tight text-paper"
        >
          attendly
        </Link>
        <nav aria-label="Account" className="flex items-center gap-1 text-[15px] font-medium">
          <Link href="/account" className="inline-flex min-h-11 items-center px-3">
            Account
          </Link>
          <form action={signOut}>
            <button type="submit" className="min-h-11 px-3 font-medium text-paper">
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}

async function signOut() {
  "use server";
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/login");
}
