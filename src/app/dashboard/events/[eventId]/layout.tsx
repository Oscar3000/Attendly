import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";
import { canSendEmail } from "@/server/email/send-email";
import { eventRepo } from "@/server/repositories/event.repo";
import { VerifyEmailBanner } from "@/components/admin/verify-email-banner";

/**
 * Server-side gate for every page of one event's dashboard (middleware only checks a session
 * cookie exists). Owning the event is the permission: signed out -> /login, and a missing event
 * or someone else's event -> 404, so event ids can't be probed
 */
export default async function EventDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const event = await eventRepo.findById((await params).eventId);
  if (!event || event.ownerId !== user.id) notFound();

  return (
    <>
      {/* Hidden when email isn't configured: the resend button could never succeed */}
      {!user.emailVerified && canSendEmail() && <VerifyEmailBanner email={user.email} />}
      {children}
    </>
  );
}
