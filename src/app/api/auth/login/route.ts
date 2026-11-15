import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/store";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  const db = readDB();
  const user = db.users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
