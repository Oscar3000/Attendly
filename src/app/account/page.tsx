import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/auth/auth";
import { getCurrentUser } from "@/server/auth/current-user";
import { canSendEmail } from "@/server/email/send-email";
import { AccountSettings, type EmailChange } from "./account-settings";

// Account settings for any signed-in user
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Accounts that only use Google have no password to change
  const accounts = await getAuth().api.listUserAccounts({ headers: await headers() });
  const hasPassword = accounts.some((account) => account.providerId === "credential");
  // An email change is confirmed by email
  const emailChange: EmailChange = canSendEmail() ? "allowed" : "unavailable";

  return (
    <AccountSettings
      name={user.name}
      email={user.email}
      emailVerified={user.emailVerified}
      hasPassword={hasPassword}
      emailChange={emailChange}
    />
  );
}
