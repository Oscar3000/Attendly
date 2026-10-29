import { getAuth } from "@/server/auth/auth";

/**
 * Better Auth endpoints (sign-up, sign-in, sessions)
 * Moves to /api/auth/[...all] in T-204
 */
export function GET(request: Request) {
  return getAuth().handler(request);
}

export function POST(request: Request) {
  return getAuth().handler(request);
}
