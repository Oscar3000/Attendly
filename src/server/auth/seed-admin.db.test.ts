import { beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { seedAdmin } from "./seed-admin";

beforeAll(() => {
  vi.stubEnv("ADMIN_PASSWORD", "correct-horse");
  vi.stubEnv("BETTER_AUTH_SECRET", "better-auth-test-secret-at-least-32-characters");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
});

const admin = { email: "Admin@Example.com", password: "correct-horse-battery", name: "Admin" };

describe("seedAdmin", () => {
  it("creates the user with a hashed credential password", async () => {
    await expect(seedAdmin(admin)).resolves.toBe("created");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "admin@example.com" },
      include: { accounts: true },
    });
    expect(user.name).toBe("Admin");
    expect(user.accounts).toEqual([expect.objectContaining({ providerId: "credential" })]);
    const hash = user.accounts[0]?.password;
    expect(hash).toBeTruthy();
    expect(hash).not.toContain(admin.password);
  });

  it("leaves an existing user and their password alone", async () => {
    await seedAdmin(admin);
    const before = await prisma.account.findFirstOrThrow();

    await expect(seedAdmin({ ...admin, password: "a-different-password" })).resolves.toBe("exists");

    expect(await prisma.user.count()).toBe(1);
    expect((await prisma.account.findFirstOrThrow()).password).toBe(before.password);
  });
});
