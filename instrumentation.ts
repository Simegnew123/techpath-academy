// Next.js Instrumentation — runs once on server startup
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
export async function register() {
  // Only run on the Node.js server (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { autoSeed } = await import("./src/lib/autoseed");
      autoSeed();
    } catch (err) {
      // Don't crash the server if seeding fails — the app can still run
      console.error("[instrumentation] Auto-seed failed (non-fatal):", err);
    }
  }
}
