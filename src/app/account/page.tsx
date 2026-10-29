import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth/auth";
import { getCurrentUser, isAdminEmail } from "@/server/auth/current-user";
import { canSendEmail } from "@/server/email/send-email";
import { AccountSettings, type EmailChange } from "./account-settings";

// Account settings for any signed-in user (not only the dashboard's ADMIN_EMAIL account)
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Accounts that only use Google have no password to change
  const accounts = await getAuth().api.listUserAccounts({ headers: await headers() });
  const hasPassword = accounts.some((account) => account.providerId === "credential");
  const isAdmin = isAdminEmail(user.email);
  // The dashboard is tied to ADMIN_EMAIL, and an email change is confirmed by email
  const emailChange: EmailChange = isAdmin ? "admin" : canSendEmail() ? "allowed" : "unavailable";

  return (
    <AccountSettings
      name={user.name}
      email={user.email}
      emailVerified={user.emailVerified}
      hasPassword={hasPassword}
      isAdmin={isAdmin}
      emailChange={emailChange}
    />
  );
}
