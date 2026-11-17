import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate } from "@/lib/store";
import { verifyPassword, hashPassword } from "@/lib/auth";

// GET /api/auth/forgot-password?email=xxx — returns the security question (or null)
export async function GET(req: NextRequest) {
  const email = String(req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const db = readDB();
  const user = db.users.find((u) => u.email === email);
  if (!user) {
    // Don't reveal whether the email exists — return a generic message
    return NextResponse.json({ question: null, notFound: true });
  }

  if (!user.securityQuestion || !user.securityAnswerHash) {
    return NextResponse.json({ question: null, notSet: true });
  }

  return NextResponse.json({ question: user.securityQuestion });
}

// POST /api/auth/forgot-password — verify answer + reset password
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const answer = String(body?.answer || "").trim().toLowerCase();
  const newPassword = String(body?.newPassword || "");

  if (!email || !answer || !newPassword) {
    return NextResponse.json({ error: "Email, security answer, and new password are required." }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const db = readDB();
  const user = db.users.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
  }
  if (!user.securityQuestion || !user.securityAnswerHash) {
    return NextResponse.json({ error: "No security question set. Please contact the admin to reset your password." }, { status: 400 });
  }

  if (!verifyPassword(answer, user.securityAnswerHash)) {
    return NextResponse.json({ error: "Incorrect security answer." }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (u) u.passwordHash = newHash;
  });

  return NextResponse.json({ success: true });
}
