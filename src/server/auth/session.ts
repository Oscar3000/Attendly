/**
 * Signed session tokens (HS256 JWT via jose)
 * Edge-safe (no Node APIs) so middleware can verify tokens too
 * Stopgap until Better Auth replaces admin sessions (T-204)
 */
import { SignJWT, jwtVerify } from "jose";

export type SessionRole = "admin" | "guest";

export interface Session {
  role: SessionRole;
}

export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

const ISSUER = "attendly";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
} as const;

// Throws when misconfigured so a missing secret fails loudly instead of logging everyone out
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(role: SessionRole): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

// Returns the session if the token is genuine, unexpired and has the expected role; otherwise null
export async function verifySession(
  token: string | undefined,
  role: SessionRole,
): Promise<Session | null> {
  if (!token) return null;
  const key = getSecretKey();

  try {
    const { payload } = await jwtVerify(token, key, { issuer: ISSUER, algorithms: ["HS256"] });
    return payload.role === role ? { role } : null;
  } catch {
    return null;
  }
}
