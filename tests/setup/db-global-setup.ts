/**
 * Runs once before the db test project: applies Prisma migrations to the test database
 */
import { execSync } from "node:child_process";
import { TEST_DATABASE_URL, assertTestDatabase } from "./test-db";

export default function setup(): void {
  assertTestDatabase(TEST_DATABASE_URL);

  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: "pipe",
    });
  } catch (error) {
    const output = (error as { stderr?: Buffer }).stderr?.toString() ?? "";
    throw new Error(
      `Could not migrate the test database. Is it running? Start it with: npm run test:db:up\n\n${output}`,
    );
  }
}
