// Next.js Instrumentation — runs once on server startup
// https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { autoSeed } = await import("./src/lib/autoseed");
    autoSeed();
  }
}
