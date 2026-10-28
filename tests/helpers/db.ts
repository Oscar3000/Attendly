/**
 * Test database helpers
 */
import { prisma } from "@/server/db/client";
import { assertTestDatabase } from "../setup/test-db";

// Empty every table except Prisma's migration history
export async function resetDb(): Promise<void> {
  assertTestDatabase(process.env.DATABASE_URL);

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const tableList = tables.map(({ tablename }) => `"public"."${tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
}
