/**
 * Current Better Auth user for Server Components, server actions and route handlers
 * Reads the session from the request cookies; Better Auth checks it against the database
 * (session.ts is the old T-101 token code and goes away in T-204)
 */
import "server-only";
import { headers } from "next/headers";
import { UnauthorizedError } from "@/server/http/errors";
import { getAuth } from "./auth";

type AuthSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>
>;

export type CurrentUser = AuthSession["user"];

// null when signed out, or when the session is invalid or expired
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

// Throws a 401 ApiError when signed out, so handleRoute turns it into a response
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}
