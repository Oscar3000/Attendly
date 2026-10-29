/**
 * Runs in each db test file: start every test from empty tables
 */
import { afterAll, beforeEach, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { resetDb } from "../helpers/db";

beforeEach(async () => {
  await resetDb();
  // Sign-ups send a verification email, which sendEmail logs without a Resend key
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(async () => {
  await prisma.$disconnect();
});
