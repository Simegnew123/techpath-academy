import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/store";
import { verifyPassword, createSession } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS, getClientIP } from "@/lib/rateLimit";

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

  const db = readDB();
  const user = db.users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
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
