import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDB, mutate } from "@/lib/store";
import { verifyTOTP } from "@/lib/totp";
import { checkRateLimit, RATE_LIMITS, getClientIP } from "@/lib/rateLimit";

// POST /api/auth/mfa-disable — disable MFA (requires current TOTP code)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be logged in." }, { status: 401 });

  const ip = getClientIP(req);
  const rl = checkRateLimit(`mfa-disable:${ip}`, RATE_LIMITS.auth);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code || "").replace(/\s/g, "");

  const db = readDB();
  const fullUser = db.users.find((u) => u.id === user.id);
  if (!fullUser || !fullUser.mfaEnabled || !fullUser.mfaSecret) {
    return NextResponse.json({ error: "MFA is not enabled." }, { status: 400 });
  }

  if (!verifyTOTP(fullUser.mfaSecret, code)) {
    return NextResponse.json({ error: "Invalid authenticator code. MFA not disabled." }, { status: 401 });
  }

  mutate((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (u) {
      u.mfaEnabled = false;
      u.mfaSecret = "";
    }
  });

  return NextResponse.json({ success: true, message: "MFA disabled." });
}
