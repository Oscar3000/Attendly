import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth/auth";
import { getCurrentUser, isAdminEmail } from "@/server/auth/current-user";
import { canSendEmail } from "@/server/email/send-email";
import { VerifyEmailBanner } from "@/components/admin/verify-email-banner";

/**
 * Server-side gate for every /admin page (middleware only checks a session cookie exists)
 * Signed out -> /login; signed in with an account other than ADMIN_EMAIL -> "no access"
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) return <NoAccess email={user.email} />;
  return (
    <>
      {/* Hidden when email isn't configured: the resend button could never succeed */}
      {!user.emailVerified && canSendEmail() && <VerifyEmailBanner email={user.email} />}
      {children}
    </>
  );
}

async function signOut() {
  "use server";
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/login");
}

function NoAccess({ email }: { email: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF9F4] px-4 py-8">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        <h1 className="font-inter mb-3 text-xl font-bold text-black">No access yet</h1>
        <p className="font-inter mb-6 text-sm text-[#666666]">
          You&apos;re signed in as <span className="font-medium text-[#333333]">{email}</span>, but
          this dashboard is only available to its owner for now.
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
