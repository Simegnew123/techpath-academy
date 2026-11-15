// Smoke test — starts the built server, checks key routes, then exits.
const { spawn } = require("child_process");

const child = spawn(
  "node",
  ["node_modules/next/dist/bin/next", "start", "-p", "3100"],
  { stdio: "ignore", cwd: process.cwd() }
);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  try {
    await wait(7000); // let server boot

    const seed = await fetch("http://localhost:3100/api/seed", { method: "POST" }).then((r) => r.text());
    console.log("SEED:", seed);

    await wait(500);
    const home = await fetch("http://localhost:3100/");
    console.log("HOME status:", home.status);

    const courses = await fetch("http://localhost:3100/courses");
    console.log("COURSES status:", courses.status);

    const reg = await fetch("http://localhost:3100/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", email: "test@example.com", password: "secret123" }),
    }).then((r) => r.json());
    console.log("REGISTER:", JSON.stringify(reg));

    const me = await fetch("http://localhost:3100/api/auth/me", { headers: { cookie: reg._cookie || "" } }).then((r) => r.json());
    console.log("ME (no cookie — expected null):", JSON.stringify(me.user));
  } catch (e) {
    console.log("ERROR:", e.message);
  } finally {
    child.kill();
    process.exit(0);
  }
})();
