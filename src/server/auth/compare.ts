/**
 * Constant-time secret comparison
 * Both values are hashed first so inputs of different lengths can be compared
 * without leaking the secret's length (timingSafeEqual needs equal-length buffers)
 */
import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

export function secretsMatch(provided: string, expected: string): boolean {
  return timingSafeEqual(digest(provided), digest(expected));
}
