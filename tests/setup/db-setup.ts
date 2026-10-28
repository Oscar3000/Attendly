/**
 * Runs in each db test file: start every test from empty tables
 */
import { afterAll, beforeEach } from "vitest";
import { prisma } from "@/server/db/client";
import { resetDb } from "../helpers/db";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
