import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { canSendEmail } from "@/server/email/send-email";
import { AppHeader } from "@/components/admin/app-header";
import { HideOnScanner } from "@/components/admin/hide-on-scanner";
import { VerifyEmailBanner } from "@/components/admin/verify-email-banner";

/**
 * The header and the verify email banner on every dashboard page
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <HideOnScanner>
        {/* Hidden when email isn't configured: the resend button could never succeed */}
        {!user.emailVerified && canSendEmail() && <VerifyEmailBanner email={user.email} />}
        <AppHeader />
      </HideOnScanner>
      {children}
    </>
  );
}
