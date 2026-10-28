import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { TooManyRequestsError } from "./errors";
import { createFailureLimiter, createMemoryStore, getClientIp } from "./rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

const limiter = () => createFailureLimiter({ name: "test", maxFailures: 3, windowMs: 60_000 });

async function fail(times: number, l: ReturnType<typeof limiter>, key = "1.2.3.4") {
  for (let i = 0; i < times; i++) await l.recordFailure(key);
}

describe("createFailureLimiter", () => {
  it("allows attempts until maxFailures is reached, then throws 429", async () => {
    const l = limiter();
    await fail(2, l);
    await expect(l.assertAllowed("1.2.3.4")).resolves.toBeUndefined();

    await fail(1, l);
    const error = await l.assertAllowed("1.2.3.4").catch((e) => e);
    expect(error).toBeInstanceOf(TooManyRequestsError);
    expect(error.status).toBe(429);
    expect(error.headers["Retry-After"]).toBe("60");
  });

  it("tracks keys separately", async () => {
    const l = limiter();
    await fail(3, l, "1.1.1.1");
    await expect(l.assertAllowed("2.2.2.2")).resolves.toBeUndefined();
  });

  it("clears the count on reset (a successful attempt)", async () => {
    const l = limiter();
    await fail(3, l);
    await l.reset("1.2.3.4");
    await expect(l.assertAllowed("1.2.3.4")).resolves.toBeUndefined();
  });

  it("allows attempts again once the window has passed", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const l = limiter();
    await fail(3, l);

    vi.setSystemTime(Date.now() + 30_000);
    const error = await l.assertAllowed("1.2.3.4").catch((e) => e);
    expect(error.headers["Retry-After"]).toBe("30");

    vi.setSystemTime(Date.now() + 30_001);
    await expect(l.assertAllowed("1.2.3.4")).resolves.toBeUndefined();
  });
});

describe("createMemoryStore", () => {
  it("never holds more than maxKeys windows", async () => {
    const store = createMemoryStore(2);
    await store.increment("a", 60_000);
    await store.increment("b", 60_000);
    await store.increment("c", 60_000);

    expect(await store.get("a")).toBeUndefined();
    expect(await store.get("c")).toEqual(expect.objectContaining({ count: 1 }));
  });
});

describe("getClientIp", () => {
  const request = (headers: Record<string, string>) =>
    new NextRequest("http://localhost/api/test", { headers });

  it("prefers X-Real-IP", () => {
    expect(getClientIp(request({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" }))).toBe(
      "9.9.9.9",
    );
  });

  it("uses the last X-Forwarded-For hop, which the proxy added", () => {
    expect(getClientIp(request({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("falls back to a shared bucket when no proxy headers are present", () => {
    expect(getClientIp(request({}))).toBe("unknown");
  });
});
