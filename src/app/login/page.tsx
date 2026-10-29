import { connection } from "next/server";
import { isGoogleEnabled } from "@/server/auth/auth";
import { oauthErrorMessage } from "@/lib/auth-errors";
import { LoginForm } from "./login-form";

// Rendered per request so Google sign-in follows the runtime env, not the build's
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await connection();
  const { error } = await searchParams;
  return <LoginForm googleEnabled={isGoogleEnabled()} oauthError={oauthErrorMessage(error)} />;
}
