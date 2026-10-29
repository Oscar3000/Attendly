/**
 * Creates the admin's Better Auth account, so the existing admin can log in after the cutover (T-204)
 * Goes through signUpEmail so the password is hashed and stored on Account like any other sign-up
 */
import "server-only";
import { prisma } from "@/server/db/client";
import { getAuth } from "./auth";

export interface AdminSeed {
  email: string;
  password: string;
  name: string;
}

// Idempotent: an existing user is left alone, including their password
export async function seedAdmin({
  email,
  password,
  name,
}: AdminSeed): Promise<"created" | "exists"> {
  // Checked up front because sign-up hides duplicates once email verification is required (T-207)
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return "exists";

  await getAuth().api.signUpEmail({ body: { email, password, name } });
  return "created";
}
