import { getAuth } from "@/server/auth/auth";

/**
 * Better Auth endpoints (sign-up, sign-in, sign-out, sessions) at its default basePath
 */
export function GET(request: Request) {
  return getAuth().handler(request);
}

export function POST(request: Request) {
  return getAuth().handler(request);
}
