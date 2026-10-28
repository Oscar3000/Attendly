/**
 * Runs once when the Next.js server starts
 * Validates environment variables and exits on failure, so a misconfigured deploy
 * fails immediately instead of serving a 500 on every request
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getEnv } = await import("@/server/env");
    try {
      getEnv();
    } catch (error) {
      console.error(
        `\n${(error as Error).message}\n\nRefusing to start. See CLAUDE.md for the required variables.\n`,
      );
      process.exit(1);
    }
  }
}
