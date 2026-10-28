/**
 * Failed-attempt rate limiting (fixed window)
 * Only failures count and a success clears the counter, so guests sharing one venue IP
 * aren't locked out by each other's correct PINs
 * The default store is in memory (one app instance); implement RateLimitStore with a shared
 * store such as Redis before running more than one instance
 */
import "server-only";
import type { NextRequest } from "next/server";
import { TooManyRequestsError } from "./errors";

export interface RateLimitWindow {
  count: number;
  resetAt: number;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitWindow | undefined>;
  increment(key: string, windowMs: number): Promise<RateLimitWindow>;
  reset(key: string): Promise<void>;
}

export function createMemoryStore(maxKeys = 10_000): RateLimitStore {
  const windows = new Map<string, RateLimitWindow>();

  const current = (key: string) => {
    const window = windows.get(key);
    if (window && window.resetAt <= Date.now()) {
      windows.delete(key);
      return undefined;
    }
    return window;
  };

  // Keep memory bounded: drop expired windows, then the oldest if still full
  const makeRoom = () => {
    const now = Date.now();
    for (const [key, window] of windows) {
      if (window.resetAt <= now) windows.delete(key);
    }
    if (windows.size >= maxKeys) {
      const oldest = windows.keys().next().value;
      if (oldest !== undefined) windows.delete(oldest);
    }
  };

  return {
    async get(key) {
      return current(key);
    },
    async increment(key, windowMs) {
      const window = current(key);
      if (window) {
        window.count += 1;
        return window;
      }
      if (windows.size >= maxKeys) makeRoom();
      const fresh = { count: 1, resetAt: Date.now() + windowMs };
      windows.set(key, fresh);
      return fresh;
    },
    async reset(key) {
      windows.delete(key);
    },
  };
}

interface FailureLimiterOptions {
  name: string;
  maxFailures: number;
  windowMs: number;
  store?: RateLimitStore;
}

export function createFailureLimiter({
  name,
  maxFailures,
  windowMs,
  store = createMemoryStore(),
}: FailureLimiterOptions) {
  const keyFor = (key: string) => `${name}:${key}`;

  return {
    // Throws 429 (with Retry-After) once maxFailures is reached within the window
    async assertAllowed(key: string): Promise<void> {
      const window = await store.get(keyFor(key));
      if (window && window.count >= maxFailures) {
        throw new TooManyRequestsError(
          Math.max(1, Math.ceil((window.resetAt - Date.now()) / 1000)),
        );
      }
    },
    async recordFailure(key: string): Promise<void> {
      await store.increment(keyFor(key), windowMs);
    },
    async reset(key: string): Promise<void> {
      await store.reset(keyFor(key));
    },
  };
}

// The proxy in front of the app sets X-Real-IP or appends to X-Forwarded-For;
// the last X-Forwarded-For entry is the one the proxy added, earlier ones are client-controlled
export function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  const lastHop = forwarded?.split(",").at(-1)?.trim();
  return lastHop || "unknown";
}
