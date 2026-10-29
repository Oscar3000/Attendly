/**
 * T-303 backfill: npm run db:backfill-wedding
 * Needs DATABASE_URL and ADMIN_EMAIL (the account from npm run db:seed). Run it before T-304
 */
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { backfillWeddingEvent } from "@/server/backfill/wedding-event";

async function main() {
  const adminEmail = z
    .email("ADMIN_EMAIL must be an email address")
    .safeParse(process.env.ADMIN_EMAIL);
  if (!adminEmail.success) throw new Error("ADMIN_EMAIL must be set to the admin's email address");

  const result = await backfillWeddingEvent(adminEmail.data);
  console.log(
    [
      `${result.eventCreated ? "Created" : "Reused"} event pamela-and-oscar (${result.eventId})`,
      `Linked ${result.invitationsLinked} invitation(s) that had no event`,
    ].join("\n"),
  );
}

main()
  .catch((error) => {
    console.error(`Backfill failed: ${(error as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
