import { connection } from "next/server";
import { isGoogleEnabled } from "@/server/auth/auth";
import { SignupForm } from "./signup-form";

// Rendered per request so Google sign-in follows the runtime env, not the build's
export default async function SignupPage() {
  await connection();
  return <SignupForm googleEnabled={isGoogleEnabled()} />;
}
