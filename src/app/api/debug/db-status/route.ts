import { NextResponse } from "next/server";
import { readDB } from "@/lib/store";
import fs from "fs";
import path from "path";

/**
 * Public diagnostic endpoint — returns only counts (no sensitive data).
 * Use this to check if the database is being wiped on Render restarts.
 * Visit: https://techpath-academy.onrender.com/api/debug/db-status
 */
export async function GET() {
  const db = readDB();
  let dbFileSize = 0;
  let dbExists = false;
  let dbModified = "unknown";
  try {
    const DATA_DIR = path.join(process.cwd(), "data");
    const DB_FILE = path.join(DATA_DIR, "db.json");
    const stat = fs.statSync(DB_FILE);
    dbExists = true;
    dbFileSize = stat.size;
    dbModified = stat.mtime.toISOString();
  } catch {
    dbExists = false;
  }

  return NextResponse.json({
    status: "ok",
    dbExists,
    dbFileSize,
    dbModified,
    cwd: process.cwd(),
    userCount: db.users.length,
    courseCount: db.courses.length,
    userEmails: db.users.map((u) => ({ email: u.email, role: u.role, hasPassword: !!u.passwordHash })),
    timestamp: new Date().toISOString(),
  });
}
