import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate, uid, nowISO, createNotification } from "@/lib/store";
import { hashPassword, createSession } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS, getClientIP } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 registrations per hour per IP
  const ip = getClientIP(req);
  const rl = checkRateLimit(`register:${ip}`, RATE_LIMITS.register);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many registration attempts. Try again in ${rl.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const securityQuestion = String(body?.securityQuestion || "").trim();
  const securityAnswer = String(body?.securityAnswer || "").trim();

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

  const isFirstUser = db.users.length === 0;

  // Hash the security answer (if provided) — store lowercased for case-insensitive comparison
  const answerHash = securityAnswer ? await hashPassword(securityAnswer.toLowerCase()) : "";

  const user = {
    id: uid(),
    name,
    email,
    passwordHash: await hashPassword(password),
    // First registered user becomes the admin (owner).
    role: (isFirstUser ? "admin" : "student") as "admin" | "student",
    createdAt: nowISO(),
    securityQuestion: securityQuestion || "",
    securityAnswerHash: answerHash,
  };

  mutate((d) => {
    d.users.push(user);
  });

  // Welcome notification
  createNotification({
    userId: user.id,
    type: "welcome",
    title: `👋 Welcome to TechPath Academy, ${name.split(" ")[0]}!`,
    message: isFirstUser
      ? "You're the first user — you've been set up as the Admin. Go to the Admin Dashboard to create courses and manage your LMS."
      : "Explore our courses, check out the book library, and start learning today!",
    link: isFirstUser ? "/admin" : "/courses",
  });

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
