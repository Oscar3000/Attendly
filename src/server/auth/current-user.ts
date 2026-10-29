/**
 * Current Better Auth user for Server Components, server actions and route handlers
 * Reads the session from the request cookies; Better Auth checks it against the database
 * Route handlers pass request.headers; pages and actions omit it and next/headers is used
 */
import "server-only";
import { headers } from "next/headers";
import { getEnv } from "@/server/env";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";
import { getAuth } from "./auth";

type AuthSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>
>;

export type CurrentUser = AuthSession["user"];

// null when signed out, or when the session is invalid or expired
export async function getCurrentUser(requestHeaders?: Headers): Promise<CurrentUser | null> {
  // Read headers before getAuth(): headers() marks a page dynamic, so `next build` doesn't
  // prerender it and build the auth instance without runtime env vars
  const sessionHeaders = requestHeaders ?? (await headers());
  const session = await getAuth().api.getSession({ headers: sessionHeaders });
  return session?.user ?? null;
}

// Throws a 401 ApiError when signed out, so handleRoute turns it into a response
export async function requireUser(requestHeaders?: Headers): Promise<CurrentUser> {
  const user = await getCurrentUser(requestHeaders);
  if (!user) throw new UnauthorizedError();
  return user;
}

// Every account can sign in, but only ADMIN_EMAIL may use the dashboard until
// invitations are scoped per owner (Phase 3)
export function isAdminEmail(email: string): boolean {
  return email.toLowerCase() === getEnv().ADMIN_EMAIL.toLowerCase();
}

// requireUser(), plus a 403 for any account other than ADMIN_EMAIL
export async function requireAdminUser(requestHeaders?: Headers): Promise<CurrentUser> {
  const user = await requireUser(requestHeaders);
  if (!isAdminEmail(user.email)) throw new ForbiddenError();
  return user;
}
