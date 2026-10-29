/**
 * Seeds the admin user: npm run db:seed (also runs after npm run db:reset)
 * Needs the app's env vars plus ADMIN_EMAIL; ADMIN_PASSWORD becomes the account password
 */
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { seedAdmin } from "@/server/auth/seed-admin";

const seedEnvSchema = z.object({
  ADMIN_EMAIL: z.email("ADMIN_EMAIL must be an email address"),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
  ADMIN_NAME: z.string().min(1).default("Admin"),
});

async function main() {
  const result = seedEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(result.error.issues.map((issue) => issue.message).join("\n"));
  }
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name } = result.data;

  const outcome = await seedAdmin({ email, password, name });
  console.log(
    outcome === "created"
      ? `Created admin user ${email}`
      : `Admin user ${email} already exists, left unchanged`,
  );
}

main()
  .catch((error) => {
    console.error(`Seeding failed: ${(error as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
