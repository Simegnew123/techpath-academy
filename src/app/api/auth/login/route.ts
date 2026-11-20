import { NextRequest, NextResponse } from "next/server";
import { readDB, mutate } from "@/lib/store";
import { verifyPassword, createSession } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS, getClientIP } from "@/lib/rateLimit";

// Owner email always gets admin role (auto-promotion on every login)
const OWNER_EMAIL = "ademezerihun2013@gmail.com";

export async function POST(req: NextRequest) {
  // Rate limit: 10 login attempts per 15 minutes per IP
  const ip = getClientIP(req);
  const rl = checkRateLimit(`login:${ip}`, RATE_LIMITS.auth);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${rl.retryAfter} seconds.` },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      }
    );
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    console.log("[login] Missing email or password");
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const db = readDB();
  let user = db.users.find((u) => u.email === email);

  console.log(`[login] email=${email} userFound=${!!user} totalUsers=${db.users.length}`);

  // ── OWNER LOGIN SPECIAL FLOW ──────────────────────────────────
  // Owner email always works — even if the account was wiped or has
  // the wrong role. Guarantees admin access after every login.
  if (email === OWNER_EMAIL) {
    if (!user) {
      const bcrypt = (await import("bcryptjs")).default;
      const { uid, nowISO } = await import("@/lib/store");
      mutate((d) => {
        d.users.push({
          id: uid(),
          name: "Simegnew Ademe",
          email: OWNER_EMAIL,
          passwordHash: bcrypt.hashSync("admin123", 10),
          role: "admin" as const,
          bio: "IT educator and founder of TechPath Academy.",
          avatar: "",
          title: "Founder & Lead Instructor",
          createdAt: nowISO(),
          securityQuestion: "What was the name of your pet?",
          securityAnswerHash: bcrypt.hashSync("techpath", 10),
        });
      });
      user = readDB().users.find((u) => u.email === OWNER_EMAIL) || undefined;
    }
    if (!user || (!verifyPassword(password, user.passwordHash) && password !== "admin123")) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    if (user.role !== "admin") {
      mutate((d) => {
        const u = d.users.find((x) => x.email === OWNER_EMAIL);
        if (u) u.role = "admin" as const;
      });
      user.role = "admin" as const;
    }
  } else {
    // ── NORMAL LOGIN FLOW ────────────────────────────────────────
    if (!user) {
      console.log(`[login] FAIL: user not found. Total users in DB: ${db.users.length}. DB may have been wiped.`);
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    if (!verifyPassword(password, user.passwordHash)) {
      console.log(`[login] FAIL: password mismatch for ${email}`);
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }
  }

  // Check if MFA is enabled for this user
  if (user.mfaEnabled && user.mfaSecret) {
    // Return a special status — frontend will ask for MFA code
    return NextResponse.json({
      mfaRequired: true,
      userId: user.id,
      message: "Enter your 6-digit authenticator code.",
    });
  }

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

// Separate endpoint for MFA verification
export async function PUT(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = checkRateLimit(`mfa:${ip}`, RATE_LIMITS.auth);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const userId = String(body?.userId || "");
  const mfaCode = String(body?.mfaCode || "").replace(/\s/g, "");

  if (!userId || !mfaCode) {
    return NextResponse.json({ error: "User ID and MFA code are required." }, { status: 400 });
  }

  const db = readDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ error: "MFA not enabled for this account." }, { status: 400 });
  }

  const { verifyTOTP } = await import("@/lib/totp");
  if (!verifyTOTP(user.mfaSecret, mfaCode)) {
    return NextResponse.json({ error: "Invalid authenticator code." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
