import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO } from "@/lib/store";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const db = readDB();
  if (db.users.some((u) => u.email === email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const user = {
    id: uid(),
    name,
    email,
    passwordHash: await hashPassword(password),
    // First registered user becomes the admin (owner).
    role: (db.users.length === 0 ? "admin" : "student") as "admin" | "student",
    createdAt: nowISO(),
  };

  mutate((d) => {
    d.users.push(user);
  });

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
