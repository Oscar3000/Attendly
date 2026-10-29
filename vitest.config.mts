import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./tests/setup/test-db";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside React Server Components; tests run server code directly
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Required by getEnv() but not under test anywhere else; individual tests stub the rest
    env: { ADMIN_EMAIL: "admin@example.com" },
    // db test files share one database, so run files one at a time (root-only option)
    fileParallelism: false,
    projects: [
      {
        // Pure unit tests, no database needed
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.db.test.ts"],
        },
      },
      {
        // Tests against a real Postgres (npm run test:db:up)
        extends: true,
        test: {
          name: "db",
          include: ["src/**/*.db.test.ts"],
          env: { DATABASE_URL: TEST_DATABASE_URL },
          globalSetup: ["tests/setup/db-global-setup.ts"],
          setupFiles: ["tests/setup/db-setup.ts"],
        },
      },
    ],
  },
});
