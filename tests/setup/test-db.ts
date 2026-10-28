/**
 * Test database connection settings
 * Defaults to the Postgres from docker-compose.test.yml; override with TEST_DATABASE_URL
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://attendly_test:attendly_test@localhost:5433/attendly_test?schema=public";

// Refuse to run destructive helpers against anything that isn't a test database
export function assertTestDatabase(url: string | undefined): void {
  const databaseName = url ? new URL(url).pathname.replace(/^\//, "") : "";

  if (!databaseName.includes("test")) {
    throw new Error(
      `Refusing to use database "${databaseName || "(unset)"}" for tests: the database name must contain "test".`,
    );
  }
}
